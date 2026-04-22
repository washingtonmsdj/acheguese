import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { GASTRONOMY_CATEGORY_SHORTCUTS } from '../constants/categoryShortcuts';

interface Props {
  onCategorySelect: (cuisineFilter: string) => void;
  activeCuisine?: string;
  countsByCuisine?: Record<string, number>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export function GastronomyCategoryCards({
  onCategorySelect,
  activeCuisine,
  countsByCuisine,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scrollbar-hide sm:gap-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-30px' }}
          variants={containerVariants}
          className="flex gap-2 sm:gap-3"
        >
          {GASTRONOMY_CATEGORY_SHORTCUTS.map((category) => {
            const resolvedCount = countsByCuisine?.[category.cuisineFilter];
            const countLabel =
              typeof resolvedCount === 'number'
                ? `${resolvedCount} ${resolvedCount === 1 ? 'local' : 'locais'}`
                : null;

            return (
              <motion.button
                key={category.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() =>
                  onCategorySelect(
                    activeCuisine === category.cuisineFilter ? '' : category.cuisineFilter,
                  )
                }
                aria-pressed={activeCuisine === category.cuisineFilter}
                aria-label={`Filtrar por ${category.label}`}
                className={`
                  relative aspect-[4/3] w-28 shrink-0 snap-start cursor-pointer overflow-hidden rounded-2xl border-2
                  transition-colors duration-200 group sm:w-32 md:w-40 lg:w-44 xl:w-48
                  ${
                    activeCuisine === category.cuisineFilter
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-primary/40'
                  }
                `}
              >
                <img
                  src={category.image}
                  alt={category.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex flex-col p-2 sm:p-3 md:p-3.5 lg:p-4">
                  <h3 className="flex min-h-[2.5rem] items-end line-clamp-2 text-xs font-bold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-sm md:min-h-[2.9rem] md:text-[15px] lg:min-h-[3.2rem] lg:text-base">
                    {category.label}
                  </h3>
                  <div className="mt-0.5 h-4 md:h-5">
                    {countLabel && (
                      <span className="text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[11px] md:text-xs">{countLabel}</span>
                    )}
                  </div>
                </div>
                {activeCuisine === category.cuisineFilter && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Botoes de navegacao sobrepostos */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background md:inline-flex"
        onClick={() => scroll('left')}
        aria-label="Categorias anteriores"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-background/90 shadow-lg backdrop-blur-sm hover:bg-background md:inline-flex"
        onClick={() => scroll('right')}
        aria-label="Proximas categorias"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

