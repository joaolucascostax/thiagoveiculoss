// Gera relatório semanal de performance e grava em weekly_reports.
// Pode ser chamada manualmente pelo admin ou via pg_cron toda segunda 08h.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();
  const periodEnd = now.toISOString().slice(0, 10);
  const periodStart = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const sinceIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  try {
    // Gasto e campanhas
    const { data: campaigns } = await supabase
      .from("meta_campaigns")
      .select("campaign_id, campaign_name, spend, clicks, impressions")
      .gte("date", periodStart);

    const spend = (campaigns ?? []).reduce((s, c) => s + Number(c.spend ?? 0), 0);

    // top campaign por gasto
    const campMap = new Map<string, { name: string; spend: number; clicks: number }>();
    (campaigns ?? []).forEach((c) => {
      const prev = campMap.get(c.campaign_id) ?? { name: c.campaign_name, spend: 0, clicks: 0 };
      prev.spend += Number(c.spend ?? 0);
      prev.clicks += Number(c.clicks ?? 0);
      campMap.set(c.campaign_id, prev);
    });
    const topCampaign =
      Array.from(campMap.values()).sort((a, b) => b.spend - a.spend)[0] ?? null;

    // Leads
    const { data: leads } = await supabase
      .from("leads")
      .select("id, status, sale_value, vehicle_id, utm_campaign, vehicles(brand, model, year)")
      .gte("created_at", sinceIso);

    const leadsCount = leads?.length ?? 0;
    const qualifiedCount = leads?.filter((l) => l.status === "qualificado" || l.status === "vendido").length ?? 0;
    const soldCount = leads?.filter((l) => l.status === "vendido").length ?? 0;
    const revenue = (leads ?? []).filter((l) => l.status === "vendido").reduce((s, l) => s + Number(l.sale_value ?? 0), 0);

    const cpl = leadsCount > 0 ? spend / leadsCount : null;
    const roas = spend > 0 ? revenue / spend : null;

    // top vehicles (por número de leads na semana)
    const vehMap = new Map<string, { name: string; count: number }>();
    (leads ?? []).forEach((l) => {
      if (!l.vehicle_id || !l.vehicles) return;
      const v = l.vehicles as unknown as { brand: string; model: string; year: string };
      const name = `${v.brand} ${v.model} ${v.year}`;
      const prev = vehMap.get(l.vehicle_id) ?? { name, count: 0 };
      prev.count += 1;
      vehMap.set(l.vehicle_id, prev);
    });
    const topVehicles = Array.from(vehMap.values()).sort((a, b) => b.count - a.count).slice(0, 3);

    // CPL alerts — cruza gasto da campanha (Meta) com leads atribuídos via utm_campaign
    const { data: targets } = await supabase.from("meta_campaign_targets").select("campaign_name, cpl_target");
    const cplAlerts: { campaign: string; cpl: number; target: number }[] = [];
    for (const t of targets ?? []) {
      const camp = Array.from(campMap.values()).find((c) => c.name === t.campaign_name);
      if (!camp || camp.spend === 0) continue;
      const leadsForCamp = (leads ?? []).filter((l) => l.utm_campaign === t.campaign_name).length;
      if (leadsForCamp === 0) continue;
      const campCpl = camp.spend / leadsForCamp;
      if (campCpl > Number(t.cpl_target)) {
        cplAlerts.push({ campaign: t.campaign_name, cpl: Number(campCpl.toFixed(2)), target: Number(t.cpl_target) });
      }
    }

    const { data: inserted, error } = await supabase
      .from("weekly_reports")
      .upsert(
        {
          period_start: periodStart,
          period_end: periodEnd,
          spend,
          leads_count: leadsCount,
          qualified_count: qualifiedCount,
          sold_count: soldCount,
          revenue,
          cpl,
          roas,
          top_vehicles: topVehicles,
          top_campaign: topCampaign,
          cpl_alerts: cplAlerts,
        },
        { onConflict: "period_start,period_end" }
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, report: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[weekly-report] failed", err);
    return new Response(JSON.stringify({ error: "report_failed", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
