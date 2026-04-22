/**
 * HeroBannerCarousel - Carrossel de banners promocionais para hero section
 * 
 * Features:
 * - Auto-play com intervalo configurável
 * - Navegação por dots
 * - Navegação por setas (opcional)
 * - Transições suaves
 * - Responsivo
 * - Suporte a imagem + texto
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface HeroBanner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  textPosition?: 'left' | 'center' | 'right';
  overlayOpacity?: number;
}

export interface HeroBannerCarouselProps {
  banners: HeroBanner[];
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

export function HeroBannerCarousel({
  banners,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  height = '400px',
}: HeroBannerCarouselProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const currentBanner = banners[page];

  const paginate = useCallback((newDirection: number) => {
    setPage([
      (page + newDirection + banners.length) % banners.length,
      newDirection,
    ]);
  }, [page, banners.length]);

  const goToSlide = useCallback((index: number) => {
    const newDirection = index > page ? 1 : -1;
    setPage([index, newDirection]);
  }, [page]);

  // Auto-play
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;

    const interval = setInterval(() => {
      paginate(1);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [page, isPaused, autoPlayInterval, banners.length, paginate]);

  if (banners.length === 0) return null;

  const textAlignClass = 
    currentBanner.textPosition === 'center' ? 'items-center text-center' :
    currentBanner.textPosition === 'right' ? 'items-end text-right' :
    'items-start text-left';

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ height }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={currentBanner.image}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay mais claro */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/25 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center px-6 md:px-12 lg:px-16">
            <div className={`flex flex-col ${textAlignClass} max-w-2xl`}>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 leading-tight drop-shadow-2xl [text-shadow:_0_2px_12px_rgb(0_0_0_/_80%)]"
              >
                {currentBanner.title}
              </motion.h2>

              {currentBanner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm md:text-base text-muted-foreground mb-6 drop-shadow-xl [text-shadow:_0_1px_8px_rgb(0_0_0_/_70%)]"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}

              {currentBanner.cta && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={currentBanner.cta.onClick}
                    size="lg"
                    className="h-12 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
                  >
                    {currentBanner.cta.label}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {showArrows && banners.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-md hover:bg-background text-foreground rounded-full p-3 transition-all shadow-xl hover:scale-110 hover:shadow-2xl"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-md hover:bg-background text-foreground rounded-full p-3 transition-all shadow-xl hover:scale-110 hover:shadow-2xl"
            aria-label="Próximo banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === page
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-background/60 hover:bg-background/80'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
