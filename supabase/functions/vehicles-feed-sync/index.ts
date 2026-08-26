// Importa o estoque de veículos a partir do CSV público mantido pela loja.
// Upsert por external_id; veículos com source='feed' ausentes no CSV são desativados.
// Autenticação: token de cron (LOVABLE_CRON_SECRET) OU JWT de um usuário admin.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("LOVABLE_CRON_SECRET");
const CRON_SECRET_PREVIOUS = Deno.env.get("LOVABLE_CRON_SECRET_PREVIOUS");

const FEED_URL =
  "https://raw.githubusercontent.com/joaolucascostax/thiago2/main/docs/catalog_vehicles.csv";

const MAX_IMAGES = 20;

/* ---------------- CSV ---------------- */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (c === "\r") {
      /* ignora */
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/* ---------------- mapeamento ---------------- */

function priceNumber(raw: string): number {
  const n = Number(String(raw ?? "").replace(/[^\d.]/g, ""));
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
  if (s.includes("autom")) return "AUTOMÁTICO";
  return "AUTOMÁTICO";
}

function fuelLabel(raw: string): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("elect") || s.includes("elet")) return "ELÉTRICO";
  if (s.includes("hybrid") || s.includes("hibr")) return "HÍBRIDO";
  if (s.includes("diesel")) return "DIESEL";
  if (s.includes("flex") || s.includes("ethanol") || s.includes("etanol")) return "FLEX";
  if (s.includes("gas")) return "GASOLINA";
  return "FLEX";
}

function yearOnly(raw: string): string {
  const m = String(raw ?? "").match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : String(raw ?? "").trim();
}

type VehicleRow = {
  external_id: string;
  source: string;
  brand: string;
  model: string;
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

function mapRow(get: (k: string) => string): VehicleRow | null {
  const externalId = (get("vehicle_id") || get("id")).trim();
  if (!externalId) return null;

  const brand = (get("make") || "").trim();
  const trim = (get("trim") || "").trim();
  const baseModel = (get("model") || "").trim();
  const model = [baseModel, trim].filter(Boolean).join(" ").trim() || (get("title") || "").trim();
  if (!brand || !model) return null;

  const images: string[] = [];
  for (let i = 0; i < MAX_IMAGES; i++) {
    const u = (get(`image[${i}].url`) || "").trim();
    if (u) images.push(u);
  }

  return {
    external_id: externalId,
    source: "feed",
    brand,
    model,
    year: yearOnly(get("year")),
    price: priceNumber(get("price") || get("sale_price")),
    mileage: mileageLabel(get("mileage.value")),
    transmission: transmissionLabel(get("transmission")),
    fuel: fuelLabel(get("fuel_type")),
    color: (get("exterior_color") || "").trim(),
    description: (get("description") || "").trim(),
    images,
    is_new: (get("state_of_vehicle") || "").toUpperCase() === "NEW",
    is_active: true,
  };
}

/* ---------------- auth ---------------- */

function hasValidCronToken(req: Request): boolean {
  const m = /^Bearer ([^\s,]+)$/.exec(req.headers.get("authorization") ?? "");
  const token = m?.[1];
  if (!token || !CRON_SECRET) return false;
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

    const rows = parseCsv(text);
    if (rows.length < 2) return await fail("feed_empty", 502);

    const header = rows[0].map((h) => h.trim());
    const feedVehicles: VehicleRow[] = [];
    const seen = new Set<string>();

    for (const raw of rows.slice(1)) {
      const get = (k: string) => {
        const idx = header.indexOf(k);
        return idx === -1 ? "" : raw[idx] ?? "";
      };
      const mapped = mapRow(get);
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
