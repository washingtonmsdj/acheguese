/**
 * TouristPointSectionCarousel — Seção temática horizontal de pontos turísticos
 *
 * Segue o padrão de FoodSectionCarousel.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TouristPointCard } from './TouristPointCard';
import type { MockTouristPointExtended } from '../__mocks__/touristPointMocks';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: MockTouristPointExtended[];
  accentColor?: string;
  getDetailUrl: (point: { slug: string; location?: { geographic_path: string } | null }) => string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function TouristPointSectionCarousel({
  title,
  subtitle,
  icon: Icon,
  items,
  accentColor = 'bg-primary/10',
  getDetailUrl,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeIn}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${accentColor}`}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-display font-bold text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((point) => (
          <div key={point.id} className="w-[280px] sm:w-[300px] shrink-0 snap-start">
            <TouristPointCard
              point={point}
              detailUrl={getDetailUrl(point)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
