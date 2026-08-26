import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import type { VehicleEvent } from "@/hooks/useAnalytics";

export default function DeviceBreakdown({
  events,
  leads = [],
}: {
  events: VehicleEvent[];
  leads?: { device_type: string | null }[];
}) {
  const buckets: Record<string, { views: number; leads: number }> = {
    mobile: { views: 0, leads: 0 },
    desktop: { views: 0, leads: 0 },
    tablet: { views: 0, leads: 0 },
  };
  for (const e of events) {
    const d = (e.device_type as keyof typeof buckets) ?? null;
    if (!d || !buckets[d]) continue;
    if (e.event_type === "view") buckets[d].views++;
  }
  // Leads confirmados vêm da tabela de leads (o evento "lead" não é mais gravado)
  for (const l of leads) {
    const d = (l.device_type as keyof typeof buckets) ?? null;
    if (!d || !buckets[d]) continue;
    buckets[d].leads++;
  }
  const total = buckets.mobile.views + buckets.desktop.views + buckets.tablet.views;

  const rows = [
    { key: "mobile", label: "Mobile", Icon: Smartphone, ...buckets.mobile },
    { key: "desktop", label: "Desktop", Icon: Monitor, ...buckets.desktop },
    { key: "tablet", label: "Tablet", Icon: Tablet, ...buckets.tablet },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dispositivos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 && (
          <p className="text-xs text-muted-foreground">Sem dados de dispositivo ainda — colete alguns cliques novos.</p>
        )}
        {rows.map((r) => {
          const pct = total > 0 ? (r.views / total) * 100 : 0;
          const conv = r.views > 0 ? (r.leads / r.views) * 100 : 0;
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <r.Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{r.label}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {r.views} views · {r.leads} leads · {conv.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
