/**
 * TouristPointGallery — Galeria de fotos do ponto turístico
 * Suporte a swipe/touch no lightbox para mobile.
 */

import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { TouristPointMedia } from '../types';

interface TouristPointGalleryProps {
  media: TouristPointMedia[];
  title: string;
}

export function TouristPointGallery({ media, title }: TouristPointGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  if (!media.length) return null;

  const sorted = [...media].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.display_order - b.display_order;
  });

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + sorted.length) % sorted.length : 0));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % sorted.length : 0));

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const elapsed = Date.now() - touchStart.current.time;
    touchStart.current = null;

    // Require horizontal swipe: |dx| > 50px, more horizontal than vertical, under 500ms
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < 500) {
      if (dx < 0) next();
      else prev();
    }
  };

  return (
    <>
      {/* Grid */}
      <div
        className={`grid gap-2 rounded-xl overflow-hidden ${
          sorted.length === 1
            ? 'grid-cols-1'
            : sorted.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-2 md:grid-cols-3'
        }`}
      >
        {sorted.slice(0, 6).map((item, i) => (
          <button
            key={item.id}
            onClick={() => openLightbox(i)}
            className={`relative overflow-hidden bg-muted ${
              i === 0 && sorted.length > 1 ? 'col-span-2 md:col-span-2 row-span-2' : ''
            }`}
            style={{ aspectRatio: i === 0 && sorted.length > 1 ? '16/9' : '4/3' }}
            aria-label={`Ver foto ${i + 1} de ${title}`}
          >
            <img
              src={item.url}
              alt={item.alt_text ?? `${title} — foto ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            {i === 5 && sorted.length > 6 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{sorted.length - 6}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center select-none"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/10 hidden sm:flex"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>

          <img
            src={sorted.at(lightboxIndex)?.url ?? sorted[0]?.url}
            alt={sorted.at(lightboxIndex)?.alt_text ?? title}
            className="max-h-[90vh] max-w-[90vw] object-contain pointer-events-none"
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/10 hidden sm:flex"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Counter + swipe hint on mobile */}
          <div className="absolute bottom-4 flex flex-col items-center gap-1">
            <p className="text-white/60 text-sm">
              {lightboxIndex + 1} / {sorted.length}
            </p>
            <p className="text-white/30 text-xs sm:hidden">Deslize para navegar</p>
          </div>
        </div>
      )}
    </>
  );
}
