/**
 * Meta Pixel — carregado dinamicamente a partir do ID salvo em Configurações.
 * Assim o lojista troca o Pixel no painel sem precisar mexer no código.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWindow = any;

let loadedPixelId: string | null = null;

function ensureFbqStub() {
  const w = window as AnyWindow;
  if (w.fbq) return;
  const n: AnyWindow = (w.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!w._fbq) w._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

/**
 * Inicializa (uma única vez) o Pixel informado e dispara o PageView.
 * @param externalId identificador estável do visitante (Advanced Matching)
 */
export function initMetaPixel(pixelId?: string | null, externalId?: string) {
  if (!pixelId || typeof window === "undefined") return;
  if (loadedPixelId === pixelId) return;

  ensureFbqStub();
  const fbq = (window as AnyWindow).fbq;
  if (typeof fbq !== "function") return;

  fbq("init", pixelId, externalId ? { external_id: externalId } : undefined);
  // PageView é disparado por trackPixel (navegador + CAPI com o mesmo event_id)
  loadedPixelId = pixelId;
  return true;
}

export function getLoadedPixelId() {
  return loadedPixelId;
}
