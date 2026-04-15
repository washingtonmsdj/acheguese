import React from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface PhotoUploaderProps {
  photos: File[];
  photoPreviews: string[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  error?: string;
}

export function PhotoUploader({
  photos,
  photoPreviews,
  fileInputRef,
  onAddPhotos,
  onRemovePhoto,
  error,
}: PhotoUploaderProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">
        Fotos{" "}
        <span className="text-muted-foreground font-normal">
          ({photos.length}/5)
        </span>
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {photoPreviews.map((src, i) => (
          <div
            key={i}
            className="relative h-24 w-24 rounded-xl overflow-hidden shrink-0 border"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => onRemovePhoto(i)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                Capa
              </span>
            )}
          </div>
        ))}

        {photos.length < 5 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "h-24 w-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 shrink-0 transition-colors",
              "text-muted-foreground hover:border-primary hover:text-primary",
              error && "border-destructive text-destructive",
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Adicionar</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onAddPhotos}
        className="hidden"
      />
    </div>
  );
}
