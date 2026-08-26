import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Upload, GripVertical, ImagePlus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

interface UploadingFile {
  name: string;
  progress: number;
  preview: string;
}

export default function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!fileArray.length) {
      toast.error("Selecione apenas arquivos de imagem");
      return;
    }

    const previews: UploadingFile[] = fileArray.map(f => ({
      name: f.name,
      progress: 0,
      preview: URL.createObjectURL(f),
    }));
    setUploading(previews);

    const urls: string[] = [];
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      setUploading(prev => prev.map((p, j) => j === i ? { ...p, progress: 30 } : p));

      const { error } = await supabase.storage.from("vehicle-images").upload(path, file);

      if (error) {
        toast.error(`Erro: ${file.name}`);
        setUploading(prev => prev.map((p, j) => j === i ? { ...p, progress: -1 } : p));
        continue;
      }

      setUploading(prev => prev.map((p, j) => j === i ? { ...p, progress: 100 } : p));

      const { data: urlData } = supabase.storage.from("vehicle-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }

    onChange([...images, ...urls]);
    toast.success(`${urls.length} imagem(ns) enviada(s)`);

    setTimeout(() => {
      setUploading([]);
      previews.forEach(p => URL.revokeObjectURL(p.preview));
    }, 600);
  }, [images, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleReorderDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleReorderDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Grid de imagens existentes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={() => handleReorderDragStart(i)}
              onDragOver={(e) => handleReorderDragOver(e, i)}
              onDrop={() => handleReorderDrop(i)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
              className={cn(
                "relative group rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing",
                i === 0 ? "border-primary" : "border-transparent",
                dragOverIndex === i && "border-primary/50 scale-105",
                dragIndex === i && "opacity-50"
              )}
            >
              <img
                src={url}
                alt={`Imagem ${i + 1}`}
                className="w-full aspect-[4/3] object-cover"
                draggable={false}
              />
              {/* Capa badge */}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Capa
                </span>
              )}
              {/* Grip handle */}
              <div className="absolute top-2 right-8 bg-background/80 backdrop-blur-sm rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
              {/* Index number */}
              <span className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded">
                {i + 1}/{images.length}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploading progress */}
      {uploading.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploading.map((file, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={file.preview}
                alt={file.name}
                className="w-full aspect-[4/3] object-cover opacity-60"
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                <Progress value={file.progress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            dragOver ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {images.length === 0 ? (
              <ImagePlus className="h-6 w-6" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {dragOver ? "Solte as imagens aqui" : "Arraste imagens ou clique para enviar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WebP • A primeira imagem será a capa
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}
