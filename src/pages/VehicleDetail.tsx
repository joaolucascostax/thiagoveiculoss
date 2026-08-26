import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ImageGallery from "@/components/ImageGallery";
import TechSpecGrid from "@/components/TechSpecGrid";
import { useVehicle } from "@/hooks/useVehicles";
import { useSettings } from "@/contexts/StoreSettingsContext";
import { useTrackPageView } from "@/hooks/useTrackPageView";
import {
  trackEvent,
  trackPixel,
  createLead,
  buildTrackingCode,
  withTrackingCode,
} from "@/lib/tracking";

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR");
}

function trackInterest(
  vehicle: { id: string; brand: string; model: string; year: string; price: number },
  trackingCode: string
) {
  // Clique no WhatsApp = intenção, não lead confirmado.
  const eventId = crypto.randomUUID();
  trackPixel(
    "InitiateCheckout",
    {
      content_type: "vehicle",
      content_ids: [vehicle.id],
      content_name: `${vehicle.brand} ${vehicle.model}`,
      content_category: vehicle.brand,
      value: vehicle.price,
      currency: "BRL",
    },
    eventId
  );
  trackPixel("Contact", { content_ids: [vehicle.id], value: vehicle.price, currency: "BRL" }, eventId);
  void trackEvent("whatsapp_click", { vehicle_id: vehicle.id, value: vehicle.price, event_id: eventId });
  void createLead({
    vehicle_id: vehicle.id,
    status: "aguardando_contato",
    tracking_code: trackingCode,
    message: `Interesse em ${vehicle.brand} ${vehicle.model} ${vehicle.year} - R$ ${vehicle.price.toLocaleString("pt-BR")}`,
  });
}




const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  useTrackPageView(id);
  const { data: vehicle, isLoading } = useVehicle(id);
  const { settings } = useSettings();

  // ViewContent do Meta Pixel + evento interno view_content — dispara quando o veículo carrega
  useEffect(() => {
    if (!vehicle) return;
    const eventId = crypto.randomUUID();
    trackPixel(
      "ViewContent",
      {
        content_type: "vehicle",
        content_ids: [vehicle.id],
        content_name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        content_category: vehicle.brand,
        value: vehicle.price,
        currency: "BRL",
      },
      eventId
    );
    void trackEvent("view_content", { vehicle_id: vehicle.id, value: vehicle.price, event_id: eventId });
  }, [vehicle?.id]);

  const storeName = settings?.store_name || "VitrineCar";
  const whatsapp = settings?.whatsapp || "5564999916552";

  const formatPhone = (p: string) => {
    const digits = p.replace(/\D/g, "");
    if (digits.length === 13) return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return p;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface font-bold">Veículo não encontrado</p>
      </div>
    );
  }

  // Código de rastreio embutido na mensagem — permite saber veículo + canal de origem
  const trackingCode = buildTrackingCode({ model: vehicle.model, year: vehicle.year });
  const proposalText = encodeURIComponent(
    withTrackingCode(
      `Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} - R$ ${formatPrice(vehicle.price)}. Podemos conversar?`,
      trackingCode
    )
  );


  const specs = [
    { icon: "speed", label: "Quilometragem", value: vehicle.mileage },
    { icon: "calendar_month", label: "Ano", value: vehicle.year },
    { icon: "local_gas_station", label: "Combustível", value: vehicle.fuel },
    { icon: "settings", label: "Câmbio", value: vehicle.transmission },
    { icon: "palette", label: "Cor", value: vehicle.color },
    { icon: "door_front", label: "Portas", value: String(vehicle.doors) },
  ];


  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="h-[52px]" />


      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">home</span>
          </Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/" className="hover:text-primary transition-colors font-medium">{storeName}</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-medium">Anúncio</span>
        </nav>

        <div className="mb-6">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.1em] mb-1">{vehicle.brand}</p>
          <h1 className="text-on-surface font-black text-2xl md:text-3xl uppercase tracking-wide leading-tight">
            {vehicle.model} {vehicle.year.split("/")[0]}
          </h1>
          {vehicle.is_new && (
            <span className="inline-block mt-3 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-pill">
              Novo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ImageGallery images={vehicle.images} alt={`${vehicle.brand} ${vehicle.model}`} year={vehicle.year} price={formatPrice(vehicle.price)} />

            <a
              href={`https://wa.me/${whatsapp}?text=${proposalText}`}
              onClick={() => trackInterest(vehicle, trackingCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group cursor-pointer block h-16 md:h-20"
            >
              <div className="absolute inset-0 bg-on-surface rounded-2xl translate-x-1.5 translate-y-1.5 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 group-active:translate-x-0 group-active:translate-y-0" />
              <div className="relative h-full bg-primary border-2 border-on-surface rounded-2xl flex items-center justify-center gap-4 px-6 md:px-10 transition-transform group-active:translate-x-0.5 group-active:translate-y-0.5">
                <span className="text-primary-foreground font-black uppercase italic tracking-tighter text-lg md:text-2xl">
                  Tenho Interesse
                </span>
                <div className="bg-on-surface rounded-full p-1 group-hover:translate-x-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </a>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-on-surface font-black text-lg uppercase tracking-wider">Ficha Técnica</h2>
              </div>
              <TechSpecGrid specs={specs} />
            </div>
            {vehicle.options?.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-on-surface font-black text-lg uppercase tracking-[0.15em]">Opcionais e Adicionais</h2>
                </div>
                <div className="bg-surface-container-low rounded-lg p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.options.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-on-surface text-sm font-medium">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {vehicle.description && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h2 className="text-on-surface font-black text-lg uppercase tracking-[0.15em]">Detalhes do Veículo</h2>
                </div>
                <div className="bg-surface-container-low rounded-lg p-5">
                  <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-[100px] bg-surface-container-low rounded-lg p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                  <img
                    src={settings?.banner_url}
                    alt={storeName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-on-surface font-black text-sm uppercase tracking-wider">{storeName}</h3>
                  <p className="text-on-surface-variant text-xs">Loja Oficial</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">chat</span>
                  <p className="text-on-surface text-sm font-medium">{formatPhone(whatsapp)}</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${whatsapp}?text=${proposalText}`}
                onClick={() => trackInterest(vehicle, trackingCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-pill text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton
        vehicleId={vehicle.id}
        vehicleModel={vehicle.model}
        vehicleYear={vehicle.year}
        value={vehicle.price}
        message={`Olá! Tenho interesse no ${vehicle.brand} ${vehicle.model} ${vehicle.year} - R$ ${formatPrice(vehicle.price)}. Podemos conversar?`}
      />

    </div>
  );
};

export default VehicleDetail;
