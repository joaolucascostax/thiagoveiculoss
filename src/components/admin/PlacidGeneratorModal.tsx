import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, AlertCircle, CheckCircle2, Package } from "lucide-react";
import { usePlacidGenerate, type PlacidResult } from "@/hooks/usePlacidGenerate";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleIds: string[];
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function PlacidGeneratorModal({ open, onOpenChange, vehicleIds }: Props) {
  const gen = usePlacidGenerate();
  const [results, setResults] = useState<PlacidResult[]>([]);
  const [started, setStarted] = useState(false);

  const start = async () => {
    setStarted(true);
    setResults([]);
    try {
      const res = await gen.mutateAsync(vehicleIds);
      setResults(res);
      const ok = res.filter((r) => r.status === "success").length;
      const err = res.length - ok;
      if (err === 0) toast.success(`${ok} criativo(s) gerado(s)!`);
      else toast.warning(`${ok} sucesso · ${err} erro(s)`);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar criativos");
    }
  };

  const reset = () => {
    setResults([]);
    setStarted(false);
    onOpenChange(false);
  };

  const downloadOne = async (r: PlacidResult) => {
    if (!r.image_url) return;
    try {
      const res = await fetch(r.image_url);
      const blob = await res.blob();
      saveAs(blob, `${slugify(r.label || r.vehicle_id)}.jpg`);
    } catch {
      window.open(r.image_url, "_blank");
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const success = results.filter((r) => r.status === "success" && r.image_url);
    toast.info("Preparando .zip...");
    await Promise.all(
      success.map(async (r) => {
        const res = await fetch(r.image_url!);
        const blob = await res.blob();
        zip.file(`${slugify(r.label || r.vehicle_id)}.jpg`, blob);
      }),
    );
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `criativos-${Date.now()}.zip`);
  };

  const successCount = results.filter((r) => r.status === "success").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar criativos ({vehicleIds.length} veículos)</DialogTitle>
        </DialogHeader>

        {!started && (
          <div className="py-6 text-sm text-muted-foreground">
            Gerar imagens no template Placid para os veículos selecionados. Pode levar alguns segundos por criativo.
          </div>
        )}

        {gen.isPending && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando {vehicleIds.length} criativo(s)...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {successCount} de {results.length} gerado(s) com sucesso
              </p>
              {successCount > 0 && (
                <Button size="sm" variant="outline" onClick={downloadAll} className="gap-2">
                  <Package className="h-4 w-4" /> Baixar todos (.zip)
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((r) => (
                <div key={r.vehicle_id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="font-medium truncate">{r.label || r.vehicle_id}</span>
                  </div>
                  {r.status === "success" && r.image_url ? (
                    <>
                      <img src={r.image_url} alt={r.label} className="w-full aspect-square object-cover rounded bg-muted" />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => downloadOne(r)}>
                          <Download className="h-3 w-3" /> Baixar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          navigator.clipboard.writeText(r.image_url!);
                          toast.success("Link copiado");
                        }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-destructive">{r.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {!started ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={start} disabled={vehicleIds.length === 0}>Gerar criativos</Button>
            </>
          ) : (
            <Button variant="outline" onClick={reset} disabled={gen.isPending}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
