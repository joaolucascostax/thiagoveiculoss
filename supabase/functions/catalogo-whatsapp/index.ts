// Feed XML (RSS 2.0 + namespace g:) do estoque — formato COMMERCE (e-commerce),
// compatível com catálogo do WhatsApp Business e Loja do Instagram/Facebook.
// Endpoint público, sem autenticação. NÃO altera o feed de veículos (catalog-feed).

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_SITE = "https://thiagoveiculoss.lovable.app";
const CITY_UF = "Rio Verde - GO";
const STORE_SLUG = "matriz";
const MAX_IMAGES = 20;

const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu;

const CTA_RE = new RegExp(
  [
    "entre em contato",
    "fale conosco",
    "chama no zap",
    "chame no zap",
    "chama no whats\\w*",
    "whats\\s?app",
    "whats",
    "agende (sua )?(visita|test[ -]?drive)",
    "consulte( as)? condi[cç][õo]es",
    "aceitamos troca",
    "financiamos",
    "venha conferir",
    "ligue( agora)?",
    "clique aqui",
    "saiba mais",
  ].join("|"),
  "gi",
);

const PHONE_RE = /(\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-.\s]?\d{4}/g;
const URL_RE = /((https?:\/\/|www\.)\S+|\S+\.(com|com\.br|net|br)(\/\S*)?)/gi;
const ZERO_KM_RE = /(?:^|[^\d.,])(?:zero\s?km|0\s?km|zero\s?ano)(?:$|[^\wÀ-ÿ])/i;

const ACRONYMS = new Set([
  "XEI","XLI","LTZ","LT","LS","GLS","GLX","TSI","TDI","GTI","GT","RS","SE","SEL","EX","LX",
  "4X4","4X2","V6","V8","AWD","4WD","ABS","CVT","MT","AT","SR","SRV","SV","XLS","XLT","GLI",
  "S","R","N","BR","XRE","XT","GNV",
]);

const COLOR_MAP: Record<string, string> = {
  preta: "Preto", branca: "Branco", prata: "Prata", cinza: "Cinza",
  vermelha: "Vermelho", azul: "Azul", verde: "Verde", amarela: "Amarelo",
  marrom: "Marrom", bege: "Bege", dourada: "Dourado", laranja: "Laranja",
  roxa: "Roxo", grafite: "Grafite", vinho: "Vinho",
};

