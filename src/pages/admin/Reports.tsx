import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Report = {
  id: string;
  period_start: string;
  period_end: string;
  spend: number;
  leads_count: number;
  qualified_count: number;
  sold_count: number;
  revenue: number;
  cpl: number | null;
  roas: number | null;
  top_vehicles: { name: string; count: number }[];
  top_campaign: { name: string; spend: number; clicks: number } | null;
  cpl_alerts: { campaign: string; cpl: number; target: number }[];
  created_at: string;
};

export default function ReportsPage() {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["weekly_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .order("period_end", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as unknown as Report[];
    },
  });

  const generate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-report", { body: {} });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string };
      if (res.ok) {
        toast.success("Relatório gerado");
        qc.invalidateQueries({ queryKey: ["weekly_reports"] });
      } else {
        toast.error(res.error ?? "Erro");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setGenerating(false);
    }
  };

  const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">Relatórios semanais</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Snapshot dos últimos 7 dias: gasto, leads, CPL, ROAS, top veículos e alertas.
          </p>
        </div>
        <Button onClick={generate} disabled={generating}>
          <Play className="h-4 w-4 mr-2" />
          {generating ? "Gerando…" : "Gerar relatório agora"}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum relatório ainda. Clique em <strong>Gerar relatório agora</strong> para criar o primeiro.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold">
                    {format(new Date(r.period_start), "dd MMM", { locale: ptBR })} —{" "}
                    {format(new Date(r.period_end), "dd MMM yyyy", { locale: ptBR })}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gerado {format(new Date(r.created_at), "dd/MM 'às' HH:mm")}
                  </p>
                </div>
                {r.roas !== null && r.roas > 0 && (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    ROAS {r.roas.toFixed(2)}x
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <Stat label="Gasto" value={brl(Number(r.spend))} />
                <Stat label="Leads" value={String(r.leads_count)} />
                <Stat label="Qualificados" value={String(r.qualified_count)} />
                <Stat label="Vendas" value={String(r.sold_count)} />
                <Stat label="CPL" value={r.cpl ? brl(Number(r.cpl)) : "—"} />
              </div>

              {r.top_vehicles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Top veículos</p>
                  <ul className="text-sm space-y-1">
                    {r.top_vehicles.map((v, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{v.name}</span>
                        <span className="text-muted-foreground">{v.count} leads</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.top_campaign && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Top campanha</p>
                  <p className="text-sm">
                    {r.top_campaign.name} · {brl(Number(r.top_campaign.spend))} · {r.top_campaign.clicks} cliques
                  </p>
                </div>
              )}

              {r.cpl_alerts.length > 0 && (
                <div className="mt-3 p-3 rounded-md bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-semibold text-destructive">Alertas de CPL</p>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {r.cpl_alerts.map((a, i) => (
                      <li key={i}>
                        <strong>{a.campaign}</strong>: CPL {brl(a.cpl)} (meta {brl(a.target)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
