import { useSettings } from "@/contexts/StoreSettingsContext";
import { trackEvent, trackPixel, createLead, buildTrackingCode, withTrackingCode } from "@/lib/tracking";

interface WhatsAppButtonProps {
  message?: string;
  vehicleId?: string | null;
  value?: number | null;
  /** Usado para montar o código de rastreio (ex: SITE-HRV21-META-4F2A) */
  vehicleModel?: string | null;
  vehicleYear?: string | null;
}

const WhatsAppButton = ({ message, vehicleId, value, vehicleModel, vehicleYear }: WhatsAppButtonProps) => {
  const { settings } = useSettings();
  const whatsapp = settings?.whatsapp || "5564999916552";

  const buildHref = () => {
    const code = buildTrackingCode(
      vehicleModel ? { model: vehicleModel, year: vehicleYear } : null
    );
    const text = withTrackingCode(message || "Olá! Vi um veículo no site e quero mais informações.", code);
    return { href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, code, text };
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { href, code, text } = buildHref();
    e.currentTarget.href = href;

    // Clique no WhatsApp = intenção. Vira lead só após confirmação no painel.
    const eventId = crypto.randomUUID();
    trackPixel(
      "Contact",
      {
        content_type: vehicleId ? "vehicle" : undefined,
        content_ids: vehicleId ? [vehicleId] : undefined,
        value: value ?? undefined,
        currency: value ? "BRL" : undefined,
      },
      eventId
    );
    trackPixel("Lead", {
      content_type: vehicleId ? "vehicle" : undefined,
      content_ids: vehicleId ? [vehicleId] : undefined,
      value: value ?? undefined,
      currency: value ? "BRL" : undefined,
    });
    void trackEvent("whatsapp_click", { vehicle_id: vehicleId ?? null, value: value ?? null, event_id: eventId });
    void createLead({
      vehicle_id: vehicleId ?? null,
      message: text,
      status: "aguardando_contato",
      tracking_code: code,
    });
  };

  return (
    <a
      href={buildHref().href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-8 right-4 z-40 rounded-full flex items-center gap-2 px-4 py-3 shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: "#25D366" }}
      aria-label="WhatsApp"
    >
      <span className="material-symbols-outlined text-2xl text-white">chat</span>
    </a>
  );
};

export default WhatsAppButton;
