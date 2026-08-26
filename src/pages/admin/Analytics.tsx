import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, MessageCircle, Target, TrendingUp, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/admin/StatsCard";
import ViewsLeadsChart from "@/components/admin/analytics/ViewsLeadsChart";
import TopVehiclesTable, { type TopVehicleRow } from "@/components/admin/analytics/TopVehiclesTable";
import UtmBreakdownTable, { type UtmRow } from "@/components/admin/analytics/UtmBreakdownTable";
import MetaCampaignsTable, { type CampaignRow } from "@/components/admin/analytics/MetaCampaignsTable";
import FunnelCard from "@/components/admin/analytics/FunnelCard";
import ChannelBreakdown from "@/components/admin/analytics/ChannelBreakdown";
import DeviceBreakdown from "@/components/admin/analytics/DeviceBreakdown";
import RoasCard from "@/components/admin/analytics/RoasCard";
import CplAlerts from "@/components/admin/analytics/CplAlerts";
import MetaAdBreakdown from "@/components/admin/analytics/MetaAdBreakdown";
import HelpBanner from "@/components/admin/HelpBanner";
import { useAnalytics, type VehicleEvent } from "@/hooks/useAnalytics";
import { useMetaCampaigns, useCampaignTargets, useMetaAdInsights } from "@/hooks/useMetaCampaigns";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";





