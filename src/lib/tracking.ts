import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "vc_session_id";
const UTMS_KEY = "vc_utms";
const REFERRER_KEY = "vc_referrer";
const FBCLID_KEY = "vc_fbclid";
const GCLID_KEY = "vc_gclid";
const TTCLID_KEY = "vc_ttclid";
const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";

export type EventType =
  | "view"
  | "view_content"
  | "whatsapp_click"
  | "lead"
  | "filter_use"
  | "gallery_open"
  | "phone_view"
  | "share_click";

type Utms = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return uuid();
  }
}

/* ---------- Cookies (Meta padrão _fbc / _fbp) ---------- */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}
function writeCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function ensureFbp(): string | undefined {
  const existing = readCookie(FBP_COOKIE);
  if (existing) return existing;
  const v = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;
  writeCookie(FBP_COOKIE, v);
  return v;
}
function persistFbcFromFbclid(fbclid: string) {
  const v = `fb.1.${Date.now()}.${fbclid}`;
  writeCookie(FBC_COOKIE, v);
  return v;
}

/* ---------- Detecção de dispositivo ---------- */
function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

const UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

type StoredUtms = { at: number; utms: Utms; referrer?: string };

function saveUtmsPersistent(utms: Utms, referrer?: string) {
  try {
    const payload: StoredUtms = { at: Date.now(), utms, referrer };
    localStorage.setItem(UTMS_KEY, JSON.stringify(payload));
    sessionStorage.setItem(UTMS_KEY, JSON.stringify(utms));
    if (referrer) sessionStorage.setItem(REFERRER_KEY, referrer);
  } catch {
    /* noop */
  }
}

export function captureUtms(): void {
  try {
    const params = new URLSearchParams(window.location.search);

    // Click IDs — sempre capturar (sobrescrevem se vierem novos)
    const fbclid = params.get("fbclid");
    if (fbclid) {
      sessionStorage.setItem(FBCLID_KEY, fbclid);
      localStorage.setItem(FBCLID_KEY, fbclid);
      persistFbcFromFbclid(fbclid);
    }
    const gclid = params.get("gclid");
    if (gclid) {
      sessionStorage.setItem(GCLID_KEY, gclid);
      localStorage.setItem(GCLID_KEY, gclid);
    }
    const ttclid = params.get("ttclid");
    if (ttclid) {
      sessionStorage.setItem(TTCLID_KEY, ttclid);
      localStorage.setItem(TTCLID_KEY, ttclid);
    }

    // Garante _fbp para o Pixel/CAPI
    ensureFbp();

    const utms: Utms = {};
    (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
      const v = params.get(k);
      if (v) utms[k] = v;
    });
    if (Object.keys(utms).length > 0) {
      saveUtmsPersistent(utms, document.referrer || undefined);
    }
  } catch {
    /* noop */
  }
}

function readUtms(): Utms {
  try {
    // 1) sessão atual
    const s = sessionStorage.getItem(UTMS_KEY);
    if (s) return JSON.parse(s) as Utms;
    // 2) fallback persistente (30 dias)
    const raw = localStorage.getItem(UTMS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredUtms;
    if (Date.now() - parsed.at > UTM_TTL_MS) {
      localStorage.removeItem(UTMS_KEY);
      return {};
    }
    return parsed.utms ?? {};
  } catch {
    return {};
  }
}

function readReferrer(): string | undefined {
  try {
    const s = sessionStorage.getItem(REFERRER_KEY);
    if (s) return s;
    const raw = localStorage.getItem(UTMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUtms;
      if (parsed.referrer) return parsed.referrer;
    }
    return document.referrer || undefined;
  } catch {
    return undefined;
  }
}

function readClickIds() {
  try {
    return {
      fbclid: sessionStorage.getItem(FBCLID_KEY) || localStorage.getItem(FBCLID_KEY) || undefined,
      gclid: sessionStorage.getItem(GCLID_KEY) || localStorage.getItem(GCLID_KEY) || undefined,
      ttclid: sessionStorage.getItem(TTCLID_KEY) || localStorage.getItem(TTCLID_KEY) || undefined,
      fbc: readCookie(FBC_COOKIE) || undefined,
      fbp: readCookie(FBP_COOKIE) || undefined,
    };
  } catch {
    return {};
  }
}

export interface TrackOpts {
  vehicle_id?: string | null;
  value?: number | null;
  event_id?: string;
}

export async function trackEvent(event_type: EventType, opts: TrackOpts = {}): Promise<void> {
  try {
    const clickIds = readClickIds();
    const payload = {
      event_type,
      vehicle_id: opts.vehicle_id ?? null,
      session_id: getSessionId(),
      event_id: opts.event_id ?? uuid(),
      event_value: opts.value ?? null,
      device_type: detectDevice(),
      ...readUtms(),
      ...clickIds,
      referrer: readReferrer() ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
    };
    await supabase.from("vehicle_events").insert(payload);
  } catch {
    /* silent */
  }
}

/* ---------- Meta Pixel helper ---------- */
type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "Lead"
  | "Contact"
  | "InitiateCheckout"
  | "AddToWishlist";

export interface PixelParams {
  content_type?: string;
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  search_string?: string;
  [k: string]: unknown;
}

/** Envia o mesmo evento pelo servidor (Conversions API), com o event_id compartilhado. */
async function sendToCapi(
  event: PixelEvent,
  params: PixelParams,
  eventId: string,
  identity?: { em?: string; ph?: string }
): Promise<void> {
  try {
    const ids = readClickIds();
    await supabase.functions.invoke("meta-capi", {
      body: {
        event_name: event,
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        action_source: "website",
        user_data: {
          fbc: ids.fbc,
          fbp: ids.fbp,
          external_id: getSessionId(),
          ct: "rio verde",
          st: "go",
          country: "br",
          ...(identity ?? {}),
        },
        custom_data: params,
      },
    });
  } catch {
    /* silent */
  }
}

export function trackPixel(
  event: PixelEvent,
  params: PixelParams = {},
  eventId?: string,
  identity?: { em?: string; ph?: string }
): string {
  const id = eventId ?? uuid();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", event, params, { eventID: id });
    }
  } catch {
    /* noop */
  }
  void sendToCapi(event, params, id, identity);
  return id;
}


