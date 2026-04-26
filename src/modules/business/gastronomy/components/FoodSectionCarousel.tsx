/**
 * FoodSectionCarousel - carrossel horizontal de pratos com scroll nativo.
 * Exibe até 10 itens, deslizável no mobile e desktop.
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FoodItemCard } from './FoodItemCard';
import type { PublicGastronomyFoodItem } from '../types';
import type { LucideIcon } from 'lucide-react';
import {
  FOOD_SECTION_MAX_ITEMS,
  FOOD_SECTION_SCROLL_AMOUNT,
} from '../constants/ui-limits';

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: PublicGastronomyFoodItem[];
  accentColor?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function FoodSectionCarousel({
  title,
  subtitle,
  icon: Icon,
  items,
  accentColor = 'bg-primary/10',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleItems = items.slice(0, FOOD_SECTION_MAX_ITEMS);

  if (!visibleItems.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -FOOD_SECTION_SCROLL_AMOUNT : FOOD_SECTION_SCROLL_AMOUNT,
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`rounded-lg p-1.5 sm:p-2 ${accentColor}`}>
            <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Botões de scroll — desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="w-[200px] shrink-0 sm:w-[220px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <FoodItemCard item={item} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
