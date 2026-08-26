import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpsertTarget } from "@/hooks/useMetaCampaigns";
import { toast } from "sonner";

export interface CampaignRow {
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  target: number;
}

function fmtBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MetaCampaignsTable({ rows }: { rows: CampaignRow[] }) {
  const upsert = useUpsertTarget();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const save = async (name: string) => {
    const raw = drafts[name];
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Informe um valor válido");
      return;
    }
    try {
      await upsert.mutateAsync({ campaign_name: name, cpl_target: value });
      toast.success("Meta atualizada");
      setDrafts((d) => {
        const n = { ...d };
        delete n[name];
        return n;
      });
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Custo por Lead (Meta Ads)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 leading-relaxed">
          <strong>⚠️ Importante:</strong> para que os leads sejam atribuídos corretamente a cada campanha, os URLs
          dos criativos precisam usar o parâmetro dinâmico{" "}
          <code className="bg-background px-1 rounded">utm_campaign=&#123;&#123;campaign.name&#125;&#125;</code> no Ads Manager
          (Detalhes de URL → Parâmetros). Sem isso, o gasto aparece aqui mas o CPL fica em branco.
        </div>
        {rows.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              Nenhuma campanha sincronizada. Clique em <em>Sincronizar Meta</em> no topo desta página.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Gasto</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">Meta CPL</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const ok = r.target > 0 && r.cpl > 0 && r.cpl <= r.target;
                const bad = r.target > 0 && r.cpl > r.target;
                return (
                  <TableRow key={r.campaign_name}>
                    <TableCell className="font-medium">{r.campaign_name}</TableCell>
                    <TableCell className="text-right">{fmtBRL(r.spend)}</TableCell>
                    <TableCell className="text-right">{r.impressions.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{r.clicks.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{r.leads}</TableCell>
                    <TableCell className="text-right font-bold">{r.cpl > 0 ? fmtBRL(r.cpl) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          className="h-8 w-24 text-right"
                          value={drafts[r.campaign_name] ?? String(r.target || "")}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [r.campaign_name]: e.target.value }))
                          }
                        />
                        <Button size="sm" variant="ghost" onClick={() => save(r.campaign_name)}>
                          ok
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {bad ? "🔴" : ok ? "✅" : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
