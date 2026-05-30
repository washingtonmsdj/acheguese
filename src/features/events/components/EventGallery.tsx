/**
 * 🖼️ EVENT GALLERY
 * 
 * Galeria de fotos do evento com lightbox
 * Permite visualizar fotos em tela cheia com navegação
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface EventGalleryProps {
  images: string[];
  title?: string;
}

export function EventGallery({ images, title = 'Galeria de Fotos' }: EventGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const selectedImageSrc = selectedImage !== null ? images.at(selectedImage) ?? null : null;

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  const goToPrevious = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const goToNext = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const handleDownload = () => {
    if (selectedImage !== null && selectedImageSrc) {
      const link = document.createElement('a');
      link.href = selectedImageSrc;
      link.download = `evento-foto-${selectedImage + 1}.jpg`;
      link.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Gallery Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <ImageIcon className="h-4 w-4" />
                {title}
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Fotos do evento
              </h2>
              <p className="mt-2 text-muted-foreground">
                {images.length} {images.length === 1 ? 'foto' : 'fotos'}
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted transition-all hover:border-primary hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    src={image}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/90 p-2 backdrop-blur-sm">
                      <ZoomIn className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && selectedImage !== null && selectedImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Download Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-16 top-4 z-10 h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <Download className="h-5 w-5" />
            </Button>

            {/* Image Counter */}
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              {selectedImage + 1} / {images.length}
            </div>

            {/* Previous Button */}
            {selectedImage > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Next Button */}
            {selectedImage < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Image */}
            <motion.img
              key={selectedImage}
              src={selectedImageSrc}
              alt={`Foto ${selectedImage + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 overflow-x-auto rounded-full bg-white/10 p-2 backdrop-blur-sm">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={cn(
                    "h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    selectedImage === index
                      ? "border-primary scale-110"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
