import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Texto muito curto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Você é um assistente que extrai dados de veículos a partir de textos de anúncios. Extraia todas as informações disponíveis e use a função fornecida para retornar os dados estruturados. Se um campo não estiver presente no texto, omita-o. Preços devem ser números inteiros em reais (sem centavos). Opcionais devem ser uma lista de strings em MAIÚSCULO.",
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_vehicle",
              description: "Extrair dados estruturados de um veículo a partir do texto do anúncio",
              parameters: {
                type: "object",
                properties: {
                  brand: { type: "string", description: "Marca do veículo em MAIÚSCULO (ex: BMW, PORSCHE)" },
                  model: { type: "string", description: "Modelo do veículo em MAIÚSCULO (ex: 320I M SPORT)" },
                  year: { type: "string", description: "Ano no formato AAAA/AAAA (ex: 2024/2024)" },
                  price: { type: "number", description: "Preço em reais, número inteiro sem centavos" },
                  mileage: { type: "string", description: "Quilometragem (ex: 15.000 KM ou 0 KM)" },
                  transmission: { type: "string", description: "Tipo de câmbio em MAIÚSCULO (AUTOMÁTICO, MANUAL)" },
                  fuel: { type: "string", description: "Combustível em MAIÚSCULO (GASOLINA, FLEX, DIESEL, ELÉTRICO, HÍBRIDO)" },
                  color: { type: "string", description: "Cor do veículo em MAIÚSCULO" },
                  doors: { type: "number", description: "Número de portas (2 ou 4)" },
                  is_new: { type: "boolean", description: "true se for 0 KM / novo" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de opcionais em MAIÚSCULO",
                  },
                  description: { type: "string", description: "Descrição resumida do veículo" },
                },
                required: ["brand", "model"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_vehicle" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos em Configurações → Cloud & AI balance." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured output returned");
    }

    const vehicle = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(vehicle), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-vehicle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
