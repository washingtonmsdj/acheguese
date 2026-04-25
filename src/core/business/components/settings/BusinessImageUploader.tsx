/**
 * BusinessImageUploader
 * 
 * Componente para upload de imagens da empresa (logo, banner, galeria).
 * Suporta drag & drop, preview, crop e validação.
 */
import { logger } from '@/shared/utils/logger';
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
interface BusinessImageUploaderProps {
  type: "logo" | "banner" | "gallery";
  currentImage?: string | null;
  onUpload: (file: File) => Promise<string>;
  aspectRatio?: "1:1" | "21:9" | "16:9" | "free";
  maxSizeMB?: number;
  className?: string;
}

const ASPECT_RATIOS = {
  "1:1": "aspect-square",
  "21:9": "aspect-[21/9]",
  "16:9": "aspect-video",
  "free": "",
};

const TYPE_CONFIG = {
  logo: {
    title: "Logo da Empresa",
    description: "Recomendado: 400x400px, formato quadrado",
    aspectRatio: "1:1" as const,
    maxSizeMB: 2,
  },
  banner: {
    title: "Banner/Capa",
    description: "Recomendado: 1920x820px, formato panorâmico",
    aspectRatio: "21:9" as const,
    maxSizeMB: 5,
  },
  gallery: {
    title: "Foto da Galeria",
    description: "Recomendado: 1200x800px",
    aspectRatio: "16:9" as const,
    maxSizeMB: 3,
  },
};

function getAspectRatioClass(aspectRatioValue: "1:1" | "21:9" | "16:9" | "free"): string {
  switch (aspectRatioValue) {
    case "1:1":
      return ASPECT_RATIOS["1:1"];
    case "21:9":
      return ASPECT_RATIOS["21:9"];
    case "16:9":
      return ASPECT_RATIOS["16:9"];
    case "free":
      return ASPECT_RATIOS.free;
    default:
      return ASPECT_RATIOS.free;
  }
}

function getTypeConfig(type: "logo" | "banner" | "gallery") {
  switch (type) {
    case "logo":
      return TYPE_CONFIG.logo;
    case "banner":
      return TYPE_CONFIG.banner;
    case "gallery":
      return TYPE_CONFIG.gallery;
    default:
      return TYPE_CONFIG.gallery;
  }
}

export function BusinessImageUploader({
  type,
  currentImage,
  onUpload,
  aspectRatio,
  maxSizeMB,
  className,
}: BusinessImageUploaderProps) {
  const config = getTypeConfig(type);
  const finalAspectRatio = aspectRatio || config.aspectRatio;
  const finalMaxSize = maxSizeMB || config.maxSizeMB;

  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      return "Por favor, selecione uma imagem válida";
    }

    // Validar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > finalMaxSize) {
      return `A imagem deve ter no máximo ${finalMaxSize}MB`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setUploading(true);

      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      const url = await onUpload(file);
      setPreview(url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      logger.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.item(0);
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.item(0);
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Imagem removida");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">{config.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all overflow-hidden",
          getAspectRatioClass(finalAspectRatio),
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          uploading && "opacity-50 pointer-events-none",
          !preview && "min-h-[200px]"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          // Preview da imagem
          <div className="relative w-full h-full group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-card rounded-lg p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Enviando...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Estado vazio - área de upload
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 hover:bg-secondary/50 transition-colors"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-foreground">Enviando...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground mb-1">
                    Clique para selecionar ou arraste aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP até {finalMaxSize}MB
                  </p>
                </div>
              </>
            )}
          </button>
        )}

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {/* Status indicator */}
      {preview && !uploading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          <span>Imagem carregada</span>
        </div>
      )}
    </div>
  );
}
