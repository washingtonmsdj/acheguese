import { motion } from "framer-motion";
import { Image, MapPin, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

interface PostMediaEditorProps {
  imagensPreview: string[];
  onRemoverImagem: (index: number) => void;
  onImageClick: () => void;
  canAddImages: boolean;
  location: { lat: number; lng: number } | null;
  onLocationClick: () => void;
  onRemoveLocation: () => void;
  tagsInput: string;
  onTagsChange: (value: string) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PostMediaEditor({
  imagensPreview,
  onRemoverImagem,
  onImageClick,
  canAddImages,
  location,
  onLocationClick,
  onRemoveLocation,
  tagsInput,
  onTagsChange,
  fileRef,
  onFileChange,
}: PostMediaEditorProps) {
  return (
    <div className="h-full flex flex-col px-4 overflow-hidden">
      <div className="text-center py-2 flex-shrink-0">
        <h2 className="text-base font-semibold">Mídia & Tags</h2>
        <p className="text-muted-foreground text-xs">
          Adicione fotos, localização e tags (opcional)
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {imagensPreview.length > 0 && (
          <div className="flex-shrink-0">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Fotos Selecionadas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {imagensPreview.map((preview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-square"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onRemoverImagem(index)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />

          <button
            onClick={onImageClick}
            disabled={!canAddImages}
            className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <div className="flex flex-col items-center gap-2">
              <Image className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-sm">Adicionar Fotos</p>
                <p className="text-xs text-muted-foreground">
                  {3 - imagensPreview.length}/3 fotos • Toque para selecionar
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onLocationClick}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-colors flex-shrink-0",
              location
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/30 hover:border-primary/50",
            )}
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">
                  {location
                    ? "Localização adicionada"
                    : "Adicionar Localização"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {location
                    ? "Toque para alterar"
                    : "Compartilhe onde você está"}
                </p>
              </div>
              {location && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLocation();
                  }}
                  className="text-xs text-destructive hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </button>

          <div className="flex-shrink-0">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Tags
            </p>
            <Input
              value={tagsInput}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="Ex: encanador, segurança, vizinhança..."
              className="h-12 text-base border-2 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Separe as tags com vírgulas para ajudar outros a encontrar seu
              post
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
