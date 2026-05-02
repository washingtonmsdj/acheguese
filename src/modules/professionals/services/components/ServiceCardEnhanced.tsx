/**
 * SERVICE CARD - Padronizado
 *
 * Layout horizontal compacto (88px) seguindo padrao de Gastronomia/Empresas
 */

import { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, BadgeCheck, Clock, MapPin, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { getServiceCategoryIcon } from '@/modules/professionals/services/domain/professionalCategories';
import type { ProfessionalItem } from '@/modules/professionals/services/hooks/useServicos';

export interface ServiceCardProps {
  professional: ProfessionalItem;
  index?: number;
  featured?: boolean;
  onProfessionalClick: (professional: ProfessionalItem) => void;
  className?: string;
}

export const ServiceCardEnhanced = memo<ServiceCardProps>(
  ({
    professional,
    index = 0,
    featured = false,
    onProfessionalClick,
    className,
  }) => {
    const categoryIcon = useMemo(
      () => getServiceCategoryIcon(professional.category),
      [professional.category],
    );

    const hasRating = professional.rating && professional.rating > 0;
    const hasWhatsApp = Boolean(professional.whatsapp);
    const isAccepting = professional.isAcceptingClients ?? true;

    const handleCardClick = useCallback(() => {
      onProfessionalClick(professional);
    }, [professional, onProfessionalClick]);

    const handleWhatsAppClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasWhatsApp) {
          const cleanNumber = professional.whatsapp!.replace(/\D/g, '');
          window.open(`https://wa.me/55${cleanNumber}`, '_blank');
        }
      },
      [hasWhatsApp, professional.whatsapp],
    );

    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: Math.min(index, 10) * 0.05 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCardClick}
        className={cn(
          'group relative flex h-[88px] cursor-pointer flex-row overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md',
          featured && 'ring-2 ring-primary/20',
          className,
        )}
        role="article"
        aria-label={`${professional.name} - ${professional.category}`}
      >
        <div className="relative h-full w-[88px] shrink-0 overflow-hidden">
          {professional.photo ? (
            <img
              src={professional.photo}
              alt={professional.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="text-4xl">{categoryIcon}</span>
            </div>
          )}

          {professional.isVerified && (
            <div className="absolute left-1 top-1">
              <BadgeCheck className="h-3.5 w-3.5 fill-primary/20 text-primary" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between px-2.5 py-2">
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {professional.name}
            </h3>
            {featured && (
              <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-warning/20 text-warning" />
            )}
          </div>

          <p className="truncate text-[11px] text-muted-foreground">{professional.category}</p>

          <div className="flex items-center gap-2">
            {hasRating && (
              <span className="flex items-center gap-0.5 text-[11px] font-semibold">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {professional.rating!.toFixed(1)}
                {professional.totalAvaliacoes && (
                  <span className="text-muted-foreground">({professional.totalAvaliacoes})</span>
                )}
              </span>
            )}
            {professional.priceRange && (
              <span className="text-[11px] font-semibold text-primary">{professional.priceRange}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span
              className={cn(
                'flex shrink-0 items-center gap-0.5 font-medium',
                isAccepting ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500',
              )}
            >
              <Clock className="h-2.5 w-2.5" />
              {isAccepting ? 'Disponivel' : 'Indisponivel'}
            </span>

            {professional.neighborhood && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{professional.neighborhood}</span>
              </span>
            )}

            {hasWhatsApp && (
              <button
                onClick={handleWhatsAppClick}
                className="flex shrink-0 items-center gap-0.5 font-medium text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <MessageCircle className="h-2.5 w-2.5" />
                WhatsApp
              </button>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        </div>
      </motion.article>
    );
  },
);

ServiceCardEnhanced.displayName = 'ServiceCardEnhanced';

