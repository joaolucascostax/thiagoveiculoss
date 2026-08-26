import { useEffect, useState } from "react";
import { trackEvent, trackPixel } from "@/lib/tracking";

export interface Filters {
  brand: string;
  minYear: string;
  transmission: string;
  maxPrice: number;
}

interface FilterBarProps {
  totalVehicles: number;
  onApply: (filters: Filters) => void;
  priceMin?: number;
  priceMax?: number;
}

const FilterBar = ({ totalVehicles, onApply, priceMin = 20000, priceMax = 1000000 }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [minYear, setMinYear] = useState("");
  const [transmission, setTransmission] = useState("");
  const [maxPrice, setMaxPrice] = useState(priceMax);

  // Keep slider in sync when admin changes range
  useEffect(() => {
    setMaxPrice(priceMax);
  }, [priceMax]);

  const activeCount = [brand, minYear, transmission, maxPrice < priceMax ? "y" : ""].filter(Boolean).length;

  const handleApply = () => {
    // Track filter usage — sinal forte de intenção
    const searchString = [brand, minYear, transmission].filter(Boolean).join(" | ");
    if (activeCount > 0) {
      trackPixel("Search", {
        search_string: searchString || `até R$ ${maxPrice}`,
        content_category: brand || undefined,
      });
      void trackEvent("filter_use");
    }
    onApply({ brand, minYear, transmission, maxPrice });
    setIsOpen(false);
  };

  const handleClear = () => {
    setBrand("");
    setMinYear("");
    setTransmission("");
    setMaxPrice(priceMax);
    onApply({ brand: "", minYear: "", transmission: "", maxPrice: priceMax });
  };


  return (
    <div
      className="sticky top-0 z-30 bg-surface-container-lowest/80 backdrop-blur-xl"
      style={{ boxShadow: "0 4px 20px hsl(var(--on-surface) / 0.04)" }}
    >
      <button
        data-filter-toggle
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <span className="text-on-surface font-bold text-sm uppercase tracking-wider">Refinar Busca</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant text-xs">Filtros ativos: {activeCount}</span>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="bg-surface-container-low px-4 py-5 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Marca / Modelo
              </label>
              <input
                type="text"
                placeholder="Ex: BMW, Porsche..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-lg px-3 py-2.5 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Ano Mínimo
              </label>
              <input
                type="number"
                placeholder="2020"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-lg px-3 py-2.5 placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Câmbio
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-surface-container-lowest text-on-surface text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todos</option>
                <option value="AUTOMÁTICO">Automático</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                Preço Máximo: R$ {maxPrice.toLocaleString("pt-BR")}
              </label>
              <input
                type="range"
                min={priceMin}
                max={priceMax}
                step={10000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-slider mt-2"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1.5 font-medium">
                <span>R$ {priceMin.toLocaleString("pt-BR")}</span>
                <span>R$ {priceMax.toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            {activeCount > 0 && (
              <button
                onClick={handleClear}
                className="text-on-surface-variant text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-pill hover:bg-surface-container-high transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={handleApply}
              className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-pill hover:bg-primary/90 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
