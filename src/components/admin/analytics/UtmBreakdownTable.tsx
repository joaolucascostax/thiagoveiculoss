import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface UtmRow {
  key: string;
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
  views: number;
  clicks: number;
  leads: number;
  conversion: number;
}

export default function UtmBreakdownTable({ rows }: { rows: UtmRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Detalhe por UTM</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum evento com UTM no período. Adicione parâmetros <code>utm_source</code>, <code>utm_campaign</code> e <code>utm_content</code> aos links dos seus criativos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Criativo</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>{r.utm_source || "—"}</TableCell>
                  <TableCell>{r.utm_campaign || "—"}</TableCell>
                  <TableCell>{r.utm_content || "—"}</TableCell>
                  <TableCell className="text-right">{r.views}</TableCell>
                  <TableCell className="text-right">{r.clicks}</TableCell>
                  <TableCell className="text-right font-bold">{r.leads}</TableCell>
                  <TableCell className="text-right">{r.conversion.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
