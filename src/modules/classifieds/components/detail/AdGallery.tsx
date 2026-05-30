import React from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/utils/cn";

interface AdGalleryProps {
  photos: string[];
  currentPhoto: number;
  title: string;
  onPhotoChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function AdGallery({
  photos,
  currentPhoto,
  title,
  onPhotoChange,
  onNext,
  onPrev,
}: AdGalleryProps) {
  const hasMultiplePhotos = photos.length > 1;
  const currentPhotoUrl = photos.at(currentPhoto) ?? null;

  return (
    <div className="relative bg-secondary">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPhoto}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentPhotoUrl ? (
            <img
              src={currentPhotoUrl}
              alt={title}
              className="w-full h-72 object-cover"
            />
          ) : (
            <div className="w-full h-72 bg-secondary flex items-center justify-center">
              <Tag className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Navigation buttons */}
      {hasMultiplePhotos && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/60 backdrop-blur flex items-center justify-center"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/60 backdrop-blur flex items-center justify-center"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Photo indicators */}
      {hasMultiplePhotos && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => onPhotoChange(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentPhoto ? "w-6 bg-white" : "w-1.5 bg-white/50",
              )}
              aria-label={`Ir para foto ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
