import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  /** Leads confirmados no período (não conta clique) */
  leads: number;
  spend: number;
  /** Margem média por venda, usada só no modo estimado */
  margin: number;
  /** Receita real: soma das vendas registradas no período */
  revenue: number;
  /** Quantidade de leads marcados como vendidos no período */
  soldCount: number;
}

const FALLBACK_CLOSE_RATE = 0.08;

function brl(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

export default function RoasCard({ leads, spend, margin, revenue, soldCount }: Props) {
  const real = soldCount > 0 && revenue > 0;
  if (!real && (!margin || margin <= 0)) return null;

  const closeRate = leads > 0 ? soldCount / leads : 0;
  const estimatedSales = leads * FALLBACK_CLOSE_RATE;
  const usedRevenue = real ? revenue : estimatedSales * margin;
  const roas = spend > 0 ? usedRevenue / spend : 0;
  const positive = roas >= 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {real ? "ROAS Real" : "ROAS Estimado"}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                ROAS é quanto você recebe de volta para cada R$ 1 gasto em anúncio. 2x significa que
                cada R$ 1 investido virou R$ 2 de receita.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {real ? "Retorno real do período" : "Retorno projetado"}
            </p>
            <p className="text-3xl font-black tabular-nums">{roas.toFixed(2)}x</p>
          </div>
          {positive ? (
            <TrendingUp className="h-8 w-8 text-primary" />
          ) : (
            <TrendingDown className="h-8 w-8 text-destructive" />
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Gasto</p>
            <p className="font-bold tabular-nums">{brl(spend)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{real ? "Vendas" : "Vendas est."}</p>
            <p className="font-bold tabular-nums">
              {real ? soldCount : estimatedSales.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{real ? "Receita" : "Receita est."}</p>
            <p className="font-bold tabular-nums">{brl(usedRevenue)}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          {real ? (
            <>
              Calculado com as vendas registradas no Kanban. Taxa de fechamento real do período:{" "}
              <strong>{(closeRate * 100).toFixed(1)}%</strong> ({soldCount} vendas ÷ {leads} leads
              confirmados).
            </>
          ) : (
            <>
              <strong>Estimativa</strong> — nenhuma venda registrada no período. Usamos 8% de taxa de
              fechamento × a margem média cadastrada em Configurações. Assim que você marcar vendas no
              Kanban, o cálculo passa a ser real.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
