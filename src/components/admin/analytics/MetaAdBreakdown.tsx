import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MetaAdInsight } from "@/hooks/useMetaCampaigns";

export interface AdBreakdownLead {
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

type Level = "adset" | "ad";

interface Row {
  id: string;
  name: string;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpc: number;
  cpl: number;
  target: number;
  verdict: Verdict;
}

type Verdict = "escalar" | "revisar" | "pausar" | "aprendendo";

const VERDICT_STYLE: Record<Verdict, { label: string; className: string }> = {
  escalar: { label: "Escalar", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  revisar: { label: "Revisar", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  pausar: { label: "Pausar", className: "bg-red-500/10 text-red-700 border-red-500/20" },
  aprendendo: { label: "Aprendendo", className: "bg-muted text-muted-foreground" },
};

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function norm(s: string | null | undefined) {
  return (s || "").trim().toLowerCase();
}

/**
 * Semáforo de ação:
 *  - Gasto baixo (< 1x meta de CPL) → ainda aprendendo, não julgar.
 *  - Sem lead e já gastou 2x a meta → pausar.
 *  - CPL <= meta → escalar. CPL até 1,5x a meta → revisar. Acima → pausar.
 *  - Sem meta definida, cai para CTR: < 0,8% revisar, < 0,4% pausar.
 */
function judge(spend: number, leads: number, cpl: number, target: number, ctr: number): Verdict {
  if (target > 0) {
    if (spend < target) return "aprendendo";
    if (leads === 0) return spend >= target * 2 ? "pausar" : "revisar";
    if (cpl <= target) return "escalar";
    if (cpl <= target * 1.5) return "revisar";
    return "pausar";
  }
  if (spend < 20) return "aprendendo";
  if (leads > 0) return "escalar";
  if (ctr < 0.4) return "pausar";
  if (ctr < 0.8) return "revisar";
  return "revisar";
}

export default function MetaAdBreakdown({
  insights,
  leads,
  targets,
}: {
  insights: MetaAdInsight[];
  leads: AdBreakdownLead[];
  targets: Record<string, number>;
}) {
  const [level, setLevel] = useState<Level>("adset");

  const rows = useMemo<Row[]>(() => {
    const agg = new Map<string, Row>();
    for (const i of insights) {
      if (i.level !== level) continue;
      const name = (level === "adset" ? i.adset_name : i.ad_name) || "(sem nome)";
      const key = i.object_id;
      const prev =
        agg.get(key) ??
        ({
          id: key,
          name,
          campaign: i.campaign_name || "—",
          spend: 0,
          impressions: 0,
          clicks: 0,
          leads: 0,
          ctr: 0,
          cpc: 0,
          cpl: 0,
          target: targets[i.campaign_name || ""] ?? 0,
          verdict: "aprendendo",
        } as Row);
      prev.spend += Number(i.spend || 0);
      prev.impressions += Number(i.impressions || 0);
      prev.clicks += Number(i.clicks || 0);
      agg.set(key, prev);
    }

    // Atribuição: o nome do conjunto/anúncio precisa vir em utm_term / utm_content.
    for (const row of agg.values()) {
      const n = norm(row.name);
      row.leads = leads.filter((l) =>
        level === "adset" ? norm(l.utm_term) === n : norm(l.utm_content) === n
      ).length;
      row.ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
      row.cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
      row.cpl = row.leads > 0 ? row.spend / row.leads : 0;
      row.verdict = judge(row.spend, row.leads, row.cpl, row.target, row.ctr);
    }

    return [...agg.values()].sort((a, b) => b.spend - a.spend);
  }, [insights, leads, level, targets]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">
          Desempenho por {level === "adset" ? "Conjunto" : "Anúncio"}
        </CardTitle>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {(["adset", "ad"] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                level === l ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
              }`}
            >
              {l === "adset" ? "Conjuntos" : "Anúncios"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 leading-relaxed">
          <strong>Como ler o semáforo:</strong> <em>Escalar</em> = CPL dentro da meta, pode aumentar o orçamento.{" "}
          <em>Revisar</em> = está caro ou sem sinal claro, troque criativo/público. <em>Pausar</em> = gastou o
          suficiente sem resultado. <em>Aprendendo</em> = ainda sem gasto suficiente para decidir.
          <br />
          Para os leads baterem por conjunto/anúncio, use{" "}
          <code className="bg-background px-1 rounded">utm_term=&#123;&#123;adset.name&#125;&#125;</code> e{" "}
          <code className="bg-background px-1 rounded">utm_content=&#123;&#123;ad.name&#125;&#125;</code> nos
          parâmetros de URL do Ads Manager.
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nada sincronizado ainda. Clique em <em>Sincronizar Meta</em> no topo desta página.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{level === "adset" ? "Conjunto" : "Anúncio"}</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const v = VERDICT_STYLE[r.verdict];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium max-w-[220px] truncate" title={r.name}>
                        {r.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[160px] truncate" title={r.campaign}>
                        {r.campaign}
                      </TableCell>
                      <TableCell className="text-right">{fmtBRL(r.spend)}</TableCell>
                      <TableCell className="text-right">{r.ctr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{r.cpc > 0 ? fmtBRL(r.cpc) : "—"}</TableCell>
                      <TableCell className="text-right">{r.leads}</TableCell>
                      <TableCell className="text-right">{r.cpl > 0 ? fmtBRL(r.cpl) : "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={v.className}>
                          {v.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
