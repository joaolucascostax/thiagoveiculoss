import { Link } from "react-router-dom";
import type { Vehicle } from "@/hooks/useVehicles";

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR");
}

interface VehicleCardProps {
  vehicle: Vehicle;
}

const PLACEHOLDER = "/placeholder.svg";

const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const mainImage = vehicle.images?.length > 0 ? vehicle.images[0] : PLACEHOLDER;

  return (
    <Link
      to={`/veiculo/${vehicle.id}`}
      className="block bg-surface-container-lowest rounded-lg overflow-hidden transition-all hover:bg-surface-container-high group"
      style={{ boxShadow: "0 4px 40px hsl(var(--on-surface) / 0.04)" }}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={mainImage}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {vehicle.is_new && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-pill">
              Novo
            </span>
          )}
          <span className="bg-on-surface/70 text-surface text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-pill backdrop-blur-sm">
            {vehicle.year.split("/")[1] || vehicle.year.split("/")[0]}
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-black text-sm px-3 py-1.5 rounded-pill">
            R$ {formatPrice(vehicle.price)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-primary text-xs font-bold uppercase tracking-[0.1em] mb-1">{vehicle.brand}</p>
        <h3 className="text-on-surface font-black text-lg uppercase tracking-wide leading-tight mb-3">
          {vehicle.model}
        </h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          <div className="bg-surface-container-low rounded-md px-3 py-2">
            <p className="text-on-surface-variant text-[10px] font-medium uppercase tracking-wider">Quilometragem</p>
            <p className="text-on-surface text-xs font-bold">{vehicle.mileage}</p>
          </div>
          <div className="bg-surface-container-low rounded-md px-3 py-2">
            <p className="text-on-surface-variant text-[10px] font-medium uppercase tracking-wider">Transmissão</p>
            <p className="text-on-surface text-xs font-bold">{vehicle.transmission}</p>
          </div>
          <div className="bg-surface-container-low rounded-md px-3 py-2">
            <p className="text-on-surface-variant text-[10px] font-medium uppercase tracking-wider">Combustível</p>
            <p className="text-on-surface text-xs font-bold">{vehicle.fuel}</p>
          </div>
          <div className="bg-surface-container-low rounded-md px-3 py-2">
            <p className="text-on-surface-variant text-[10px] font-medium uppercase tracking-wider">Cor Externa</p>
            <p className="text-on-surface text-xs font-bold">{vehicle.color}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Preço Especial</p>
            <p className="text-primary font-black text-xl">R$ {formatPrice(vehicle.price)}</p>
          </div>
          <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-pill">
            Ver Detalhes
          </span>
        </div>
      </div>
    </Link>
  );
};

export default VehicleCard;
