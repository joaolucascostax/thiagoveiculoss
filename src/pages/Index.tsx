import { useState, useMemo } from "react";
import logoVitrineCar from "@/assets/Logo_Podium_2.PNG";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FilterBar, { type Filters } from "@/components/FilterBar";
import VehicleCard from "@/components/VehicleCard";
import { useVehicles } from "@/hooks/useVehicles";
import { useSettings } from "@/contexts/StoreSettingsContext";
import { useTrackPageView } from "@/hooks/useTrackPageView";

const Index = () => {
  useTrackPageView();
  const { data: vehicles = [], isLoading } = useVehicles(true);
  const { settings } = useSettings();
  const storeName = settings?.store_name || "VITRINECAR";
  const priceMin = settings?.price_filter_min ?? 20000;
  const configuredPriceMax = settings?.price_filter_max ?? 1000000;
  // Ensure the slider max never hides in-stock vehicles priced above the configured cap.
  const highestVehiclePrice = useMemo(
    () => vehicles.reduce((acc, v) => (v.price > acc ? v.price : acc), 0),
    [vehicles]
  );
  const priceMax = Math.max(configuredPriceMax, highestVehiclePrice);

  const [filters, setFilters] = useState<Filters>({ brand: "", minYear: "", transmission: "", maxPrice: priceMax });
  const [sortAsc, setSortAsc] = useState(true);

  const handleApplyFilters = (f: Filters) => setFilters(f);

  const matchesTransmission = (raw: string, filter: string) => {
    const t = (raw || "").toUpperCase();
    if (filter === "AUTOMÁTICO") return t.includes("AUTOM");
    if (filter === "MANUAL") return t.includes("MANUAL");
    return t === filter.toUpperCase();
  };

  const filtered = useMemo(() => {
    const result = vehicles.filter((v) => {
      if (filters.brand && !`${v.brand} ${v.model}`.toLowerCase().includes(filters.brand.toLowerCase())) return false;
      if (filters.minYear && parseInt(v.year) < parseInt(filters.minYear)) return false;
      if (filters.transmission && !matchesTransmission(v.transmission, filters.transmission)) return false;
      // When the slider sits at (or above) the effective cap, treat it as "no upper limit"
      // so vehicles priced above the configured max are still shown.
      if (filters.maxPrice < priceMax && v.price > filters.maxPrice) return false;
      return true;
    });
    return sortAsc ? result : [...result].reverse();
  }, [vehicles, filters, sortAsc, priceMax]);

  return (
    <div className="min-h-screen bg-surface">
      <section className="flex justify-center" style={{ backgroundColor: "#000" }}>
        <img
          src={settings?.banner_url || logoVitrineCar}
          alt={storeName}
          className="w-full h-auto block max-h-[280px] lg:max-h-[360px] object-contain"
        />
      </section>

      <FilterBar totalVehicles={filtered.length} onApply={handleApplyFilters} priceMin={priceMin} priceMax={priceMax} />


      <section className="bg-surface-container-low py-8">
        <div className="max-w-7xl mx-auto px-4">

          <div className="flex items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-on-surface font-black text-xl uppercase tracking-wider">Estoque</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">search_off</span>
              <p className="text-on-surface-variant font-medium">Nenhum veículo encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
            </div>
          )}
        </div>
      </section>


      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
