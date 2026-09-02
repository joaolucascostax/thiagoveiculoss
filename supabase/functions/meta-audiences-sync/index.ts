// Sincroniza Custom Audiences no Meta com dados da plataforma.
// Cria/atualiza 3 públicos:
//   1. Visitantes 90d — todas sessões com ViewContent
//   2. Leads 90d — quem clicou no WhatsApp (tabela leads)
//   3. Compradores — leads com status = vendido
//
// Envia identificadores hash SHA-256 (fbp/fbc/telefone) para Meta.
//
// Env vars: META_CAPI_ACCESS_TOKEN, META_AD_ACCOUNT_ID (formato act_...)

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const ACCESS_TOKEN =
  Deno.env.get("META_ADS_ACCESS_TOKEN") ?? Deno.env.get("META_CAPI_ACCESS_TOKEN");
const AD_ACCOUNT_ID = Deno.env.get("META_AD_ACCOUNT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function findOrCreateAudience(name: string, description: string): Promise<string> {
  // procura audience por nome
  const listUrl =
    `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/customaudiences` +
    `?fields=id,name&limit=200&access_token=${encodeURIComponent(ACCESS_TOKEN!)}`;
  const listResp = await fetch(listUrl);
  const listJson = await listResp.json();
  if (!listResp.ok) throw new Error(`list_failed: ${JSON.stringify(listJson)}`);

  const existing = (listJson.data ?? []).find((a: { name: string }) => a.name === name);
  if (existing) return existing.id;

  // cria nova
  const createUrl = `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/customaudiences`;
  const createResp = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      subtype: "CUSTOM",
      customer_file_source: "USER_PROVIDED_ONLY",
      access_token: ACCESS_TOKEN,
    }),
  });
  const createJson = await createResp.json();
  if (!createResp.ok) throw new Error(`create_failed: ${JSON.stringify(createJson)}`);
  return createJson.id;
}

async function pushUsers(
  audienceId: string,
  users: { phone?: string | null; session_id?: string | null }[]
): Promise<number> {
  if (users.length === 0) return 0;

  // Meta Custom Audiences aceita PII hasheada (PHONE, EMAIL) e EXTERN_ID (id próprio).
  // Não aceita FBP/FBC. Usamos multi-key schema: cada linha pode ter PHONE e/ou EXTERN_ID.
  // EXTERN_ID = session_id (mesmo valor enviado no Pixel via advanced matching → casa com
  // Website Custom Audiences). Isso desbloqueia visitantes anônimos (sem telefone).
  const schema = ["PHONE", "EXTERN_ID"];
  const data: string[][] = [];
  const seen = new Set<string>();
  for (const u of users) {
    const digits = u.phone ? u.phone.replace(/\D/g, "") : "";
    const phoneHash = digits ? await sha256(digits) : "";
    const extId = u.session_id ? await sha256(u.session_id) : "";
    if (!phoneHash && !extId) continue;
    const key = `${phoneHash}|${extId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    data.push([phoneHash, extId]);
  }
  if (data.length === 0) return 0;

  const url = `https://graph.facebook.com/v19.0/${audienceId}/users`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload: { schema, data },
      access_token: ACCESS_TOKEN,
    }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`push_failed: ${JSON.stringify(json)}`);
  return data.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    return new Response(JSON.stringify({ error: "meta_not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();

  try {
    // ---- Público 1: Visitantes (session_id de vehicle_events) ----
    const { data: visitors } = await supabase
      .from("vehicle_events")
      .select("session_id")
      .gte("created_at", since)
      .not("session_id", "is", null);

    const visitorSessions = new Set<string>();
    (visitors ?? []).forEach((v) => {
      if (v.session_id) visitorSessions.add(v.session_id);
    });
    const visitorUsers = Array.from(visitorSessions).map((s) => ({ session_id: s }));

    // ---- Públicos 2 e 3 (leads) ----
    const { data: leads } = await supabase
      .from("leads")
      .select("phone, session_id, status")
      .gte("created_at", since);

    const leadUsers = (leads ?? []).map((l) => ({ phone: l.phone, session_id: l.session_id }));
    const buyers = (leads ?? [])
      .filter((l) => l.status === "vendido")
      .map((l) => ({ phone: l.phone, session_id: l.session_id }));

    // Cria/atualiza os 3 públicos
    const visitorsAudienceId = await findOrCreateAudience(
      "Thiago Veículos - Visitantes 90d",
      "Visitantes do site nos últimos 90 dias — auto-sync"
    );
    const leadsAudienceId = await findOrCreateAudience(
      "Thiago Veículos - Leads 90d",
      "Leads (WhatsApp) dos últimos 90 dias — auto-sync"
    );
    const buyersAudienceId = await findOrCreateAudience(
      "Thiago Veículos - Compradores",
      "Clientes que compraram — auto-sync (base para Lookalike)"
    );

    const [visitorsPushed, leadsPushed, buyersPushed] = await Promise.all([
      pushUsers(visitorsAudienceId, visitorUsers),
      pushUsers(leadsAudienceId, leadUsers),
      pushUsers(buyersAudienceId, buyers),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        audiences: {
          visitors: { id: visitorsAudienceId, pushed: visitorsPushed, total: visitorUsers.length },
          leads: { id: leadsAudienceId, pushed: leadsPushed, total: leadUsers.length },
          buyers: { id: buyersAudienceId, pushed: buyersPushed, total: buyers.length },
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[meta-audiences-sync] failed", err);
    const detail = String(err);
    const isTokenError = detail.includes('"code":190');
    // Meta devolve error_user_msg legível para casos como termos não aceitos
    let userMsg: string | undefined;
    const match = detail.match(/"error_user_msg":"((?:[^"\\]|\\.)*)"/);
    if (match) {
      try {
        userMsg = JSON.parse(`"${match[1]}"`);
      } catch {
        userMsg = match[1];
      }
    }
    const isConfigError = isTokenError || !!userMsg;
    return new Response(
      JSON.stringify({
        error: isTokenError ? "invalid_meta_token" : userMsg ? "meta_config_error" : "sync_failed",
        message:
          userMsg ??
          (isTokenError
            ? "O token de acesso do Meta Ads (META_ADS_ACCESS_TOKEN) é inválido ou expirou. Gere um novo token no Gerenciador de Negócios e atualize o segredo."
            : "Falha ao sincronizar públicos com o Meta."),
        detail,
      }),
      {
        status: isConfigError ? 400 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );


  }
});
