import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Sparkles, RefreshCw } from "lucide-react";
import { useVehicles, useUpdateVehicle, useDeleteVehicle } from "@/hooks/useVehicles";
import { useFeedSync, useLastFeedImport } from "@/hooks/useFeedSync";

import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import PlacidGeneratorModal from "@/components/admin/PlacidGeneratorModal";

export default function VehicleList() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [placidOpen, setPlacidOpen] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sorted = [...vehicles].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const filtered = search
    ? sorted.filter(
        (v) =>
          v.brand.toLowerCase().includes(search.toLowerCase()) ||
          v.model.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = filtered.length > 0 && filtered.every((v) => selected.has(v.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((v) => next.delete(v.id));
      else filtered.forEach((v) => next.add(v.id));
      return next;
    });
  };

  const toggleActive = (id: string, current: boolean) => {
    updateVehicle.mutate(
      { id, is_active: !current },
      { onSuccess: () => toast.success(current ? "Veículo desativado" : "Veículo ativado") }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    deleteVehicle.mutate(id, {
      onSuccess: () => toast.success("Veículo excluído"),
    });
  };

  const handleDragEnd = useCallback(async () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const reordered = [...sorted];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);

    const updates = reordered.map((v, i) => ({ ...v, display_order: i + 1 }));
    queryClient.setQueryData(["vehicles", { onlyActive: false }], updates);

    dragItem.current = null;
    dragOverItem.current = null;

    try {
      for (let i = 0; i < updates.length; i++) {
        await supabase
          .from("vehicles")
          .update({ display_order: updates[i].display_order })
          .eq("id", updates[i].id);
      }
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Ordem atualizada!");
    } catch {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.error("Erro ao salvar ordem");
    }
  }, [sorted, queryClient]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const canDrag = !search && selected.size === 0;

  const lastLabel = (() => {
    if (!lastImport) return "Nenhuma importação ainda.";
    const when = new Date(lastImport.started_at).toLocaleString("pt-BR");
    if (lastImport.error) return `Última importação (${when}) falhou: ${lastImport.error}`;
    if (!lastImport.finished_at) return `Importação em andamento desde ${when}...`;
    return `Última importação ${when} — ${lastImport.created_count} novos, ${lastImport.updated_count} atualizados, ${lastImport.deactivated_count} desativados (${lastImport.total_in_feed} no feed).`;
  })();

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold">Veículos ({vehicles.length})</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleFeedSync} disabled={feedSync.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${feedSync.isPending ? "animate-spin" : ""}`} />
            {feedSync.isPending ? "Importando..." : "Importar do feed"}
          </Button>
          <Button asChild>
            <Link to="/admin/veiculos/novo"><Plus className="h-4 w-4 mr-1" /> Novo Veículo</Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{lastLabel}</p>

      <Input
        placeholder="Buscar por marca ou modelo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {canDrag && (
        <p className="text-xs text-muted-foreground">Arraste as linhas para reordenar. Marque para gerar criativos.</p>
      )}


      <div className="bg-card rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
              </TableHead>
              {canDrag && <TableHead className="w-10" />}
              <TableHead>Veículo</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v, index) => (
              <TableRow
                key={v.id}
                draggable={canDrag}
                onDragStart={() => { dragItem.current = index; }}
                onDragEnter={() => { dragOverItem.current = index; }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={canDrag ? "cursor-grab active:cursor-grabbing" : ""}
                data-state={selected.has(v.id) ? "selected" : undefined}
              >
                <TableCell className="w-10">
                  <Checkbox
                    checked={selected.has(v.id)}
                    onCheckedChange={() => toggleSel(v.id)}
                    aria-label={`Selecionar ${v.brand} ${v.model}`}
                  />
                </TableCell>
                {canDrag && (
                  <TableCell className="w-10 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    {v.images?.[0] && (
                      <img src={v.images[0]} alt="" className="w-16 h-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{v.brand}</p>
                      <p className="text-xs text-muted-foreground">{v.model}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{v.year}</TableCell>
                <TableCell className="text-sm font-medium">R$ {v.price.toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${v.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {v.is_active ? "Ativo" : "Inativo"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(v.id, v.is_active)} title={v.is_active ? "Desativar" : "Ativar"}>
                      {v.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/admin/veiculos/${v.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum veículo encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-lg rounded-full px-4 py-2 flex items-center gap-3">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
          <Button size="sm" onClick={() => setPlacidOpen(true)} className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerar criativos
          </Button>
        </div>
      )}

      <PlacidGeneratorModal
        open={placidOpen}
        onOpenChange={setPlacidOpen}
        vehicleIds={Array.from(selected)}
      />
    </div>
  );
}
