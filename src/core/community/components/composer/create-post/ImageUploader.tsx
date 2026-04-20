import React, { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { ImageIcon, X, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  images: string[];
  isUploading: boolean;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ImageUploader({
  images,
  isUploading,
  onAddImage,
  onRemoveImage,
  onFileSelect,
  fileInputRef,
}: ImageUploaderProps) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-bold" style={{ color: "#FFFFFF" }}>
        Imagens (até 3)
      </Label>

      {/* Input oculto para upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />

      {/* Preview das imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border"
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <img
                src={url}
                alt={`Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveImage(index)}
                className="absolute top-0.5 right-0.5 h-5 w-5 p-0 rounded-full bg-black/60 hover:bg-red-500/80"
                disabled={isUploading}
              >
                <X className="h-2.5 w-2.5 text-white" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Botão add image */}
      {images.length < 3 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddImage}
          disabled={isUploading}
          className="w-full h-8 text-[10px] border-dashed"
          style={{
            borderColor: "rgba(79, 209, 197, 0.3)",
            color: "#4FD1C5",
            backgroundColor: "transparent",
          }}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <ImageIcon className="h-3 w-3 mr-1.5" />
              Adicionar Imagem ({images.length}/3)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
