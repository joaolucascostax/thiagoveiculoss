// Importa o estoque de veículos a partir do feed XML público mantido pela loja.
// Upsert por external_id; veículos com source='feed' ausentes no feed são desativados.
// Autenticação: token de cron (LOVABLE_CRON_SECRET) OU JWT de um usuário admin.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("LOVABLE_CRON_SECRET");
const CRON_SECRET_PREVIOUS = Deno.env.get("LOVABLE_CRON_SECRET_PREVIOUS");
const FEED_SYNC_TOKEN = Deno.env.get("FEED_SYNC_TOKEN");

const FEED_URL =
  "https://autoconf-prod.s3.sa-east-1.amazonaws.com/estoque-site/ZC9lCY5qT0Tu3RJ5n1fBh5CsOCLjdrMEyhXeQHEH.xml";

const MAX_IMAGES = 20;

/* ---------------- XML ---------------- */

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(xml: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml);
  return m ? decodeEntities(m[1]) : "";
}

function tagAll(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const v = decodeEntities(m[1]);
    if (v) out.push(v);
  }
  return out;
}

/* ---------------- mapeamento ---------------- */

function priceNumber(raw: string): number {
  const s = String(raw ?? "").replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function mileageLabel(raw: string): string {
  const n = Number(String(raw ?? "").replace(/\D/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "0 KM";
  return `${n.toLocaleString("pt-BR")} KM`;
}

function transmissionLabel(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("manual")) return "MANUAL";
  if (s.includes("autom") || s.includes("cvt") || s.includes("dsg")) return "AUTOMÁTICO";
  return "AUTOMÁTICO";
}

function fuelLabel(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("elect") || s.includes("elét") || s.includes("elet")) return "ELÉTRICO";
  if (s.includes("hybrid") || s.includes("híbr") || s.includes("hibr")) return "HÍBRIDO";
  if (s.includes("diesel")) return "DIESEL";
  if (s.includes("flex") || s.includes("ethanol") || s.includes("etanol") || s.includes("álcool")) return "FLEX";
  if (s.includes("gas")) return "GASOLINA";
  return "FLEX";
}

function yearOnly(raw: string): string {
  const m = String(raw ?? "").match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : String(raw ?? "").trim();
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .trim();
}

function bodyTypeLabel(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("hatch")) return "Hatch";
  if (s.includes("picape") || s.includes("pickup") || s.includes("pick-up")) return "Picape";
  if (s.includes("sed")) return "Sedã";
  if (s.includes("suv") || s.includes("utilitário esportivo")) return "SUV";
  if (s.includes("cupê") || s.includes("coupe") || s.includes("convers")) return "Cupê/Conversível";
  if (s.includes("van") || s.includes("utilitário")) return "Van/Utilitário";
  if (s.includes("carroceria") || s.includes("caminh")) return "Caminhão";
  if (s.includes("naked") || s.includes("custom") || s.includes("moto")) return "Moto";
  return raw ? titleCase(raw) : "";
}

type VehicleRow = {
  external_id: string;
  source: string;
  brand: string;
  model: string;
  body_type: string;
  year: string;
  price: number;
  mileage: string;
  transmission: string;
  fuel: string;
  color: string;
  description: string;
  images: string[];
  is_new: boolean;
  is_active: boolean;
};

function mapAd(ad: string): VehicleRow | null {
  const externalId = tag(ad, "ID");
  if (!externalId) return null;

  const brand = tag(ad, "MAKE");
  const baseModel = tag(ad, "MODEL");
  const version = tag(ad, "VERSION");
  const model = (version || baseModel).trim();
  if (!brand || !model) return null;

  const images = tagAll(ad, "IMAGE_URL").slice(0, MAX_IMAGES);
  const mileageNum = Number(tag(ad, "MILEAGE").replace(/\D/g, "")) || 0;
  const condition = tag(ad, "CONDITION").toLowerCase();

  return {
    external_id: externalId,
    source: "feed",
    brand,
    model,
    body_type: bodyTypeLabel(tag(ad, "BODY") || tag(ad, "BODY_TYPE")),
    year: yearOnly(tag(ad, "YEAR")),
    price: priceNumber(tag(ad, "PRICE") || tag(ad, "REGULAR_PRICE")),
    mileage: mileageLabel(String(mileageNum)),
    transmission: transmissionLabel(tag(ad, "gear")),
    fuel: fuelLabel(tag(ad, "FUEL")),
    color: titleCase(tag(ad, "COLOR")),
    description: tag(ad, "DESCRIPTION"),
    images,
    is_new: condition.includes("novo") && !condition.includes("semi") && mileageNum <= 1000,
    is_active: true,
  };
}


