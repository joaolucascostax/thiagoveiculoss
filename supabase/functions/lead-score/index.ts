// Score de lead com IA — usa Lovable AI Gateway (Gemini) para classificar
// leads como quente / morno / frio, com nota 0-100 e motivo.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ScoreOutput {
  score: number;
  tag: "🔥 Quente" | "🟡 Morno" | "🔵 Frio";
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let leadId: string;
  try {
    const body = await req.json();
    leadId = body.leadId;
    if (!leadId || typeof leadId !== "string") throw new Error("missing leadId");
  } catch {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, vehicles(brand, model, year, price)")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return new Response(JSON.stringify({ error: "lead_not_found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hour = new Date(lead.created_at).getHours();
  const dayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(lead.created_at).getDay()];

  const context = `
Analise este lead de uma loja de veículos e classifique como QUENTE, MORNO ou FRIO.

DADOS DO LEAD:
- Veículo consultado: ${
    lead.vehicles
      ? `${lead.vehicles.brand} ${lead.vehicles.model} ${lead.vehicles.year} (R$ ${lead.vehicles.price ?? "?"})`
      : "Nenhum veículo específico"
  }
- Origem (UTM): ${lead.utm_source ?? "orgânico/direto"} · ${lead.utm_medium ?? "-"} · ${lead.utm_campaign ?? "-"}
- Dispositivo: ${lead.device_type ?? "?"}
- Horário: ${dayName} às ${hour}h
- Mensagem: ${lead.message ?? "Sem mensagem"}
- Tem Facebook Click ID (veio de anúncio pago Meta): ${lead.fbc ? "SIM" : "NÃO"}

CRITÉRIOS:
- QUENTE (score 70-100): consultou veículo específico caro, veio de anúncio pago, horário comercial, mensagem detalhada
- MORNO (score 40-69): consultou veículo mas horário incomum ou sem detalhes na mensagem
- FRIO (score 0-39): sem veículo específico, orgânico sem contexto, madrugada, mensagem vazia

Responda APENAS em JSON no formato:
{"score": <0-100>, "tag": "🔥 Quente" | "🟡 Morno" | "🔵 Frio", "reason": "<motivo curto em 1 frase>"}
`.trim();

  let scored: ScoreOutput;
  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um SDR experiente em vendas de carros. Responda apenas com JSON válido." },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("[lead-score] AI error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`ai_${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "{}";
    scored = JSON.parse(raw);

    if (typeof scored.score !== "number" || !scored.tag) throw new Error("bad_ai_output");
    scored.score = Math.max(0, Math.min(100, Math.round(scored.score)));
  } catch (err) {
    console.error("[lead-score] failed", err);
    return new Response(JSON.stringify({ error: "ai_failed" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      score: scored.score,
      score_tag: scored.tag,
      score_reason: scored.reason,
    })
    .eq("id", leadId);

  if (updateError) {
    return new Response(JSON.stringify({ error: "db_error", detail: updateError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, ...scored }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
