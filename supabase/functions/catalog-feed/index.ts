// Public CSV feed for Meta Commerce Manager — Automotive Inventory format.
// Meta agenda o download desta URL — sem token, sem autenticação.
// Template oficial: catalog_vehicles.csv (94 colunas).

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_SITE = Deno.env.get("PUBLIC_SITE_URL") ?? "https://edd07577-d967-4588-8cfa-e0d3303e7540.lovable.app";
const DEALER_ID = Deno.env.get("DEALER_ID") ?? "thiago-veiculos-rio-verde";

// Meta Automotive Inventory aceita até 20 imagens por item (image[0..19]).
const MAX_IMAGES = 20;

const IMAGE_HEADERS = Array.from({ length: MAX_IMAGES }, (_, i) => [
  `image[${i}].url`,
  `image[${i}].tag[0]`,
]).flat();

const HEADERS = [
  "vehicle_id","title","description","availability","condition","price","sale_price",
  ...IMAGE_HEADERS,
  "video[0].url","video[0].tag[0]","url","dealer_url",
  "vehicle_registration_plate","transmission","body_style","fuel_type",
  "dealer_privacy_policy_url","dealer_communication_channel","days_on_lot",
  "previous_price","address.addr1","address.addr2","address.addr3","address.city",
  "address.city_id","address.region","address.postal_code","address.country",
  "address.unit_number","latitude","longitude","neighborhood[0]","exterior_color",
  "interior_color","make","model","trim",
  "features[0].value","features[0].type","features[1].value","features[1].type",
  "features[2].value","features[2].type",
  "vehicle_specifications[0].type","vehicle_specifications[0].units","vehicle_specifications[0].value",
  "custom_label_0","custom_label_1","custom_label_2","custom_label_3","custom_label_4",
  "custom_number_0","custom_number_1","custom_number_2","custom_number_3","custom_number_4",
  "stock_number","legal_disclosure_impressum_url","msrp","carfax_dealership_id",
  "vehicle_finance_types[0]","engine_size","horse_power",
  "applink.android_app_name","applink.android_package","applink.android_url",
  "applink.ios_app_name","applink.ios_app_store_id","applink.ios_url",
  "applink.ipad_app_name","applink.ipad_app_store_id","applink.ipad_url",
  "applink.iphone_app_name","applink.iphone_app_store_id","applink.iphone_url",
  "applink.windows_phone_app_id","applink.windows_phone_app_name","applink.windows_phone_url",
  "year","vin","state_of_vehicle","dealer_id","dealer_name",
  "mileage.unit","mileage.value","product_tags[0]","product_tags[1]",
  "product_priority_0","product_priority_1","product_priority_2","product_priority_3","product_priority_4",
];

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normFuel(f: string | null | undefined): string {
  const s = (f ?? "").toLowerCase();
  if (s.includes("elet") || s.includes("elec")) return "ELECTRIC";
  if (s.includes("hibr") || s.includes("hybrid")) return "HYBRID";
  if (s.includes("diesel")) return "DIESEL";
  if (s.includes("flex") || s.includes("alcool") || s.includes("etanol")) return "FLEX";
  if (s.includes("gas") || s.includes("gasol")) return "GASOLINE";
  return "OTHER";
}

function normTransmission(t: string | null | undefined): string {
  const s = (t ?? "").toLowerCase();
  if (s.includes("autom") || s.includes("pdk") || s.includes("dsg") ||
      s.includes("tiptronic") || s.includes("cvt") || /\b\d+g\b/.test(s)) return "AUTOMATIC";
  if (s.includes("manual")) return "MANUAL";
  return "OTHER";
}

