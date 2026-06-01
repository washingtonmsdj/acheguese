/**
 * CommunityPhotosGallery - Fotos da comunidade com hashtag do local
 *
 * Exibe fotos postadas por usuarios que marcaram o local.
 */

import { useState } from "react";
import {
  Camera,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useCommunityPhotos } from "@/core/guide/tourist-points/hooks/useCommunityPhotos";

interface CommunityPhotosGalleryProps {
  pointTitle: string;
  pointSlug: string;
  locationId: string | null;
  city: string;
  neighborhood: string | null;
  state?: string;
}

export function CommunityPhotosGallery({
  pointTitle,
  pointSlug,
  locationId,
  city,
  neighborhood,
  state,
}: CommunityPhotosGalleryProps) {
  const { data: photos = [] } = useCommunityPhotos(locationId, city, neighborhood, state);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hashtag = `#${pointSlug.replace(/-/g, "")}`;

  if (!photos.length) return null;

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : 0));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : 0));
  const activePhoto = lightboxIndex !== null ? photos.at(lightboxIndex) : undefined;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Fotos da comunidade</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fotos compartilhadas por visitantes de {pointTitle}
          </p>
        </div>
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Hash className="h-3 w-3" />
          {hashtag}
        </Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {photos.slice(0, 12).map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => openLightbox(i)}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            <img
              src={photo.image_url}
              alt={photo.content || `Foto de ${pointTitle}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Heart className="h-5 w-5 text-white" />
            </div>

            {i === 11 && photos.length > 12 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-sm">+{photos.length - 12}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <Card className="mt-4 bg-muted/50 border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Visitou {pointTitle}?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compartilhe suas fotos usando <span className="font-semibold text-primary">{hashtag}</span>
            </p>
          </div>
          <Button size="sm" variant="outline" className="flex-shrink-0">
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            Enviar foto
          </Button>
        </CardContent>
      </Card>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          onClick={closeLightbox}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <img
            src={activePhoto?.image_url ?? ""}
            alt={activePhoto?.content || pointTitle}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          <div className="absolute bottom-6 text-center px-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <p className="text-white text-sm">{activePhoto?.content ?? ""}</p>
            <p className="text-white/50 text-xs mt-1">
              por {activePhoto?.author_name ?? "Comunidade"} · {lightboxIndex + 1}/{photos.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