/* ---------------- auth ---------------- */

function hasValidCronToken(req: Request): boolean {
  const m = /^Bearer ([^\s,]+)$/.exec(req.headers.get("authorization") ?? "");
  const token = m?.[1] ?? req.headers.get("x-feed-sync-token") ?? "";
  if (!token) return false;
  if (FEED_SYNC_TOKEN && token === FEED_SYNC_TOKEN) return true;
  if (!CRON_SECRET) return false;
  return token === CRON_SECRET || (!!CRON_SECRET_PREVIOUS && token === CRON_SECRET_PREVIOUS);
}


async function isAdminRequest(req: Request, admin: ReturnType<typeof createClient>) {
  const m = /^Bearer ([^\s,]+)$/.exec(req.headers.get("authorization") ?? "");
  const token = m?.[1];
  if (!token) return false;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!roles;
}

/* ---------------- handler ---------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const authorized = hasValidCronToken(req) || (await isAdminRequest(req, supabase));
  if (!authorized) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: logRow } = await supabase
    .from("feed_imports")
    .insert({})
    .select("id")
    .single();
  const logId = logRow?.id as string | undefined;

  const fail = async (message: string, status = 500) => {
    if (logId) {
      await supabase
        .from("feed_imports")
        .update({ finished_at: new Date().toISOString(), error: message })
        .eq("id", logId);
    }
    console.error("[vehicles-feed-sync]", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  try {
    const resp = await fetch(FEED_URL, { headers: { "Cache-Control": "no-cache" } });
    if (!resp.ok) return await fail(`feed_http_${resp.status}`, 502);
    const text = await resp.text();

    const ads = text.match(/<AD>[\s\S]*?<\/AD>/gi) ?? [];
    if (ads.length === 0) return await fail("feed_empty", 502);

    const feedVehicles: VehicleRow[] = [];
    const seen = new Set<string>();

    for (const ad of ads) {
      const mapped = mapAd(ad);
      if (!mapped || seen.has(mapped.external_id)) continue;
      seen.add(mapped.external_id);
      feedVehicles.push(mapped);
    }


    if (feedVehicles.length === 0) return await fail("no_valid_rows", 502);

    const { data: existing, error: exErr } = await supabase
      .from("vehicles")
      .select("id, external_id, is_active, display_order")
      .eq("source", "feed");
    if (exErr) return await fail(`db_read: ${exErr.message}`, 500);

    const existingMap = new Map(
      (existing ?? []).filter((v) => v.external_id).map((v) => [v.external_id as string, v])
    );

    let created = 0;
    let updated = 0;

    // display_order sequencial mantendo a ordem do feed, começando após os manuais.
    const { data: maxManual } = await supabase
      .from("vehicles")
      .select("display_order")
      .eq("source", "manual")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    let order = (maxManual?.display_order ?? 0) + 1;

    for (const v of feedVehicles) {
      const prev = existingMap.get(v.external_id);
      const payload = { ...v, display_order: order++ };
      if (prev) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", prev.id);
        if (error) console.error("[vehicles-feed-sync] update", v.external_id, error.message);
        else updated++;
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) console.error("[vehicles-feed-sync] insert", v.external_id, error.message);
        else created++;
      }
    }

    const stale = (existing ?? []).filter(
      (v) => v.is_active && v.external_id && !seen.has(v.external_id as string)
    );
    let deactivated = 0;
    if (stale.length > 0) {
      const { error } = await supabase
        .from("vehicles")
        .update({ is_active: false })
        .in("id", stale.map((v) => v.id));
      if (error) console.error("[vehicles-feed-sync] deactivate", error.message);
      else deactivated = stale.length;
    }

    if (logId) {
      await supabase
        .from("feed_imports")
        .update({
          finished_at: new Date().toISOString(),
          created_count: created,
          updated_count: updated,
          deactivated_count: deactivated,
          total_in_feed: feedVehicles.length,
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total_in_feed: feedVehicles.length,
        created,
        updated,
        deactivated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return await fail(`unexpected: ${err instanceof Error ? err.message : String(err)}`, 500);
  }
});