/**
 * Dispara Pixel + evento interno com o MESMO event_id (deduplicação pronta para CAPI).
 */
export function trackConversion(
  pixelEvent: PixelEvent,
  internalEvent: EventType,
  params: PixelParams & { vehicle_id?: string | null } = {}
): string {
  const eventId = uuid();
  trackPixel(pixelEvent, params, eventId);
  void trackEvent(internalEvent, {
    vehicle_id: params.vehicle_id ?? null,
    value: typeof params.value === "number" ? params.value : null,
    event_id: eventId,
  });
  return eventId;
}

/* ---------- Código de rastreio para o WhatsApp ---------- */

/** Deduz o canal de origem a partir de UTMs e click IDs. */
export function detectChannel(): string {
  const utms = readUtms();
  const ids = readClickIds();
  const src = (utms.utm_source || "").toLowerCase();
  if (ids.fbc || ids.fbclid || /facebook|instagram|meta|fb|ig/.test(src)) return "META";
  if (ids.gclid || /google|adwords/.test(src)) return "GOOGLE";
  if (ids.ttclid || /tiktok/.test(src)) return "TIKTOK";
  if (/whatsapp|wa/.test(src)) return "WPP";
  if (src) return src.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  const ref = (readReferrer() || "").toLowerCase();
  if (/facebook|instagram/.test(ref)) return "METAORG";
  if (/google/.test(ref)) return "GOOGLEORG";
  return "DIRETO";
}

function slug(text: string, len: number) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, len)
    .toUpperCase();
}

/**
 * Código curto e legível para colar na mensagem do WhatsApp.
 * Formato: SITE-<MODELO><ANO>-<CANAL>-<HASH>  → ex: SITE-HRV21-META-4F2A
 */
export function buildTrackingCode(vehicle?: { model?: string | null; year?: string | null } | null): string {
  const parts = ["SITE"];
  if (vehicle?.model) {
    const yr = (vehicle.year || "").replace(/\D/g, "").slice(-2);
    parts.push(`${slug(vehicle.model, 5)}${yr}`);
  }
  parts.push(detectChannel());
  parts.push(getSessionId().replace(/-/g, "").slice(0, 4).toUpperCase());
  return parts.join("-");
}

/** Anexa o código de rastreio ao final da mensagem do WhatsApp. */
export function withTrackingCode(message: string, code: string): string {
  return `${message}\n\n[${code}]`;
}

/* ---------- Criação de lead automática ----------
 * Um clique no WhatsApp NÃO é um lead confirmado. O registro nasce com
 * status "aguardando_contato" e só vira lead de verdade quando o admin
 * confirma no painel (ou quando ganha nome/telefone).
 */
const recentLeads = new Map<string, number>();

export async function createLead(opts: {
  vehicle_id?: string | null;
  message?: string;
  status?: "aguardando_contato" | "novo";
  tracking_code?: string | null;
}): Promise<void> {
  try {
    // Evita leads duplicados: mesmo veículo, mesma sessão, dentro de 60s
    const key = `${opts.vehicle_id ?? "none"}`;
    const last = recentLeads.get(key);
    if (last && Date.now() - last < 60_000) return;
    recentLeads.set(key, Date.now());

    const clickIds = readClickIds();
    const utms = readUtms();

    await supabase.from("leads").insert({
      vehicle_id: opts.vehicle_id ?? null,
      message: opts.message ?? null,
      status: opts.status ?? "aguardando_contato",
      tracking_code: opts.tracking_code ?? null,
      session_id: getSessionId(),

      fbc: clickIds.fbc ?? null,
      fbp: clickIds.fbp ?? null,
      utm_source: utms.utm_source ?? null,
      utm_medium: utms.utm_medium ?? null,
      utm_campaign: utms.utm_campaign ?? null,
      utm_content: utms.utm_content ?? null,
      utm_term: utms.utm_term ?? null,
      device_type: detectDevice(),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    /* silent */
  }
}



