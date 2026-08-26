import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface TopVehicleRow {
  vehicle_id: string;
  label: string;
  views: number;
  clicks: number;
  leads: number;
  conversion: number;
}

export default function TopVehiclesTable({ rows }: { rows: TopVehicleRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-wider">Top 10 veículos por leads</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem dados no período.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Cliques WhatsApp</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.vehicle_id}>
                  <TableCell className="font-medium">{r.label}</TableCell>
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
