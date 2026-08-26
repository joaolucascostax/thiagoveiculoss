// Sincroniza métricas do Meta Ads (campanha, conjunto e anúncio).
//  - meta_campaigns    → nível campanha (compatibilidade com telas existentes)
//  - meta_ad_insights  → níveis adset e ad (semáforo de ação)
//
// Env vars esperadas:
//  - META_ADS_ACCESS_TOKEN    (precisa de ads_read / read_insights)
//  - META_AD_ACCOUNT_ID       (formato "act_123456789")

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ACCESS_TOKEN =
  Deno.env.get("META_ADS_ACCESS_TOKEN") ?? Deno.env.get("META_CAPI_ACCESS_TOKEN");
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Insight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
}

function graphUrl(level: "campaign" | "adset" | "ad", since: string, until: string) {
  const base = ["spend", "impressions", "clicks", "reach", "campaign_id", "campaign_name"];
  if (level === "adset" || level === "ad") base.push("adset_id", "adset_name");
  if (level === "ad") base.push("ad_id", "ad_name");
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  return (
    `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/insights` +
    `?level=${level}&time_increment=1&time_range=${timeRange}` +
    `&fields=${base.join(",")}&limit=500&access_token=${encodeURIComponent(ACCESS_TOKEN!)}`
  );
}

async function fetchLevel(level: "campaign" | "adset" | "ad", since: string, until: string) {
  const resp = await fetch(graphUrl(level, since, until));
  const json = await resp.json();
  if (!resp.ok) return { ok: false as const, json };
  return { ok: true as const, data: (json.data ?? []) as Insight[] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({ error: "meta_ads_not_configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // O painel envia { days } no corpo; mantemos a query string como fallback.
  const url = new URL(req.url);
  let bodyDays: number | undefined;
  try {
    const body = await req.json();
    if (body && typeof body === "object" && body.days != null) bodyDays = Number(body.days);
  } catch {
    /* sem corpo */
  }
  const rawDays = bodyDays ?? Number(url.searchParams.get("days") ?? "30");
  const days = Math.min(90, Math.max(1, Number.isFinite(rawDays) ? rawDays : 30));
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  try {
    const campaign = await fetchLevel("campaign", since, until);
    if (!campaign.ok) {
      console.error("[meta-ads-sync] Graph API error", campaign.json);
      const fbErr = (campaign.json as Record<string, any>)?.error ?? {};
      const msg = String(fbErr.message ?? "");
      const isAccessBlocked = fbErr.type === "OAuthException" || /access blocked|permission|token/i.test(msg);
      return new Response(
        JSON.stringify({
          ok: false,
          error: isAccessBlocked ? "meta_access_blocked" : "graph_api_error",
          hint: isAccessBlocked
            ? "Token sem permissão nessa Ad Account. No Meta Business Settings, atribua a Ad Account ao System User (Assign Assets) com papel Admin/Analyst, gere um novo token com escopos ads_read + read_insights + ads_management e atualize a secret META_CAPI_ACCESS_TOKEN. Confirme também que META_AD_ACCOUNT_ID começa com 'act_' e pertence ao mesmo Business Manager."
            : undefined,
          detail: campaign.json,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [adset, ad] = await Promise.all([
      fetchLevel("adset", since, until),
      fetchLevel("ad", since, until),
    ]);

    const num = (v?: string) => Number(v ?? 0);

    const campaignRows = campaign.data.map((i) => ({
      campaign_id: i.campaign_id!,
      campaign_name: i.campaign_name ?? "",
      date: i.date_start,
      spend: num(i.spend),
      impressions: num(i.impressions),
      clicks: num(i.clicks),
      reach: num(i.reach),
    }));

    const detailRows = [
      ...(adset.ok ? adset.data : []).map((i) => ({
        level: "adset",
        object_id: i.adset_id!,
        date: i.date_start,
        campaign_id: i.campaign_id ?? null,
        campaign_name: i.campaign_name ?? null,
        adset_id: i.adset_id ?? null,
        adset_name: i.adset_name ?? null,
        ad_id: null as string | null,
        ad_name: null as string | null,
        spend: num(i.spend),
        impressions: num(i.impressions),
        clicks: num(i.clicks),
        reach: num(i.reach),
      })),
      ...(ad.ok ? ad.data : []).map((i) => ({
        level: "ad",
        object_id: i.ad_id!,
        date: i.date_start,
        campaign_id: i.campaign_id ?? null,
        campaign_name: i.campaign_name ?? null,
        adset_id: i.adset_id ?? null,
        adset_name: i.adset_name ?? null,
        ad_id: i.ad_id ?? null,
        ad_name: i.ad_name ?? null,
        spend: num(i.spend),
        impressions: num(i.impressions),
        clicks: num(i.clicks),
        reach: num(i.reach),
      })),
    ].filter((r) => r.object_id);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const stamp = async () => {
      const { data: s } = await supabase.from("store_settings").select("id").limit(1).single();
      if (s?.id) {
        await supabase
          .from("store_settings")
          .update({ meta_last_sync_at: new Date().toISOString() })
          .eq("id", s.id);
      }
    };

    if (campaignRows.length > 0) {
      const { error } = await supabase
        .from("meta_campaigns")
        .upsert(campaignRows, { onConflict: "campaign_id,date" });
      if (error) {
        console.error("[meta-ads-sync] upsert campaigns error", error);
        return new Response(JSON.stringify({ error: "db_error", detail: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (detailRows.length > 0) {
      const { error } = await supabase
        .from("meta_ad_insights")
        .upsert(detailRows, { onConflict: "level,object_id,date" });
      if (error) console.error("[meta-ads-sync] upsert insights error", error);
    }

    await stamp();

    return new Response(
      JSON.stringify({
        ok: true,
        upserted: campaignRows.length,
        adsets: adset.ok ? adset.data.length : 0,
        ads: ad.ok ? ad.data.length : 0,
        days,
        since,
        until,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[meta-ads-sync] failed", err);
    return new Response(JSON.stringify({ error: "network_error" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
