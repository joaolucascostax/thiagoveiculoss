import { useQuery } from "@tanstack/react-query";
import { Copy, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

const FEED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalogo-whatsapp`;

type Audit = {
  total: number;
  emitted: number;
  dropped_count: number;
  generated_at: string;
  dropped: { id: string; title: string; reason: string }[];
  issues: { id: string; title: string; issue: string }[];
};

export default function CatalogPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["catalog-audit"],
    queryFn: async (): Promise<Audit> => {
      const res = await fetch(`${FEED_URL}?debug=1`);
      if (!res.ok) throw new Error("Falha ao gerar auditoria do feed");
      return res.json();
    },
  });

  const copy = async () => {
    await navigator.clipboard.writeText(FEED_URL);
    toast({ title: "URL copiada", description: "Cole no Commerce Manager como feed agendado." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider">Catálogo WhatsApp</h2>
          <p className="text-sm text-muted-foreground">Feed XML (e-commerce) do estoque para WhatsApp e Loja.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={FEED_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir feed
            </a>
          </Button>
          <Button size="sm" onClick={copy}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar URL do feed
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Veículos no banco", value: data?.total },
          { label: "Emitidos no feed", value: data?.emitted },
          { label: "Descartados", value: data?.dropped_count },
          {
            label: "Última geração",
            value: data ? new Date(data.generated_at).toLocaleString("pt-BR") : undefined,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold mt-1">{isLoading ? "…" : s.value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Itens descartados</CardTitle></CardHeader>
        <CardContent>
          {!data?.dropped.length ? (
            <p className="text-sm text-muted-foreground">Nenhum item descartado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Título</TableHead><TableHead>Motivo</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data.dropped.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}</TableCell>
                    <TableCell>{d.title}</TableCell>
                    <TableCell className="text-destructive text-sm">{d.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Inconsistências do estoque</CardTitle></CardHeader>
        <CardContent>
          {!data?.issues.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma inconsistência encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>ID</TableHead><TableHead>Veículo</TableHead><TableHead>Problema</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {data.issues.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}</TableCell>
                    <TableCell>{d.title}</TableCell>
                    <TableCell className="text-sm">{d.issue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
