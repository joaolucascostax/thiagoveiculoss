// Edge function: generate Placid creatives for selected vehicles
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEMPLATE_UUID = "wy3w478j7oeqq";
const PLACID_API = "https://api.placid.app/api/rest/images";

interface ResultItem {
  vehicle_id: string;
  status: "success" | "error";
  image_url?: string;
  error?: string;
  label?: string;
}

function formatPrice(n: number): string {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}`;
}

function formatKm(mileage: unknown): string {
  const raw = String(mileage ?? "").replace(/\D/g, "");
  const num = parseInt(raw, 10);
  if (isNaN(num)) return "0 KM";
  return `${num.toLocaleString("pt-BR")} KM`;
}

async function generateOne(
  placidKey: string,
  v: any,
  phone: string,
): Promise<ResultItem> {
  const label = `${v.brand} ${v.model}`.trim();
  try {
    const imgs: string[] = Array.isArray(v.images) ? v.images.filter(Boolean) : [];
    const img1 = imgs[0] ?? "";
    const img2 = imgs[1] ?? img1;
    const img3 = imgs[2] ?? img1;

    const layers: Record<string, any> = {
      "marca+modelo": { text: label.toUpperCase() },
      ano: { text: String(v.year ?? "") },
      km: { text: formatKm(v.mileage) },
      preco: { text: `POR ${formatPrice(Number(v.price ?? 0))}` },
      "preço": { text: `POR ${formatPrice(Number(v.price ?? 0))}` },
      faleagora: { text: phone },
      imagem1: { image: img1 },
      imagem2: { image: img2 },
      imagem3: { image: img3 },
    };

    // FIPE layer: only show when fipe_price > price
    const fipe = Number(v.fipe_price ?? 0);
    const price = Number(v.price ?? 0);
    if (fipe > 0 && price > 0 && fipe > price) {
      layers["fipe"] = { text: `FIPE ${formatPrice(fipe)}` };
    } else {
      layers["fipe"] = { text: "", hide: true };
    }

    const createRes = await fetch(PLACID_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${placidKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_uuid: TEMPLATE_UUID,
        layers,
        create_now: true,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      return { vehicle_id: v.id, status: "error", label, error: createData?.error || createData?.message || `HTTP ${createRes.status}` };
    }

    let imageUrl: string | undefined = createData.image_url;
    let status: string = createData.status;
    const id = createData.id;

    // poll up to ~20s if queued
    const deadline = Date.now() + 20000;
    while (status && status !== "finished" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(`${PLACID_API}/${id}`, {
        headers: { Authorization: `Bearer ${placidKey}` },
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      imageUrl = pollData.image_url ?? imageUrl;
      if (status === "finished") break;
      if (status === "error") {
        return { vehicle_id: v.id, status: "error", label, error: pollData?.error || "Placid error" };
      }
    }

    if (!imageUrl) {
      return { vehicle_id: v.id, status: "error", label, error: "Timeout aguardando Placid" };
    }
    return { vehicle_id: v.id, status: "success", label, image_url: imageUrl };
  } catch (err: any) {
    return { vehicle_id: v.id, status: "error", label, error: err?.message ?? String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const placidKey = Deno.env.get("PLACID_API_KEY");
    if (!placidKey) {
      return new Response(JSON.stringify({ error: "PLACID_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const vehicleIds: string[] = Array.isArray(body.vehicle_ids) ? body.vehicle_ids : [];
    if (vehicleIds.length === 0) {
      return new Response(JSON.stringify({ error: "vehicle_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: vehicles, error: vErr } = await admin
      .from("vehicles")
      .select("*")
      .in("id", vehicleIds);
    if (vErr) throw vErr;

    const { data: settings } = await admin.from("store_settings").select("*").limit(1).single();
    const phone: string = settings?.phone || settings?.whatsapp || "";

    // process in batches of 3
    const results: ResultItem[] = [];
    const list = vehicles ?? [];
    for (let i = 0; i < list.length; i += 3) {
      const chunk = list.slice(i, i + 3);
      const chunkResults = await Promise.all(chunk.map((v) => generateOne(placidKey, v, phone)));
      results.push(...chunkResults);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
