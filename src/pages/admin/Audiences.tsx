import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HelpBanner from "@/components/admin/HelpBanner";
import { toast } from "sonner";
import { Users, RefreshCw, ShoppingBag, Eye } from "lucide-react";

type SyncResult = {
  ok: boolean;
  audiences?: {
    visitors: { id: string; pushed: number; total: number };
    leads: { id: string; pushed: number; total: number };
    buyers: { id: string; pushed: number; total: number };
  };
  error?: string;
  detail?: string;
};

const AUDIENCES = [
  {
    key: "visitors" as const,
    icon: Eye,
    name: "Visitantes 90d",
    description: "Todos que visitaram o site nos últimos 90 dias. Base para retargeting de tráfego.",
  },
  {
    key: "leads" as const,
    icon: Users,
    name: "Leads 90d",
    description: "Quem clicou no WhatsApp. Público mais engajado para remarketing agressivo.",
  },
  {
    key: "buyers" as const,
    icon: ShoppingBag,
    name: "Compradores",
    description: "Base de compradores confirmados. Use como semente para Lookalike (público semelhante).",
  },
];

export default function AudiencesPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-audiences-sync", { body: {} });
      if (error) throw error;
      const res = data as SyncResult;
      setResult(res);
      if (res.ok) toast.success("Públicos sincronizados no Meta");
      else toast.error(res.error ?? "Erro ao sincronizar");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error(msg);
      setResult({ ok: false, error: msg });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Públicos personalizados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Custom Audiences do Meta sincronizados automaticamente com dados da plataforma. Base para retargeting e Lookalikes.
        </p>
      </div>

      <HelpBanner title="Para que serve esta página?">
        <p>
          Manda automaticamente 3 listas de pessoas para o seu Business Manager do Meta. Elas viram <strong>Custom Audiences</strong> que você
          usa dentro do Ads Manager para:
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Retargeting</strong> — mostrar anúncio de novo para quem já visitou/entrou em contato.</li>
          <li><strong>Lookalike (público semelhante)</strong> — o Meta acha pessoas parecidas com seus compradores.</li>
          <li><strong>Excluir</strong> — não gastar anúncio com quem já comprou.</li>
        </ul>
        <p>
          <strong>Complementa</strong> (não substitui) as Website Custom Audiences que o próprio Pixel cria dentro do Ads Manager.
        </p>
        <p>Clique em <em>Sincronizar agora</em> pelo menos 1x por semana para manter os públicos atualizados.</p>
      </HelpBanner>

      <Card className="p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Sincronização manual</h3>
            <p className="text-sm text-muted-foreground">
              Cria (se não existir) e atualiza os 3 públicos no seu Business Manager. Requer{" "}
              <code className="text-xs bg-muted px-1 rounded">ads_management</code> no token.
            </p>
          </div>
          <Button onClick={runSync} disabled={syncing} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando…" : "Sincronizar agora"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {AUDIENCES.map((a) => {
          const stats = result?.audiences?.[a.key];
          return (
            <Card key={a.key} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <a.icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{a.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{a.description}</p>
              {stats ? (
                <div className="space-y-1">
                  <Badge variant="secondary">{stats.pushed} usuários enviados</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Total detectado: {stats.total}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sincronize para ver dados</p>
              )}
            </Card>
          );
        })}
      </div>

      {result?.error && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <p className="text-sm font-semibold text-destructive">Erro na sincronização</p>
          <p className="text-xs text-muted-foreground mt-1">{result.detail ?? result.error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Verifique se <code>META_AD_ACCOUNT_ID</code> tem prefixo <code>act_</code> e se o token tem escopo{" "}
            <code>ads_management</code>.
          </p>
        </Card>
      )}
    </div>
  );
}
