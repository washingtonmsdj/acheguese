import React from "react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";
import { resolvePostImageSources } from "@/core/media/references/postImageReference";
/**
 * Galeria de imagens profissional com lightbox
 *
 * Features:
 * - Grid responsivo (1-4 imagens)
 * - Lightbox em tela cheia
 * - Navegação por teclado (←/→/Esc)
 * - Zoom in/out
 * - Download de image
 * - Transições suaves
 * - Touch gestures (mobile)
 * - Lazy loading
 */

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export function ImageGallery({ images: imageReferences, className }: ImageGalleryProps) {
  const images = useMemo(
    () => resolvePostImageSources(imageReferences),
    [imageReferences],
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const handleDownload = async () => {
    const currentImage = images.at(currentIndex) ?? images[0];
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Error baixar image:", error);
    }
  };

  // Grid layout baseado no número de imagens
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <>
      {/* Grid de Thumbnails */}
      <div className={cn("grid gap-2", getGridClass(), className)}>
        {images.slice(0, 4).map((image, index) => (
          <div
            key={index}
            className={cn(
              "relative overflow-hidden rounded-lg cursor-pointer group",
              images.length === 3 && index === 0 ? "col-span-2" : "",
              images.length > 4 && index === 3 ? "relative" : "",
            )}
            style={{
              aspectRatio: images.length === 1 ? "16/9" : "1/1",
            }}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image}
              alt={`Imagem ${index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
              width={1280}
              height={1280}
            />

            {/* Overlay no hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Indicador de mais imagens */}
            {images.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={closeLightbox}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 border-0 bg-black/95"
          aria-describedby="dialog-description"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") goToPrevious();
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "Escape") closeLightbox();
          }}
        >
          <span id="dialog-description" className="sr-only">
            Visualizador de imagens em tela cheia
          </span>
          {/* Controles superiores */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Imagem principal */}
          <div className="w-full h-full flex items-center justify-center overflow-auto p-16">
            <img
              src={images.at(currentIndex) ?? images[0]}
              alt={`Imagem ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-300"
              style={{
                transform: `scale(${zoom})`,
                cursor: zoom > 1 ? "move" : "default",
              }}
              decoding="async"
              width={1280}
              height={1280}
            />
          </div>

          {/* Navegação */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Thumbnails inferiores */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                    }}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      index === currentIndex
                        ? "border-white scale-110"
                        : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