const PERIODS = [7, 14, 30] as const;

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function daysBack(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function Analytics() {
  const qc = useQueryClient();
  const [days, setDays] = useState<number>(30);

  const { data: events = [], isLoading } = useAnalytics(days);
  const { data: campaigns = [] } = useMetaCampaigns(days);
  const { data: targets = [] } = useCampaignTargets();
  const { data: adInsights = [] } = useMetaAdInsights(days);
  const { data: settings } = useStoreSettings();
  const { data: allLeads = [] } = useLeads();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgMargin = Number((settings as any)?.avg_deal_margin ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastSync = (settings as any)?.meta_last_sync_at as string | null | undefined;
  const [syncError, setSyncError] = useState<{ title: string; hint?: string } | null>(null);

  // Leads confirmados = tudo que não está "aguardando contato"
  const { confirmedLeads, soldCount, revenue, leadsByCampaign, confirmedLeadRows } = useMemo(() => {
    const since = Date.now() - days * 86_400_000;
    const inPeriod = allLeads.filter(
      (l) => new Date(l.created_at).getTime() >= since && l.status !== "aguardando_contato"
    );
    const byCampaign: Record<string, number> = {};
    let sold = 0;
    let rev = 0;
    for (const l of inPeriod) {
      if (l.utm_campaign) byCampaign[l.utm_campaign] = (byCampaign[l.utm_campaign] || 0) + 1;
      if (l.status === "vendido") {
        sold++;
        rev += Number(l.sale_value ?? 0);
      }
    }
    return {
      confirmedLeads: inPeriod.length,
      soldCount: sold,
      revenue: rev,
      leadsByCampaign: byCampaign,
      confirmedLeadRows: inPeriod.map((l) => ({
        utm_campaign: l.utm_campaign ?? null,
        utm_content: l.utm_content ?? null,
        utm_term: l.utm_term ?? null,
        utm_source: l.utm_source ?? null,
        fbc: l.fbc ?? null,
        device_type: l.device_type ?? null,
      })),
    };
  }, [allLeads, days]);

  const { views, clicks, series, topVehicles, utmRows, campaignRows } = useMemo(() => {
    let vw = 0,
      cl = 0;

    const since = Date.now() - days * 86_400_000;
    const confirmed = allLeads.filter(
      (l) => new Date(l.created_at).getTime() >= since && l.status !== "aguardando_contato"
    );
    const leadsByVehicle: Record<string, number> = {};
    const leadsByUtmKey: Record<string, number> = {};
    const leadsByDay: Record<string, number> = {};
    for (const l of confirmed) {
      if (l.vehicle_id) leadsByVehicle[l.vehicle_id] = (leadsByVehicle[l.vehicle_id] || 0) + 1;
      const k = `${l.utm_source ?? ""}|${l.utm_campaign ?? ""}|${l.utm_content ?? ""}`;
      leadsByUtmKey[k] = (leadsByUtmKey[k] || 0) + 1;
      const d = dayKey(l.created_at);
      leadsByDay[d] = (leadsByDay[d] || 0) + 1;
    }

    const byDay: Record<string, { views: number; leads: number }> = {};
    for (const d of daysBack(days)) byDay[d] = { views: 0, leads: leadsByDay[d] || 0 };

    const byVehicle: Record<string, TopVehicleRow> = {};
    const byUtm: Record<string, UtmRow> = {};

    for (const e of events as VehicleEvent[]) {
      if (e.event_type === "view") vw++;
      else if (e.event_type === "whatsapp_click") cl++;

      const d = dayKey(e.created_at);
      if (byDay[d] && e.event_type === "view") byDay[d].views++;

      if (e.vehicle_id && e.vehicles) {
        const key = e.vehicle_id;
        if (!byVehicle[key]) {
          byVehicle[key] = {
            vehicle_id: key,
            label: `${e.vehicles.brand} ${e.vehicles.model} ${e.vehicles.year}`,
            views: 0,
            clicks: 0,
            leads: 0,
            conversion: 0,
          };
        }
        if (e.event_type === "view") byVehicle[key].views++;
        else if (e.event_type === "whatsapp_click") byVehicle[key].clicks++;
      }

      const uKey = `${e.utm_source ?? ""}|${e.utm_campaign ?? ""}|${e.utm_content ?? ""}`;
      if (e.utm_source || e.utm_campaign || e.utm_content) {
        if (!byUtm[uKey]) {
          byUtm[uKey] = {
            key: uKey,
            utm_source: e.utm_source ?? "",
            utm_campaign: e.utm_campaign ?? "",
            utm_content: e.utm_content ?? "",
            views: 0,
            clicks: 0,
            leads: 0,
            conversion: 0,
          };
        }
        if (e.event_type === "view") byUtm[uKey].views++;
        else if (e.event_type === "whatsapp_click") byUtm[uKey].clicks++;
      }
    }

    const series = Object.entries(byDay).map(([date, v]) => ({
      date: date.slice(5),
      views: v.views,
      leads: v.leads,
    }));

    const topVehicles = Object.values(byVehicle)
      .map((r) => {
        const leads = leadsByVehicle[r.vehicle_id] || 0;
        return { ...r, leads, conversion: r.views > 0 ? (leads / r.views) * 100 : 0 };
      })
      .sort((a, b) => b.leads - a.leads || b.views - a.views)
      .slice(0, 10);

    const utmRows = Object.values(byUtm)
      .map((r) => {
        const leads = leadsByUtmKey[r.key] || 0;
        return { ...r, leads, conversion: r.views > 0 ? (leads / r.views) * 100 : 0 };
      })
      .sort((a, b) => b.leads - a.leads);

    // Meta campaigns aggregation
    const byCamp: Record<string, CampaignRow> = {};
    for (const c of campaigns) {
      if (!byCamp[c.campaign_name]) {
        byCamp[c.campaign_name] = {
          campaign_name: c.campaign_name,
          spend: 0,
          impressions: 0,
          clicks: 0,
          leads: 0,
          cpl: 0,
          target: 0,
        };
      }
      const row = byCamp[c.campaign_name];
      row.spend += Number(c.spend) || 0;
      row.impressions += c.impressions || 0;
      row.clicks += c.clicks || 0;
    }
    for (const [name, row] of Object.entries(byCamp)) {
      row.leads = leadsByCampaign[name] || 0;
      row.cpl = row.leads > 0 ? row.spend / row.leads : 0;
      row.target = targets.find((t) => t.campaign_name === name)?.cpl_target ?? 0;
    }

    return {
      views: vw,
      clicks: cl,
      series,
      topVehicles,
      utmRows,
      campaignRows: Object.values(byCamp).sort((a, b) => b.spend - a.spend),
    };
  }, [events, campaigns, targets, days, allLeads, leadsByCampaign]);

  const conversion = views > 0 ? (confirmedLeads / views) * 100 : 0;


  const exportCsv = () => {
    const lines = [
      "secao,chave,views,cliques,leads,conversao",
      ...utmRows.map((r) =>
        [
          "utm",
          `${r.utm_source}|${r.utm_campaign}|${r.utm_content}`,
          r.views,
          r.clicks,
          r.leads,
          r.conversion.toFixed(2),
        ].join(",")
      ),
      ...topVehicles.map((r) =>
        ["veiculo", r.label.replace(/,/g, " "), r.views, r.clicks, r.leads, r.conversion.toFixed(2)].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [syncing, setSyncing] = useState(false);
  const syncMeta = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-ads-sync", {
        body: { days },
      });
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string; hint?: string; upserted?: number };
      if (payload?.error === "meta_ads_not_configured") {
        const title = "Meta Ads não configurado — cadastre o token e o ID da conta.";
        setSyncError({ title });
        toast.error(title);
      } else if (payload?.error === "meta_access_blocked") {
        const title = "Meta bloqueou o acesso — token sem permissão na Ad Account.";
        setSyncError({ title, hint: payload.hint });
        toast.error(title, { description: payload.hint, duration: 12000 });
      } else if (payload?.error) {
        const title = `Falha ao sincronizar Meta Ads (${payload.error})`;
        setSyncError({ title, hint: payload.hint });
        toast.error(title, { description: payload.hint });
      } else {
        toast.success(`Sincronizado: ${payload?.upserted ?? 0} registros dos últimos ${days} dias`);
        qc.invalidateQueries({ queryKey: ["meta_campaigns"] });
        qc.invalidateQueries({ queryKey: ["store_settings"] });
      }
    } catch (err) {
      const title = (err as Error).message || "Falha ao sincronizar Meta Ads";
      setSyncError({ title });
      toast.error(title);
    } finally {
      setSyncing(false);
    }
  };




  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  days === p ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          <div className="flex flex-col items-end">
            <Button variant="outline" size="sm" onClick={syncMeta} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando…" : `Sincronizar Meta (${days}d)`}
            </Button>
            {lastSync && (
              <span className="text-[10px] text-muted-foreground mt-1">
                Última sincronização: {new Date(lastSync).toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {syncError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-semibold text-destructive">{syncError.title}</p>
          {syncError.hint && <p className="text-xs text-muted-foreground mt-1">{syncError.hint}</p>}
        </div>
      )}


      <HelpBanner title="Como ler esta página">
        <p><strong>Views</strong> = pessoas que abriram a ficha de um veículo.</p>
        <p><strong>Cliques WhatsApp</strong> = alguém clicou no botão. Ainda não é lead.</p>
        <p><strong>Leads</strong> = cliques que você confirmou na página Leads (saíram de "Cliques aguardando contato" e entraram no Kanban). Só eles contam em CPL, conversão e ROAS.</p>
        <p><strong>Taxa de Conversão</strong> = Leads confirmados ÷ Views.</p>
        <p><strong>Funil de Conversão</strong> mostra onde as pessoas desistem: Visita → Ficha do veículo → Clique WhatsApp → Lead confirmado.</p>
        <p><strong>Canais de Aquisição:</strong></p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Direto</strong> — digitou a URL, salvou nos favoritos ou veio sem referência.</li>
          <li><strong>Meta Orgânico</strong> — link do bio/story do Instagram/Facebook sem UTM.</li>
          <li><strong>Meta Ads</strong> — clicou em anúncio pago (tem <code>fbclid</code> ou <code>utm_source=facebook</code>).</li>
          <li><strong>Google Orgânico / Google Ads</strong> — busca não paga vs. anúncio (tem <code>gclid</code>).</li>
          <li><strong>WhatsApp</strong> — alguém compartilhou seu link no WhatsApp.</li>
        </ul>
        <p><strong>ROAS</strong> — quanto voltou para cada R$ 1 de anúncio. Fica <em>real</em> quando há vendas registradas no Kanban; sem vendas, mostramos uma estimativa.</p>
        <p><strong>Top 10 Veículos</strong> — carros que mais geraram interesse.</p>
        <p><strong>Custo por Lead (Meta Ads)</strong> — só bate leads com campanhas se você usar <code>utm_campaign=&#123;&#123;campaign.name&#125;&#125;</code> nos URLs dos criativos no Ads Manager. Sem isso, o Meta gasta mas o CPL fica em branco.</p>
        <p><strong>Detalhes por UTM</strong> — cada linha é uma combinação source/campaign/content dos parâmetros que você adicionou nos anúncios. Use para descobrir qual criativo específico converte melhor.</p>
      </HelpBanner>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Views" value={isLoading ? "…" : views} icon={Eye} />
        <StatsCard title="Cliques WhatsApp" value={isLoading ? "…" : clicks} icon={MessageCircle} />
        <StatsCard title="Leads confirmados" value={isLoading ? "…" : confirmedLeads} icon={Target} />
        <StatsCard
          title="Taxa de Conversão"
          value={isLoading ? "…" : `${conversion.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <ViewsLeadsChart data={series} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunnelCard events={events as VehicleEvent[]} confirmedLeads={confirmedLeads} />
        <DeviceBreakdown events={events as VehicleEvent[]} leads={confirmedLeadRows} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChannelBreakdown events={events as VehicleEvent[]} leads={confirmedLeadRows} />
        <RoasCard
          leads={confirmedLeads}
          spend={campaignRows.reduce((s, c) => s + c.spend, 0)}
          margin={avgMargin}
          revenue={revenue}
          soldCount={soldCount}
        />
      </div>


      <CplAlerts rows={campaignRows} />

      <TopVehiclesTable rows={topVehicles} />

      <MetaCampaignsTable rows={campaignRows} />

      <MetaAdBreakdown
        insights={adInsights}
        leads={confirmedLeadRows}
        targets={Object.fromEntries(targets.map((t) => [t.campaign_name, Number(t.cpl_target)]))}
      />

      <UtmBreakdownTable rows={utmRows} />
    </div>
  );

}
