/**
 * GastronomyPhotoGallery — Galeria de fotos com lightbox
 *
 * Paridade com PhotoGallery do módulo de empresas.
 * Usa fotos do campo business.fotos[] (SSOT de Business).
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';

interface GastronomyPhotoGalleryProps {
  photos: string[];
  businessName: string;
}

export function GastronomyPhotoGallery({
  photos,
  businessName,
}: GastronomyPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxPhotoUrl = lightboxIndex !== null ? photos.at(lightboxIndex) ?? null : null;

  if (!photos.length) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
  };

  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Galeria</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => openLightbox(index)}
              className="aspect-square overflow-hidden rounded-xl border bg-muted hover:opacity-90 transition-opacity"
            >
              <img
                src={photo}
                alt={`${businessName} — foto ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Fechar */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Anterior */}
          {photos.length > 1 && (
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
          )}

          {/* Imagem */}
          <img
            src={lightboxPhotoUrl}
            alt={`${businessName} — foto ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Próxima */}
          {photos.length > 1 && (
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
          )}

          {/* Contador */}
          <p className="absolute bottom-4 text-sm text-white/70">
            {lightboxIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
