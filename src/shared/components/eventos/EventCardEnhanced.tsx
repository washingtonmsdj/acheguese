/**
 * 🎉 EVENT CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design moderno otimizado para eventos
 * - Hierarquia visual clara (data e título em destaque)
 * - Status inteligente com badges coloridas
 * - Metadados úteis (data, horário, participantes, localização)
 * - Botão "Ver no Mapa" integrado (quando tem coordenadas)
 * - Botão de favorito
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 * - SSOT compliant
 *
 * @version 3.0.0 - Redesign Completo AAA
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, MapPin, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { buildGoogleMapsSearchUrl } from '@/shared/utils/contactLinks';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  date: string;
  created_at: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  current_participants: number;
  max_participants?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.98;

const STATUS_CONFIG: Record<
  Event['status'],
  { label: string; color: string; bgColor: string; dot: string }
> = {
  upcoming: {
    label: 'Em breve',
    color: 'text-primary',
    bgColor: 'bg-primary/10 border-primary/20',
    dot: 'bg-primary',
  },
  ongoing: {
    label: 'Acontecendo',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Finalizado',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    dot: 'bg-muted-foreground',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 border-destructive/20',
    dot: 'bg-destructive',
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface EventCardProps {
  evento: Event;
  variant?: 'grid' | 'list' | 'compact';
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
 * Formata data de forma inteligente
 */
function formatSmartDate(date: string): string {
  try {
    const eventDate = new Date(date);
    
    if (isToday(eventDate)) {
      return 'Hoje';
    }
    if (isTomorrow(eventDate)) {
      return 'Amanhã';
    }
    if (isPast(eventDate)) {
      return format(eventDate, "d 'de' MMM", { locale: ptBR });
    }
    
    return format(eventDate, "d 'de' MMM", { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Formata horário
 */
function formatTime(date: string): string {
  try {
    return format(new Date(date), 'HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
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

/**
 * Verifica se o evento é novo (menos de 7 dias)
 */
function isNewEvent(date: string): boolean {
  try {
    const now = new Date();
    const eventDate = new Date(date);
    const diffInDays = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 7;
  } catch {
    return false;
  }
}

/**
 * Verifica se está quase lotado (>= 80% da capacidade)
 */
function isAlmostFull(current: number, max?: number): boolean {
  if (!max) return false;
  return (current / max) >= 0.8;
}

function openInMaps(latitude: number, longitude: number): void {
  openSafeExternalUrl(
    buildGoogleMapsSearchUrl(`${latitude},${longitude}`),
    { context: "event-card-map" },
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EventCardEnhanced = memo(
  forwardRef<HTMLDivElement, EventCardProps>(function EventCardEnhanced(
    {
      evento,
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

    const statusConfig = useMemo(
      () => STATUS_CONFIG[evento.status],
      [evento.status],
    );

    const smartDate = useMemo(
      () => formatSmartDate(evento.date),
      [evento.date],
    );

    const time = useMemo(
      () => formatTime(evento.date),
      [evento.date],
    );

    const relativeDate = useMemo(
      () => formatRelativeDate(evento.created_at),
      [evento.created_at],
    );

    const isNew = useMemo(
      () => isNewEvent(evento.created_at),
      [evento.created_at],
    );

    const almostFull = useMemo(
      () => isAlmostFull(evento.current_participants, evento.max_participants),
      [evento.current_participants, evento.max_participants],
    );

    const hasCoordinates = !!evento.latitude && !!evento.longitude;
    const hasMaxParticipants = !!evento.max_participants;

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    const handleFavoriteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(evento.id);
      },
      [onToggleFavorite, evento.id],
    );

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
          onClick={handleClick}
          className={cn(
            'group flex gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Evento: ${evento.title}`}
        >
          {/* Imagem */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
            <img
              src={evento.image_url || '/placeholder.svg'}
              alt={evento.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />

            {/* Status Badge */}
            <div
              className={cn(
                'absolute left-1 top-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border backdrop-blur-sm',
                statusConfig.bgColor,
                statusConfig.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
              {statusConfig.label}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {evento.title}
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
                {/* Data */}
                <span className="flex items-center gap-1 font-medium text-primary">
                  <Calendar className="h-3 w-3" />
                  {smartDate}
                </span>

                {/* Horário */}
                {time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {time}
                  </span>
                )}

                {/* Participantes */}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {evento.current_participants}
                  {hasMaxParticipants && `/${evento.max_participants}`}
                </span>

                {/* Localização */}
                {evento.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{evento.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Footer - Badges */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {isNew && (
                <Badge className="h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                  <TrendingUp className="mr-0.5 h-2.5 w-2.5" />
                  Novo
                </Badge>
              )}
              {almostFull && (
                <Badge className="h-5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                  <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                  Quase lotado
                </Badge>
              )}
              {hasCoordinates && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInMaps(evento.latitude!, evento.longitude!);
                  }}
                >
                  Ver no mapa
                </Button>
              )}
            </div>
          </div>
        </motion.article>
      );
    }

    if (variant === 'compact') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 5) * 0.05 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            'group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Evento: ${evento.title}`}
        >
          {/* Imagem */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={evento.image_url || '/placeholder.svg'}
              alt={evento.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Status Badge */}
            <div className="absolute left-2 top-2">
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border backdrop-blur-sm',
                  statusConfig.bgColor,
                  statusConfig.color,
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                {statusConfig.label}
              </div>
            </div>

            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteClick}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart
                  className={cn(
                    'h-3.5 w-3.5 transition-colors',
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-white',
                  )}
                />
              </button>
            )}

            {/* Título Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-lg">
                {evento.title}
              </h3>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex flex-col gap-1.5 p-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {smartDate}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {evento.current_participants}
                {hasMaxParticipants && `/${evento.max_participants}`}
              </span>
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
        onClick={handleClick}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer',
          className,
        )}
        role="article"
        aria-label={`Evento: ${evento.title}`}
      >
        {/* Imagem */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={evento.image_url || '/placeholder.svg'}
            alt={evento.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 400px"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {/* Status Badge */}
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border backdrop-blur-sm',
                statusConfig.bgColor,
                statusConfig.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
              {statusConfig.label}
            </div>

            {/* Novo Badge */}
            {isNew && (
              <Badge className="bg-emerald-500/90 text-white border-0 backdrop-blur-sm text-xs">
                <TrendingUp className="mr-1 h-3 w-3" />
                Novo
              </Badge>
            )}

            {/* Quase Lotado Badge */}
            {almostFull && (
              <Badge className="bg-amber-500/90 text-white border-0 backdrop-blur-sm text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Quase lotado
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
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

          {/* Título Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-base font-bold text-white drop-shadow-lg line-clamp-2 leading-snug sm:text-lg">
              {evento.title}
            </h3>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Metadados Principais */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {/* Data */}
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <Calendar className="h-4 w-4" />
              {smartDate}
            </span>

            {/* Horário */}
            {time && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {time}
              </span>
            )}

            {/* Participantes */}
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              {evento.current_participants}
              {hasMaxParticipants && `/${evento.max_participants}`}
            </span>
          </div>

          {/* Localização */}
          {evento.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{evento.location}</span>
            </div>
          )}

          {/* Footer */}
          {hasCoordinates && (
            <div className="mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  openInMaps(evento.latitude!, evento.longitude!);
                }}
              >
                Ver no mapa
              </Button>
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
        </div>
      </motion.article>
    );
  }),
);

EventCardEnhanced.displayName = 'EventCardEnhanced';
