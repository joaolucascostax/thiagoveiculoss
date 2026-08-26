import { Link } from "react-router-dom";
import { Car, CheckCircle, Sparkles, DollarSign } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import StatsCard from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: vehicles = [], isLoading } = useVehicles();

  const total = vehicles.length;
  const active = vehicles.filter((v) => v.is_active).length;
  const newOnes = vehicles.filter((v) => v.is_new).length;
  const avgPrice = total > 0 ? Math.round(vehicles.reduce((s, v) => s + v.price, 0) / total) : 0;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button asChild>
          <Link to="/admin/veiculos/novo">+ Novo Veículo</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total de Veículos" value={total} icon={Car} />
        <StatsCard title="Ativos no Site" value={active} icon={CheckCircle} />
        <StatsCard title="Novos (0 KM)" value={newOnes} icon={Sparkles} />
        <StatsCard
          title="Preço Médio"
          value={`R$ ${avgPrice.toLocaleString("pt-BR")}`}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/veiculos"
          className="p-6 bg-card rounded-lg border hover:border-primary/50 transition-colors"
        >
          <Car className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-bold">Gerenciar Veículos</h3>
          <p className="text-sm text-muted-foreground">Adicionar, editar ou remover veículos do estoque</p>
        </Link>
        <Link
          to="/admin/configuracoes"
          className="p-6 bg-card rounded-lg border hover:border-primary/50 transition-colors"
        >
          <Sparkles className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-bold">Configurações da Loja</h3>
          <p className="text-sm text-muted-foreground">Telefone, WhatsApp e mais</p>
        </Link>
      </div>
    </div>
  );
}
