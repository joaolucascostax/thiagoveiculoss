import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VehicleEvent } from "@/hooks/useAnalytics";

type ChannelSource = Pick<Partial<VehicleEvent>, "fbclid" | "gclid" | "ttclid" | "utm_source" | "referrer">;

export interface ChannelLead {
  utm_source: string | null;
  fbc: string | null;
}

function classifyChannel(e: ChannelSource): string {
  if (e.fbclid || e.utm_source?.toLowerCase().includes("facebook") || e.utm_source?.toLowerCase().includes("meta") || e.utm_source?.toLowerCase().includes("instagram"))
    return "Meta Ads";
  if (e.gclid || e.utm_source?.toLowerCase().includes("google")) return "Google Ads";
  if (e.ttclid || e.utm_source?.toLowerCase().includes("tiktok")) return "TikTok";
  if (e.utm_source) return e.utm_source;
  const ref = e.referrer || "";
  if (/facebook|instagram|fb\.com|l\.facebook/i.test(ref)) return "Meta Orgânico";
  if (/google/i.test(ref)) return "Google Orgânico";
  if (/whatsapp|wa\.me/i.test(ref)) return "WhatsApp";
  if (/tiktok/i.test(ref)) return "TikTok Orgânico";
  if (!ref) return "Direto";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Outros";
  }
}

interface Row {
  channel: string;
  views: number;
  clicks: number;
  leads: number;
  conv: number;
}

export default function ChannelBreakdown({
  events,
  leads = [],
}: {
  events: VehicleEvent[];
  leads?: ChannelLead[];
}) {
  const map = new Map<string, Row>();
  const ensure = (ch: string) => {
    if (!map.has(ch)) map.set(ch, { channel: ch, views: 0, clicks: 0, leads: 0, conv: 0 });
    return map.get(ch)!;
  };
  for (const e of events) {
    const r = ensure(classifyChannel(e));
    if (e.event_type === "view") r.views++;
    else if (e.event_type === "whatsapp_click") r.clicks++;
  }
  // Leads confirmados vêm da tabela de leads (o evento "lead" não é mais gravado)
  for (const l of leads) {
    ensure(classifyChannel({ utm_source: l.utm_source, fbclid: l.fbc })).leads++;
  }
  const rows = Array.from(map.values())
    .map((r) => ({ ...r, conv: r.views > 0 ? (r.leads / r.views) * 100 : 0 }))
    .sort((a, b) => b.leads - a.leads || b.views - a.views);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Canais de Aquisição</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                <th className="py-2 pr-4">Canal</th>
                <th className="py-2 px-2 text-right">Views</th>
                <th className="py-2 px-2 text-right">Cliques</th>
                <th className="py-2 px-2 text-right">Leads</th>
                <th className="py-2 pl-2 text-right">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground text-xs">
                    Sem dados no período.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.channel} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.channel}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.views}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.clicks}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold text-primary">{r.leads}</td>
                  <td className="py-2 pl-2 text-right tabular-nums">{r.conv.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export { classifyChannel };
