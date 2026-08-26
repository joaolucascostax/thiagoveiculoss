import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVehicle, useCreateVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, Plus, Sparkles } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

export default function VehicleForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingExisting } = useVehicle(id);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    price: 0,
    fipe_price: null as number | null,
    mileage: "0 KM",
    transmission: "AUTOMÁTICO",
    fuel: "GASOLINA",
    color: "",
    doors: 4,
    is_new: false,
    is_active: true,
    description: "",
    images: [] as string[],
    options: [] as string[],
    license_plate: "",
  });
  const [newOption, setNewOption] = useState("");
  const [smartText, setSmartText] = useState("");
  const [parsing, setParsing] = useState(false);

  const handleSmartFill = async () => {
    if (!smartText.trim() || smartText.trim().length < 10) {
      toast.error("Cole um texto mais completo do anúncio");
      return;
    }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-vehicle", {
        body: { text: smartText },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        brand: data.brand || prev.brand,
        model: data.model || prev.model,
        year: data.year || prev.year,
        price: data.price || prev.price,
        mileage: data.mileage || prev.mileage,
        transmission: data.transmission || prev.transmission,
        fuel: data.fuel || prev.fuel,
        color: data.color || prev.color,
        doors: data.doors || prev.doors,
        is_new: data.is_new ?? prev.is_new,
        description: data.description || prev.description,
        options: data.options?.length ? data.options : prev.options,
      }));
      toast.success("Campos preenchidos! Revise antes de salvar.");
      setSmartText("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar texto");
    } finally {
      setParsing(false);
    }
  };

  useEffect(() => {
    if (existing) {
      setForm({
        brand: existing.brand,
        model: existing.model,
        year: existing.year,
        price: existing.price,
        fipe_price: (existing as any).fipe_price ?? null,
        mileage: existing.mileage,
        transmission: existing.transmission,
        fuel: existing.fuel,
        color: existing.color,
        doors: existing.doors,
        is_new: existing.is_new,
        is_active: existing.is_active,
        description: existing.description,
        images: existing.images || [],
        options: existing.options || [],
        license_plate: (existing as any).license_plate ?? "",
      });
    }
  }, [existing]);

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const addOption = () => {
    if (!newOption.trim()) return;
    set("options", [...form.options, newOption.trim().toUpperCase()]);
    setNewOption("");
  };

  const removeOption = (idx: number) => {
    set("options", form.options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.year || !form.price) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      if (isEditing && id) {
        await updateVehicle.mutateAsync({ id, ...form });
        toast.success("Veículo atualizado!");
      } else {
        await createVehicle.mutateAsync(form);
        toast.success("Veículo criado!");
      }
      navigate("/admin/veiculos");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
  };

  if (isEditing && loadingExisting) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">{isEditing ? "Editar Veículo" : "Novo Veículo"}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Smart Fill */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Preenchimento Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Cole o texto do anúncio e a IA preencherá os campos automaticamente.</p>
            <Textarea
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              placeholder="Cole aqui o texto do anúncio, ficha técnica ou descrição do veículo..."
              rows={4}
            />
            <Button type="button" onClick={handleSmartFill} disabled={parsing || !smartText.trim()} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {parsing ? "Processando..." : "Preencher com IA"}
            </Button>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Marca *</label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value.toUpperCase())} placeholder="BMW" required />
            </div>
            <div>
              <label className="text-sm font-medium">Modelo *</label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value.toUpperCase())} placeholder="320I M SPORT" required />
            </div>
            <div>
              <label className="text-sm font-medium">Ano *</label>
              <Input value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2024/2024" required />
            </div>
            <div>
              <label className="text-sm font-medium">Preço (R$) *</label>
              <Input type="number" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="289900" required />
            </div>
            <div>
              <label className="text-sm font-medium">Preço FIPE (R$)</label>
              <Input
                type="number"
                value={form.fipe_price ?? ""}
                onChange={(e) => set("fipe_price", e.target.value ? Number(e.target.value) : null)}
                placeholder="Opcional — se maior que o preço, aparece no criativo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quilometragem</label>
              <Input value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="15.000 KM" />
            </div>
            <div>
              <label className="text-sm font-medium">Câmbio</label>
              <Input value={form.transmission} onChange={(e) => set("transmission", e.target.value.toUpperCase())} placeholder="AUTOMÁTICO" />
            </div>
            <div>
              <label className="text-sm font-medium">Combustível</label>
              <Input value={form.fuel} onChange={(e) => set("fuel", e.target.value.toUpperCase())} placeholder="GASOLINA" />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <Input value={form.color} onChange={(e) => set("color", e.target.value.toUpperCase())} placeholder="PRETO SAFIRA" />
            </div>
            <div>
              <label className="text-sm font-medium">Portas</label>
              <Input type="number" value={form.doors} onChange={(e) => set("doors", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm font-medium">Placa <span className="text-muted-foreground font-normal">(uso interno)</span></label>
              <Input
                value={form.license_plate}
                onChange={(e) => set("license_plate", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
                placeholder="ABC1D23"
                maxLength={7}
              />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_new} onCheckedChange={(v) => set("is_new", v)} />
                <label className="text-sm font-medium">Novo (0 KM)</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
                <label className="text-sm font-medium">Ativo no site</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Imagens
              {form.images.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">{form.images.length} foto(s)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader images={form.images} onChange={(imgs) => set("images", imgs)} />
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader><CardTitle>Opcionais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {form.options.map((opt, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
                  {opt}
                  <button type="button" onClick={() => removeOption(i)}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Novo opcional..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              />
              <Button type="button" variant="outline" onClick={addOption}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descreva o veículo..."
              rows={5}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createVehicle.isPending || updateVehicle.isPending}>
            {createVehicle.isPending || updateVehicle.isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Veículo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/veiculos")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
