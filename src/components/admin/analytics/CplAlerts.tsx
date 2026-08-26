import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignRow } from "./MetaCampaignsTable";

export default function CplAlerts({ rows }: { rows: CampaignRow[] }) {
  const alerts = rows.filter((r) => r.target > 0 && r.cpl > r.target);
  if (alerts.length === 0) return null;

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Alertas de CPL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a) => (
          <div key={a.campaign_name} className="flex items-center justify-between text-sm p-2 rounded-md bg-destructive/5">
            <span className="font-medium">{a.campaign_name}</span>
            <span className="text-xs tabular-nums">
              CPL <span className="font-bold text-destructive">R$ {a.cpl.toFixed(2)}</span>
              <span className="text-muted-foreground"> · meta R$ {a.target.toFixed(2)}</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
