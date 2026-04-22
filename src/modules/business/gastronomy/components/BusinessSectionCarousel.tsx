/**
 * BusinessSectionCarousel - secao tematica de lojas com paginacao local.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GastronomyBusiness } from '../types';
import { Button } from '@/shared/components/ui/button';
import { GastronomyCard } from './GastronomyCard';

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: GastronomyBusiness[];
  accentColor?: string;
  distanceByBusinessId?: ReadonlyMap<string, number>;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ITEMS_PER_PAGE = 5;

export function BusinessSectionCarousel({
  title,
  subtitle,
  icon: Icon,
  items,
  accentColor = 'bg-primary/10',
  distanceByBusinessId,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const hasPagination = totalPages > 1;

  const pagedItems = useMemo(() => {
    const start = pageIndex * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, pageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [items]);

  const handlePrevious = () => {
    setPageIndex((current) => Math.max(0, current - 1));
  };

  const handleNext = () => {
    setPageIndex((current) => Math.min(totalPages - 1, current + 1));
  };

  if (!totalItems) return null;

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }} variants={fadeIn}>
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`rounded-lg p-1.5 sm:p-2 ${accentColor}`}>
            <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground md:text-xl">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {hasPagination && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full px-2.5 text-[11px] sm:text-xs"
              onClick={handlePrevious}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <span className="min-w-[52px] text-center text-[11px] text-muted-foreground sm:text-xs">
              {pageIndex + 1}/{totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full px-2.5 text-[11px] sm:text-xs"
              onClick={handleNext}
              disabled={pageIndex >= totalPages - 1}
            >
              <span className="hidden sm:inline">Proximos</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {pagedItems.map((business) => (
          <div key={business.business_data_id} className="h-full">
            <GastronomyCard
              business={business}
              distanceMeters={distanceByBusinessId?.get(business.business_data_id)}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
