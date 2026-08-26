import { useState, useEffect } from "react";
import { useStoreSettings, useUpdateStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, Store, Phone, MapPin, Save, SlidersHorizontal, Palette, RotateCcw, PackageSearch, RefreshCw } from "lucide-react";
import { applyPalette } from "@/lib/colors";

const DEFAULT_PALETTE = {
  color_primary: "#B23B3B",
  color_background: "#F5F1EA",
  color_foreground: "#1A1A1A",
};

export default function StoreSettings() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    store_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    banner_url: "",
    price_filter_min: 20000,
    price_filter_max: 1000000,
    avg_deal_margin: 0,
    meta_pixel_id: "",
    meta_dataset_id: "",
    color_primary: DEFAULT_PALETTE.color_primary,
    color_background: DEFAULT_PALETTE.color_background,
    color_foreground: DEFAULT_PALETTE.color_foreground,
  });

  useEffect(() => {
    if (settings) {
      const s: any = settings;
      setForm({
        store_name: settings.store_name,
        phone: settings.whatsapp,
        whatsapp: settings.whatsapp,
        address: settings.address,
        city: settings.city,
        banner_url: settings.banner_url,
        price_filter_min: settings.price_filter_min ?? 20000,
        price_filter_max: settings.price_filter_max ?? 1000000,
        avg_deal_margin: Number(s.avg_deal_margin ?? 0),
        meta_pixel_id: s.meta_pixel_id ?? "",
        meta_dataset_id: s.meta_dataset_id ?? "",
        color_primary: s.color_primary ?? DEFAULT_PALETTE.color_primary,
        color_background: s.color_background ?? DEFAULT_PALETTE.color_background,
        color_foreground: s.color_foreground ?? DEFAULT_PALETTE.color_foreground,
      });
    }
  }, [settings]);


  const set = (key: string, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  const setColor = (key: "color_primary" | "color_background" | "color_foreground", value: string) => {
    setForm((p) => {
      const next = { ...p, [key]: value };
      applyPalette({
        color_primary: next.color_primary,
        color_background: next.color_background,
        color_foreground: next.color_foreground,
      });
      return next;
    });
  };

  const resetPalette = () => {
    setForm((p) => ({ ...p, ...DEFAULT_PALETTE }));
    applyPalette(DEFAULT_PALETTE);
  };


  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("vehicle-images").upload(path, file);
    if (error) {
      toast.error("Erro no upload do banner");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("vehicle-images").getPublicUrl(path);
    set("banner_url", urlData.publicUrl);
    setUploading(false);
    toast.success("Banner enviado!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({ id: settings?.id, ...form });
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Configurações da Loja</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Identidade */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              Identidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Loja</label>
              <Input value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium">Banner Principal</label>
              {form.banner_url ? (
                <div className="relative mt-2 rounded-xl overflow-hidden">
                  <img
                    src={form.banner_url}
                    alt="Banner"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => set("banner_url", "")}
                    className="absolute top-3 right-3 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-background/80 backdrop-blur-sm text-foreground rounded-lg cursor-pointer hover:bg-background/90 transition-colors text-xs font-medium">
                    <Upload className="h-3.5 w-3.5" />
                    Trocar
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Enviando..." : "Clique para enviar o banner"}
                  </span>
                  <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">WhatsApp (com DDI)</label>
              <Input
                value={form.whatsapp}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, whatsapp: v, phone: v }));
                }}
                placeholder="5564999916552"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Número único usado em todos os botões de WhatsApp da plataforma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Endereço</label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Cidade</label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtro de Preço */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Filtro de Preço da Vitrine
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Define o intervalo do slider de "Preço Máximo" na busca pública.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preço Mínimo (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.price_filter_min}
                  onChange={(e) => set("price_filter_min", Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exibido: R$ {form.price_filter_min.toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Preço Máximo (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={form.price_filter_max}
                  onChange={(e) => set("price_filter_max", Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exibido: R$ {form.price_filter_max.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            {form.price_filter_min >= form.price_filter_max && (
              <p className="text-xs text-destructive mt-3">
                O preço mínimo precisa ser menor que o máximo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Margem por venda (ROAS) */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Métrica de ROAS
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Usado no painel Analytics para estimar retorno das campanhas.
            </p>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium">Margem média por venda (R$)</label>
              <Input
                type="number"
                min={0}
                step={500}
                value={form.avg_deal_margin}
                onChange={(e) => set("avg_deal_margin", Number(e.target.value))}
                placeholder="Ex: 8000"
              />
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Lucro médio esperado por veículo vendido (não é o preço do carro, é quanto sobra pra você em cima de uma venda — ex: R$ 4.000).
                <br />
                Usado apenas como <strong>estimativa</strong> enquanto não houver vendas registradas no Kanban de Leads. Assim que você marcar vendas com valor, o ROAS passa a ser calculado com a receita real.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meta Pixel */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Meta Pixel
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Trocar o Pixel aqui já atualiza o rastreamento do site — sem mexer no código.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">ID do Pixel</label>
              <Input
                value={form.meta_pixel_id}
                onChange={(e) => set("meta_pixel_id", e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 2339506166790342"
                inputMode="numeric"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Encontre em Gerenciador de Eventos → Fontes de dados. Deixe vazio para desativar o rastreamento.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">ID do conjunto de dados (opcional)</label>
              <Input
                value={form.meta_dataset_id}
                onChange={(e) => set("meta_dataset_id", e.target.value.replace(/\D/g, ""))}
                placeholder="Usado futuramente para envio server-side"
                inputMode="numeric"
              />
            </div>
          </CardContent>
        </Card>


        {/* Paleta de Cores */}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Paleta da Plataforma
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              As alterações aparecem em tempo real. Clique em Salvar para publicar para todos os visitantes.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "color_primary" as const, label: "Primária", hint: "Botões, ícones, destaques" },
                { key: "color_background" as const, label: "Fundo", hint: "Cor de fundo geral" },
                { key: "color_foreground" as const, label: "Texto", hint: "Cor principal do texto" },
              ].map(({ key, label, hint }) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      className="h-10 w-14 rounded-lg border border-input cursor-pointer bg-transparent"
                    />
                    <Input
                      value={form[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                      placeholder="#B23B3B"
                      className="font-mono uppercase text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: form.color_background, color: form.color_foreground }}>
              <p className="text-xs uppercase tracking-wider opacity-70">Prévia</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider"
                  style={{ backgroundColor: form.color_primary, color: "#fff" }}
                >
                  Botão Primário
                </button>
                <span className="text-sm font-bold" style={{ color: form.color_primary }}>Link em destaque</span>
                <span className="text-sm opacity-80">Texto normal da vitrine</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={resetPalette} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar padrão
            </Button>
          </CardContent>
        </Card>


        {/* Feed do Catálogo Meta (CSV) */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageSearch className="h-5 w-5 text-primary" />
              Feed do Catálogo Meta (CSV)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              URL pública no formato oficial <strong>Automotive Inventory</strong> da Meta (94 colunas). Cadastre no Commerce Manager como <strong>feed programado</strong> e o catálogo se atualiza sozinho — sem token, sem permissões.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                readOnly
                value={`https://jmwraokqyxfyyhnzlijp.supabase.co/functions/v1/catalog-feed`}
                className="font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText("https://jmwraokqyxfyyhnzlijp.supabase.co/functions/v1/catalog-feed");
                    toast.success("URL copiada");
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open("https://jmwraokqyxfyyhnzlijp.supabase.co/functions/v1/catalog-feed", "_blank")}
                >
                  <PackageSearch className="h-3.5 w-3.5" />
                  Abrir prévia
                </Button>
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed space-y-1">
              <p className="font-semibold text-foreground">Como cadastrar no Meta:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                <li>Commerce Manager → seu catálogo → <strong>Fontes de dados</strong></li>
                <li><strong>Adicionar itens</strong> → <strong>Feed em massa</strong> → <strong>Programado</strong></li>
                <li>Cole a URL acima, escolha frequência <strong>Diária</strong> e salve</li>
                <li>Em poucos minutos os 15 veículos aparecem no catálogo</li>
              </ol>
            </div>
          </CardContent>
        </Card>



        <Button type="submit" className="w-full gap-2" disabled={updateSettings.isPending}>
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </div>
  );
}
