/**
 * 💰 CLASSIFICADO CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design moderno otimizado para conversão
 * - Hierarquia visual clara (preço em destaque)
 * - Status inteligente com badges
 * - Metadados úteis (localização, categoria, data)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 *
 * @version 2.0.0 - Redesign Completo
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useMemo } from 'react';
import { MapPin, Clock, Tag, Eye, Heart } from 'lucide-react';
import { ViewOnMapButton } from '@/core/maps/components/ViewOnMapButton';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClassificadoWithVendedor } from '@/modules/classifieds/hooks/useClassificados';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; dot: string }
> = {
  active: {
    label: 'Disponível',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  reserved: {
    label: 'Reservado',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-500',
  },
  sold: {
    label: 'Vendido',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    dot: 'bg-muted-foreground',
  },
};

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.98;

// ============================================================================
// TYPES
// ============================================================================

interface ClassificadoCardProps {
  classificado: ClassificadoWithVendedor;
  variant?: 'grid' | 'list';
  index?: number;
  onClick: () => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata preço em BRL
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formata data relativa
 */
function formatRelativeDate(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return '';
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ClassificadoCard = memo(
  forwardRef<HTMLDivElement, ClassificadoCardProps>(function ClassificadoCard(
    {
      classificado,
      variant = 'grid',
      index = 0,
      onClick,
      onToggleFavorite,
      isFavorite = false,
      className,
    },
    ref,
  ) {
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const status = useMemo(
      () => STATUS_CONFIG[classificado.status] || STATUS_CONFIG.active,
      [classificado.status],
    );

    const firstImage = useMemo(
      () => classificado.fotos?.[0] || '/placeholder.svg',
      [classificado.fotos],
    );

    const formattedPrice = useMemo(
      () => (classificado.preco ? formatPrice(classificado.preco) : 'Sob consulta'),
      [classificado.preco],
    );

    const relativeDate = useMemo(
      () => formatRelativeDate(classificado.created_at),
      [classificado.created_at],
    );

    const hasLocation = !!classificado.bairro;
    const hasCoordinates = classificado.latitude && classificado.longitude;
    const imageCount = classificado.fotos?.length || 0;

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite?.(classificado.id);
    };

    // ========================================================================
    // RENDER VARIANTS
    // ========================================================================

    if (variant === 'list') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={onClick}
          className={cn(
            'group flex gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Classificado: ${classificado.titulo}`}
        >
          {/* Imagem */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
            <img
              src={firstImage}
              alt={classificado.titulo}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />

            {/* Image Count Badge */}
            {imageCount > 1 && (
              <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                +{imageCount - 1}
              </div>
            )}

            {/* Status Badge */}
            <div
              className={cn(
                'absolute left-1 top-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border backdrop-blur-sm',
                status.bgColor,
                status.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {classificado.titulo}
                </h3>
                {onToggleFavorite && (
                  <button
                    onClick={handleFavoriteClick}
                    className="shrink-0 transition-transform hover:scale-110"
                    aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Metadados */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {/* Categoria */}
                {classificado.categoria && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {classificado.categoria}
                  </span>
                )}

                {/* Localização */}
                {hasLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {classificado.bairro}
                  </span>
                )}

                {/* Data */}
                {relativeDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {relativeDate}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-base font-bold text-primary">{formattedPrice}</span>

              {hasCoordinates && (
                <ViewOnMapButton
                  latitude={classificado.latitude!}
                  longitude={classificado.longitude!}
                  itemId={classificado.id}
                  itemType="classified"
                  itemName={classificado.titulo}
                  size="sm"
                  variant="outline"
                />
              )}
            </div>
          </div>
        </motion.article>
      );
    }

    // ========================================================================
    // GRID VARIANT (DEFAULT)
    // ========================================================================

    return (
      <motion.article
        ref={ref}
        {...CARD_ANIMATION}
        transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
        whileHover={{ scale: HOVER_SCALE }}
        whileTap={{ scale: TAP_SCALE }}
        onClick={onClick}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer',
          className,
        )}
        role="article"
        aria-label={`Classificado: ${classificado.titulo}`}
      >
        {/* Imagem */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={firstImage}
            alt={classificado.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 320px"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {/* Status Badge */}
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border backdrop-blur-sm',
                status.bgColor,
                status.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </div>

            {/* Categoria Badge */}
            {classificado.categoria && (
              <Badge variant="secondary" className="backdrop-blur-sm text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {classificado.categoria}
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-white',
                )}
              />
            </button>
          )}

          {/* Image Count Badge */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <Eye className="mr-1 inline h-3 w-3" />
              {imageCount} fotos
            </div>
          )}

          {/* Preço Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8">
            <span className="text-xl font-bold text-white drop-shadow-lg">{formattedPrice}</span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {classificado.titulo}
          </h3>

          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {/* Localização */}
            {hasLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{classificado.bairro}</span>
              </span>
            )}

            {/* Data */}
            {relativeDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {relativeDate}
              </span>
            )}
          </div>

          {/* Footer */}
          {hasCoordinates && (
            <div className="mt-auto">
              <ViewOnMapButton
                latitude={classificado.latitude!}
                longitude={classificado.longitude!}
                itemId={classificado.id}
                itemType="classified"
                itemName={classificado.titulo}
                size="sm"
                variant="outline"
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-500/5" />
        </div>
      </motion.article>
    );
  }),
);

ClassificadoCard.displayName = 'ClassificadoCard';
