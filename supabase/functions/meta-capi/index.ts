import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "Contact",
  "InitiateCheckout",
  "Lead",
  "AddToWishlist",
  "Purchase",
]);

const HASH_FIELDS = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country"] as const;
const RAW_FIELDS = ["fbc", "fbp", "external_id"] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function stripAccents(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isHashed(v: string) {
  return /^[a-f0-9]{64}$/i.test(v);
}

function normalize(field: string, raw: string): string {
  let v = stripAccents(String(raw)).trim().toLowerCase().replace(/\s+/g, " ");
  switch (field) {
    case "em":
      v = v.replace(/\s/g, "");
      break;
    case "ph": {
      v = v.replace(/\D/g, "");
      if (v.length === 10 || v.length === 11) v = `55${v}`;
      break;
    }
    case "zp":
      v = v.replace(/\D/g, "");
      break;
    case "country":
      v = v.replace(/\s/g, "").slice(0, 2);
      break;
    default:
      v = v.replace(/\s/g, "");
  }
  return v;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = Deno.env.get("META_CAPI_TOKEN");
  const datasetId = Deno.env.get("META_DATASET_ID");
  const testEventCode = Deno.env.get("META_TEST_EVENT_CODE");

  if (!token || !datasetId) return json({ skipped: "not_configured" });

  try {
    const body = await req.json().catch(() => ({}));
    const eventName = body?.event_name;
    const eventId = body?.event_id;

    if (typeof eventName !== "string" || !ALLOWED_EVENTS.has(eventName)) {
      return json({ error: "invalid event_name" }, 400);
    }
    if (typeof eventId !== "string" || !eventId) {
      return json({ error: "event_id is required" }, 400);
    }

    const incoming = (body?.user_data ?? {}) as Record<string, unknown>;
    const userData: Record<string, unknown> = {};

    for (const field of HASH_FIELDS) {
      const raw = incoming[field];
      if (typeof raw !== "string" || !raw.trim()) continue;
      if (isHashed(raw)) {
        userData[field] = raw.toLowerCase();
        continue;
      }
      const normalized = normalize(field, raw);
      if (normalized) userData[field] = await sha256Hex(normalized);
    }

    for (const field of RAW_FIELDS) {
      const raw = incoming[field];
      if (typeof raw === "string" && raw.trim()) userData[field] = raw.trim();
    }

    const ip = clientIp(req);
    if (ip) userData.client_ip_address = ip;
    const ua = req.headers.get("user-agent");
    if (ua) userData.client_user_agent = ua;

    const event: Record<string, unknown> = {
      event_name: eventName,
      event_id: eventId,
      event_time: Number.isFinite(body?.event_time)
        ? Math.floor(body.event_time)
        : Math.floor(Date.now() / 1000),
      action_source: body?.action_source ?? "website",
      user_data: userData,
    };
    if (typeof body?.event_source_url === "string") event.event_source_url = body.event_source_url;
    if (body?.custom_data && typeof body.custom_data === "object") event.custom_data = body.custom_data;

    const payload: Record<string, unknown> = { data: [event] };
    if (testEventCode) payload.test_event_code = testEventCode;

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${datasetId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("meta-capi graph error", res.status, JSON.stringify(result));
      return json({ ok: false, status: res.status });
    }

    return json({ ok: true, result });
  } catch (err) {
    console.error("meta-capi exception", err);
    return json({ ok: false });
  }
});
