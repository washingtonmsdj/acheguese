import React from "react";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  businessName: string;
}

export default function PhotoGallery({
  photos,
  businessName,
}: PhotoGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) {
      return;
    }
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  };

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };
  const activePhoto = photos.at(lightboxIndex);

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Galeria de Fotos</h2>
        </div>

        <div className="relative">
          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
                >
                  <button
                    onClick={() => openLightbox(index)}
                    className="group relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-secondary hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={photo.image_url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {photo.caption}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {photos.length > 3 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === selectedIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
          aria-describedby="photo-gallery-description"
        >
          <span id="photo-gallery-description" className="sr-only">
            Galeria de fotos da empresa em tela cheia
          </span>
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Previous Button */}
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={prevLightbox}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
              <img
                src={activePhoto?.image_url ?? ""}
                alt={activePhoto?.caption ?? businessName}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Next Button */}
            {photos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={nextLightbox}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Caption */}
            {activePhoto?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
                <p className="text-white text-center text-lg font-medium">
                  {activePhoto.caption}
                </p>
                <p className="text-white/60 text-center text-sm mt-1">
                  {lightboxIndex + 1} / {photos.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
