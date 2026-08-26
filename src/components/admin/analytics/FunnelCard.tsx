import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, MessageCircle, CheckCircle2, ArrowDown } from "lucide-react";
import type { VehicleEvent } from "@/hooks/useAnalytics";

interface Props {
  events: VehicleEvent[];
  /** Leads confirmados no painel (não conta clique) */
  confirmedLeads: number;
}

interface Stage {
  key: string;
  label: string;
  icon: typeof Users;
  color: string;
}

const STAGES: Stage[] = [
  { key: "visitas", label: "Visitas", icon: Users, color: "bg-blue-500" },
  { key: "ficha", label: "Ficha do veículo", icon: FileText, color: "bg-indigo-500" },
  { key: "clique", label: "Clique no WhatsApp", icon: MessageCircle, color: "bg-amber-500" },
  { key: "lead", label: "Leads confirmados", icon: CheckCircle2, color: "bg-emerald-500" },
];

export default function FunnelCard({ events, confirmedLeads }: Props) {
  const counts = {
    visitas: events.filter((e) => e.event_type === "view").length,
    ficha: events.filter((e) => e.event_type === "view_content").length,
    clique: events.filter((e) => e.event_type === "whatsapp_click").length,
    lead: confirmedLeads,
  };

  const max = Math.max(1, counts.visitas || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {STAGES.map((stage, i) => {
          const count = counts[stage.key as keyof typeof counts];
          const prev = i > 0 ? counts[STAGES[i - 1].key as keyof typeof counts] : 0;
          const conversion = i > 0 && prev > 0 ? (count / prev) * 100 : 100;
          const width = Math.max(4, (count / max) * 100);
          const Icon = stage.icon;

          return (
            <div key={stage.key}>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${stage.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {stage.label}
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {count.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                {i > 0 && (
                  <div className="text-right min-w-[4.5rem]">
                    <p className="text-xs text-muted-foreground">conversão</p>
                    <p className={`text-sm font-bold tabular-nums ${conversion < 30 ? "text-destructive" : "text-foreground"}`}>
                      {conversion.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              {i < STAGES.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