function normColor(c?: string | null): string {
  const s = (c ?? "").trim();
  if (!s) return "";
  const k = s.toLowerCase();
  return COLOR_MAP[k] ?? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      const bare = w.replace(/[^\wÀ-ÿ.]/g, "");
      if (ACRONYMS.has(bare.toUpperCase())) return bare.toUpperCase();
      if (/^\d/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function sanitize(text: string, forTitle: boolean): string {
  let s = (text ?? "").replace(EMOJI_RE, " ");
  s = s.replace(/[*_#>•]+/g, " ").replace(/\r/g, "");
  s = s.replace(URL_RE, " ").replace(PHONE_RE, " ").replace(CTA_RE, " ");
  // remove preços
  s = s.replace(/r\$\s?[\d.,]+/gi, " ");
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.;])/g, "$1").trim();
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const uppers = s.replace(/[^A-ZÀ-Þ]/g, "");
  if (letters.length > 3 && uppers.length / letters.length > 0.7) s = titleCase(s);
  s = s.replace(/^[\s,.;:-]+/, "");
  // remove fragmentos vazios deixados pela limpeza (ex.: ", e !.")
  s = s
    .replace(/\b(para mais informa[cç][õo]es|fotos|v[ií]deo completo|tabela fipe por|fa[cç]a sua proposta)\b/gi, " ")
    .replace(/[\s,;:.!-]{2,}(?=[.!,]|$)/g, " ")
    .replace(/\s+([,.;!])/g, "$1")
    .replace(/([,.;!])\1+/g, "$1")
    .replace(/(^|\.)\s*[,;!.\s-]+/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return forTitle ? s.slice(0, 150) : s.slice(0, 5000);
}

function xmlEscape(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function kmValue(m: string | null | undefined): number {
  const n = Number(String(m ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function yearOnly(y: string | null | undefined): number {
  const m = String(y ?? "").match(/\b(19|20)\d{2}\b/g);
  return m ? Number(m[m.length - 1]) : 0;
}

function priceBand(p: number): string {
  if (p <= 40000) return "ate-40k";
  if (p <= 70000) return "40k-70k";
  if (p <= 100000) return "70k-100k";
  if (p <= 150000) return "100k-150k";
  return "acima-150k";
}

function kmBand(km: number): string {
  if (km <= 50000) return "ate-50k";
  if (km <= 100000) return "50k-100k";
  if (km <= 150000) return "100k-150k";
  return "acima-150k";
}

function category(model?: string | null): string {
  const s = (model ?? "").toLowerCase();
  if (/(\bsuv\b|macan|cayenne|range rover|\bq[3-8]\b|\bx[1-7]\b|gl[abcs]\b|tiguan|compass|renegade|creta|kicks|corolla cross|rav4|tracker|t-cross|nivus|hr-?v|wr-?v|\bcr-?v\b|pulse|fastback|duster|captur|ecosport|territory|equinox|tucson|sportage|sorento|santa fe|outlander|asx|xv|forester|2008|3008|c4 cactus|seltos|sw4|pajero|trailblazer|bronco|commander|haval|jolion|song|tiggo)/.test(s)) return "suv";
  if (/\b(hilux|ranger|s10|amarok|frontier|strada|toro|montana|saveiro|maverick|oroch|l200)\b/.test(s)) return "picape";
  if (/\b(hatch|golf|polo|gol|onix|hb20|argo|yaris|fit|corsa|march|sandero|mobi|up)\b/.test(s)) return "hatch";
  if (/\b(van|kombi|sprinter|ducato|master|doblo|partner)\b/.test(s)) return "utilitario";
  if (/\b(cb|cg|xre|biz|pcx|fazer|ninja|mt-0?\d|bros|titan)\b/.test(s)) return "moto";
  return "sedan";
}

const isBadImage = (u: string) =>
  !/^https:\/\//i.test(u) || /\.webp(\?|$)/i.test(u) || /\/(old|legacy)-storage\//i.test(u);

function imageKey(u: string): string {
  const clean = u.split("?")[0].toLowerCase();
  const file = clean.substring(clean.lastIndexOf("/") + 1);
  return file.replace(/[-_](edit|edited|copy|original|final|\d+x\d+)\b/g, "").replace(/\.(jpe?g|png)$/, "");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const [{ data: vehicles, error }, { data: settings }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("store_settings").select("store_name").limit(1).maybeSingle(),
  ]);

  if (error) return new Response(`error: ${error.message}`, { status: 500 });

  const storeName = settings?.store_name ?? "Thiago Veículos";
  const items: string[] = [];
  const dropped: { id: string; title: string; reason: string }[] = [];
  const issues: { id: string; title: string; issue: string }[] = [];
  const currentYear = new Date().getFullYear();

  for (const v of vehicles ?? []) {
    const yr = yearOnly(v.year);
  const rawTitle = [titleCase(String(v.brand ?? "")), titleCase(String(v.model ?? "")), yr || ""]
      .filter(Boolean)
      .join(" ");
    const title = sanitize(rawTitle, true);
    const km = kmValue(v.mileage);
    const price = Math.round(Number(v.price) || 0);

    // auditoria de estoque
    const descLower = String(v.description ?? "").toLowerCase();
    if (ZERO_KM_RE.test(descLower) && km > 1000)
      issues.push({ id: v.id, title, issue: `Descrição diz "zero km" mas KM cadastrado é ${km.toLocaleString("pt-BR")}` });
    const descKm = descLower.match(/([\d.]{4,})\s?(km|mil km)/);
    if (descKm) {
      const n = Number(descKm[1].replace(/\D/g, ""));
      if (km > 0 && n > 0 && Math.abs(n - km) / km > 0.05)
        issues.push({ id: v.id, title, issue: `KM no texto (${n.toLocaleString("pt-BR")}) diverge do cadastro (${km.toLocaleString("pt-BR")})` });
    }
    if (yr >= currentYear && km > 30000)
      issues.push({ id: v.id, title, issue: `Ano ${yr} com ${km.toLocaleString("pt-BR")} km` });
    if (!price) issues.push({ id: v.id, title, issue: "Sem preço cadastrado" });
    if (!km) issues.push({ id: v.id, title, issue: "Sem quilometragem cadastrada" });
    if ((v.images?.length ?? 0) < 3) issues.push({ id: v.id, title, issue: "Menos de 3 fotos" });

    // imagens: https, jpg/png, sem webp, deduplicadas
    const seen = new Set<string>();
    const imgs = (Array.isArray(v.images) ? v.images : [])
      .map((u: unknown) => (typeof u === "string" ? u.trim() : ""))
      .filter((u) => u && !isBadImage(u))
      .filter((u) => {
        const k = imageKey(u);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, MAX_IMAGES);

    const descParts = [
      sanitize(String(v.description ?? ""), false),
      km ? `${km.toLocaleString("pt-BR")} km` : "",
      normColor(v.color),
      v.transmission ?? "",
      v.fuel ?? "",
      CITY_UF,
    ].filter(Boolean);
    const description = sanitize(descParts.join(". "), false);

    const missing: string[] = [];
    if (!v.id) missing.push("id");
    if (!title) missing.push("título");
    if (!description) missing.push("descrição");
    if (!v.brand) missing.push("marca");
    if (!price) missing.push("preço");
    if (!imgs.length) missing.push("imagem JPG/PNG válida");

    if (missing.length) {
      const reason = `Faltando: ${missing.join(", ")}`;
      dropped.push({ id: v.id, title: title || v.id, reason });
      console.log(`[catalogo-whatsapp] descartado ${v.id} — ${reason}`);
      continue;
    }

    const fipe = Number(v.fipe_price) || 0;
    const cat = category(v.model);
    const link = `${PUBLIC_SITE}/veiculo/${v.id}`;

    const tags: string[] = [
      `<g:id>${xmlEscape(v.id)}</g:id>`,
      `<g:title>${xmlEscape(title)}</g:title>`,
      `<g:description>${xmlEscape(description)}</g:description>`,
      `<g:link>${xmlEscape(link)}</g:link>`,
      `<g:image_link>${xmlEscape(imgs[0])}</g:image_link>`,
    ];
    if (imgs.length > 1)
      tags.push(`<g:additional_image_link>${xmlEscape(imgs.slice(1).join(","))}</g:additional_image_link>`);
    tags.push(
      `<g:availability>${v.is_active ? "in stock" : "out of stock"}</g:availability>`,
      `<g:condition>${v.is_new || km <= 1000 ? "new" : "used"}</g:condition>`,
      `<g:price>${price.toFixed(2)} BRL</g:price>`,
      `<g:brand>${xmlEscape(titleCase(String(v.brand)))}</g:brand>`,
      `<g:product_type>${xmlEscape(`${cat} > ${titleCase(String(v.brand))} > ${titleCase(String(v.model))}`)}</g:product_type>`,
      `<g:google_product_category>${cat === "moto" ? "3395" : "916"}</g:google_product_category>`,
      `<g:quantity_to_sell_on_facebook>1</g:quantity_to_sell_on_facebook>`,
      `<g:custom_label_0>${priceBand(price)}</g:custom_label_0>`,
      `<g:custom_label_1>${STORE_SLUG}</g:custom_label_1>`,
      `<g:custom_label_2>${fipe > 0 ? (price < fipe ? "abaixo-fipe" : "preco-fipe") : "sem-referencia"}</g:custom_label_2>`,
      `<g:custom_label_3>${kmBand(km)}</g:custom_label_3>`,
      `<g:custom_label_4>${cat}</g:custom_label_4>`,
    );

    items.push(`    <item>\n      ${tags.join("\n      ")}\n    </item>`);
  }

  if (debug) {
    return new Response(
      JSON.stringify({
        total: vehicles?.length ?? 0,
        emitted: items.length,
        dropped_count: dropped.length,
        generated_at: new Date().toISOString(),
        dropped,
        issues,
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xmlEscape(storeName)} - Estoque</title>
    <link>${xmlEscape(PUBLIC_SITE)}</link>
    <description>Veículos seminovos e usados em ${CITY_UF}</description>
${items.join("\n")}
  </channel>
</rss>
`;

  const headers = new Headers();
  headers.set("content-type", "application/xml");
  headers.set("cache-control", "public, max-age=1800");
  headers.set("access-control-allow-origin", "*");

  return new Response(xml, { status: 200, headers });
});
