import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLeads, useUpdateLeadStatus, useDeleteLead, type Lead, type LeadStatus } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, MessageCircle, Flame, Car as CarIcon, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLUMNS: { key: Exclude<LeadStatus, "aguardando_contato">; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { key: "qualificado", label: "Qualificado", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { key: "vendido", label: "Vendido", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { key: "perdido", label: "Perdido", color: "bg-muted text-muted-foreground" },
];

function scoreBadge(tag: string | null) {
  if (!tag) return null;
  const t = tag.toLowerCase();
  if (t.includes("quente")) return <Badge className="bg-red-500/10 text-red-700 border-red-500/20"><Flame className="h-3 w-3 mr-1" />{tag}</Badge>;
  if (t.includes("morno")) return <Badge variant="secondary">{tag}</Badge>;
  return <Badge variant="outline">{tag}</Badge>;
}

export default function LeadsPage() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const deleteLead = useDeleteLead();
  const [saleDialog, setSaleDialog] = useState<Lead | null>(null);
  const [saleValue, setSaleValue] = useState("");
  const [scoringId, setScoringId] = useState<string | null>(null);

  const runScore = async (leadId: string) => {
    setScoringId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("lead-score", { body: { leadId } });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; tag?: string };
      if (res.ok) {
        toast.success(`Lead classificado: ${res.tag}`);
        qc.invalidateQueries({ queryKey: ["leads"] });
      } else {
        toast.error(res.error ?? "Falha na análise");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setScoringId(null);
    }
  };


  // Cliques que ainda não viraram conversa ficam fora do Kanban
  const pending = useMemo(
    () => leads.filter((l) => l.status === "aguardando_contato"),
    [leads]
  );

  const columns = useMemo(() => {
    const map: Record<Exclude<LeadStatus, "aguardando_contato">, Lead[]> = {
      novo: [],
      qualificado: [],
      vendido: [],
      perdido: [],
    };
    leads.forEach((l) => {
      if (l.status !== "aguardando_contato") map[l.status].push(l);
    });
    return map;
  }, [leads]);

  const confirmContact = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "novo" });
      toast.success("Clique confirmado como lead");
    } catch {
      toast.error("Erro ao confirmar");
    }
  };


  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("leadId", id);
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("leadId");
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;

    if (status === "vendido") {
      setSaleValue(lead.vehicles?.price?.toString() ?? "");
      setSaleDialog(lead);
      return;
    }
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Lead movido para ${status}`);
    } catch (err) {
      toast.error("Erro ao mover lead");
    }
  };


  const confirmSale = async () => {
    if (!saleDialog) return;
    const value = Number(saleValue) || null;
    try {
      await updateStatus.mutateAsync({ id: saleDialog.id, status: "vendido", sale_value: value });
      toast.success("Venda registrada");
      setSaleDialog(null);
      setSaleValue("");
    } catch {
      toast.error("Erro ao registrar venda");
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Leads — Kanban</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Só entra no Kanban quem <strong>realmente falou com você</strong>. Cliques no botão de WhatsApp
          ficam no bloco <strong>Cliques aguardando contato</strong> abaixo — confirme lá e o clique vira lead.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Cliques aguardando contato</h2>
            <p className="text-xs text-muted-foreground">
              Alguém clicou no WhatsApp mas ainda não confirmamos conversa. Não conta como lead nos relatórios.
              O código <code className="bg-muted px-1 rounded">SITE-…</code> abaixo é o mesmo que vem na mensagem
              do cliente — use para saber o veículo e o canal de origem.
            </p>

          </div>
          <Badge variant="secondary">{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Nenhum clique pendente</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {pending.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    {lead.vehicles
                      ? `${lead.vehicles.brand} ${lead.vehicles.model} ${lead.vehicles.year}`
                      : lead.message || "Clique no WhatsApp"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                    {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}
                  </p>
                  {lead.tracking_code && (
                    <code className="text-[10px] bg-background border rounded px-1 py-0.5 mt-1 inline-block">
                      {lead.tracking_code}
                    </code>
                  )}

                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => confirmContact(lead.id)}>
                    Confirmar contato
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (confirm("Descartar este clique?")) deleteLead.mutate(lead.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>


      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
              className="bg-muted/30 rounded-lg p-3 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-3">
                <Badge className={col.color}>{col.label}</Badge>
                <span className="text-xs text-muted-foreground">{columns[col.key].length}</span>
              </div>
              <div className="space-y-2">
                {columns[col.key].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead</p>
                )}
                {columns[col.key].map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {lead.name || "Sem nome"}
                        </p>
                        {lead.phone && (
                          <a
                            href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => {
                          if (confirm("Excluir este lead?")) {
                            deleteLead.mutate(lead.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {lead.vehicles && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <CarIcon className="h-3 w-3" />
                        <span className="truncate">
                          {lead.vehicles.brand} {lead.vehicles.model} {lead.vehicles.year}
                        </span>
                      </div>
                    )}

                    {lead.score_tag ? (
                      <div className="mb-2 flex items-center gap-2" title={lead.score_reason ?? ""}>
                        {scoreBadge(lead.score_tag)}
                        {lead.score !== null && (
                          <span className="text-[10px] text-muted-foreground">{lead.score}/100</span>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 mb-2 text-[10px] w-full"
                        disabled={scoringId === lead.id}
                        onClick={() => runScore(lead.id)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {scoringId === lead.id ? "Analisando…" : "Analisar com IA"}
                      </Button>
                    )}

                    {lead.utm_source && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        {lead.utm_source} · {lead.utm_campaign || "—"}
                      </p>
                    )}

                    {lead.tracking_code && (
                      <code className="text-[10px] bg-muted rounded px-1 py-0.5 mb-1 inline-block">
                        {lead.tracking_code}
                      </code>
                    )}


                    {lead.sale_value && lead.status === "vendido" && (
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {Number(lead.sale_value).toLocaleString("pt-BR")}
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!saleDialog} onOpenChange={(open) => !open && setSaleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar venda</DialogTitle>
            <DialogDescription>
              Informe o valor da venda. Esse valor é enviado ao Meta como evento <code>Purchase</code>,
              melhorando drasticamente a otimização das campanhas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="sale-value">Valor da venda (R$)</Label>
            <Input
              id="sale-value"
              type="number"
              value={saleValue}
              onChange={(e) => setSaleValue(e.target.value)}
              placeholder="45000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmSale} disabled={updateStatus.isPending}>
              Confirmar venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
