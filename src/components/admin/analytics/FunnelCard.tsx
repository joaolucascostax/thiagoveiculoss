import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VehicleEvent } from "@/hooks/useAnalytics";

interface Props {
  events: VehicleEvent[];
  /** Leads confirmados no painel (não conta clique) */
  confirmedLeads: number;
}

interface Stage {
  label: string;
  count: number;
}

export default function FunnelCard({ events, confirmedLeads }: Props) {
  const views = events.filter((e) => e.event_type === "view").length;
  const contents = events.filter((e) => e.event_type === "view_content").length;
  const clicks = events.filter((e) => e.event_type === "whatsapp_click").length;

  const stages: Stage[] = [
    { label: "Visitas", count: views },
    { label: "Ficha do veículo", count: contents },
    { label: "Clique no WhatsApp", count: clicks },
    { label: "Leads confirmados", count: confirmedLeads },
  ];


  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((s, i) => {
          const width = (s.count / max) * 100;
          const prev = i > 0 ? stages[i - 1].count : 0;
          const drop = i > 0 && prev > 0 ? (1 - s.count / prev) * 100 : 0;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <span className="tabular-nums">
                  <span className="font-bold text-foreground">{s.count.toLocaleString("pt-BR")}</span>
                  {i > 0 && prev > 0 && (
                    <span className={`ml-2 ${drop > 70 ? "text-destructive" : "text-muted-foreground"}`}>
                      −{drop.toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-6 rounded-md bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.max(4, width)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