function inferBodyStyle(model: string | null | undefined): string {
  const s = (model ?? "").toLowerCase();
  if (/\b(suv|macan|cayenne|range rover|q[3-8]|x[1-7]|gl[abcs]|tiguan|compass|renegade|creta|kicks|corolla cross|rav4)\b/.test(s)) return "SUV";
  if (/\b(coupe|coup[eé]|911|carrera|rs[3-9]|m[2-8]\b)/.test(s)) return "COUPE";
  if (/\b(hatch|golf|polo|gol|onix|hb20|argo|yaris|fit|city hatch|corsa)\b/.test(s)) return "HATCHBACK";
  if (/\b(wagon|touring|variant|estate|avant|sw)\b/.test(s)) return "WAGON";
  if (/\b(pickup|hilux|ranger|s10|amarok|frontier|strada|toro|montana|saveiro|maverick)\b/.test(s)) return "TRUCK";
  if (/\b(cabrio|conver|roadster|spider|spyder)\b/.test(s)) return "CONVERTIBLE";
  if (/\b(cross|crossover)\b/.test(s)) return "CROSSOVER";
  if (/\b(van|kombi|sprinter|ducato)\b/.test(s)) return "VAN";
  return "SEDAN";
}

function kmValue(m: string | null | undefined): number {
  const n = Number(String(m ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function yearOnly(y: string | null | undefined): string {
  const m = String(y ?? "").match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function formatPriceBRL(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n.toFixed(2)} BRL`;
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const [{ data: vehicles, error }, { data: settings }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, brand, model, year, price, mileage, transmission, fuel, color, images, is_active, fipe_price, description")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("store_settings").select("store_name").limit(1).maybeSingle(),
  ]);

  if (error) {
    return new Response(`error: ${error.message}`, { status: 500 });
  }

  const dealerName = settings?.store_name ?? "Thiago Veículos";
  const rows: string[] = [HEADERS.join(",")];

  for (const v of vehicles ?? []) {
    // Todas as imagens do veículo (limitadas ao máximo aceito pela Meta), sem vazios.
    const imgs = (Array.isArray(v.images) ? v.images : [])
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .slice(0, MAX_IMAGES);
    const imageCells: Record<string, string> = {};
    imgs.forEach((u, i) => {
      imageCells[`image[${i}].url`] = u.trim();
      imageCells[`image[${i}].tag[0]`] = i === 0 ? "exterior" : "other";
    });
    const yr = yearOnly(v.year);
    const title = [v.brand, v.model, yr].filter(Boolean).join(" ").trim();
    const priceNum = Math.round(Number(v.price) || 0);
    const km = kmValue(v.mileage);
    const price = formatPriceBRL(priceNum);
    const url = `${PUBLIC_SITE}/veiculo/${v.id}`;
    const desc = (v.description && String(v.description).trim()) ||
      `${v.brand} ${v.model} ${yr} — ${v.transmission ?? ""} ${v.fuel ?? ""}`.replace(/\s+/g, " ").trim();
    const fipe = v.fipe_price ? Math.round(Number(v.fipe_price)) : 0;
    const stateOfVehicle = km <= 1000 ? "NEW" : "USED";

    const row: Record<string, string> = {
      vehicle_id: v.id,
      title,
      description: desc,
      availability: "available",
      condition: "excellent",
      price,
      sale_price: price,
      ...imageCells,
      url,
      dealer_url: PUBLIC_SITE,
      transmission: normTransmission(v.transmission),
      body_style: inferBodyStyle(v.model),
      fuel_type: normFuel(v.fuel),
      dealer_privacy_policy_url: `${PUBLIC_SITE}/privacidade`,
      dealer_communication_channel: "CHAT",
      "address.addr1": "Rio Verde - GO",
      "address.city": "Rio Verde",
      "address.region": "GO",
      "address.postal_code": "75900-000",
      "address.country": "BR",
      latitude: "-17.7975",
      longitude: "-50.9264",
      "neighborhood[0]": "Rio Verde",
      exterior_color: v.color ?? "",
      make: v.brand ?? "",
      model: v.model ?? "",
      year: yr,
      state_of_vehicle: stateOfVehicle,
      dealer_id: DEALER_ID,
      dealer_name: dealerName,
      "mileage.unit": "KM",
      "mileage.value": String(km),
      previous_price: fipe > priceNum ? formatPriceBRL(fipe) : "",
      custom_label_0: fipe > 0 ? `FIPE R$ ${fipe.toLocaleString("pt-BR")}` : "",
      custom_number_0: String(km),
    };

    rows.push(HEADERS.map((h) => csvEscape(row[h] ?? "")).join(","));
  }

  const csv = rows.join("\n") + "\n";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="catalogo-veiculos.csv"',
      "Cache-Control": "public, max-age=1800",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
