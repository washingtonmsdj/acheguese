/**
 * 🚗 RIDE REQUEST CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design otimizado para solicitações de carona
 * - Hierarquia visual clara (passageiro e rota em destaque)
 * - Badges inteligentes (tipo, status, pontos)
 * - Timeline visual de rota
 * - Avatar com fallback usando BusinessLogo
 * - Múltiplas variantes (grid, list, compact)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 * - SSOT compliant (usa tipo RideRequest)
 *
 * @version 2.0.0 - Redesign Completo AAA
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useCallback, useMemo } from 'react';
import {
  MapPin,
  Clock,
  DollarSign,
  Package,
  Car,
  Star,
  User,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/dateUtils';
import type { RideRequest } from '@/shared/types/mobilidade';
import { RIDE_STATUS } from '@/shared/types/constants';

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

// ============================================================================
// TYPES
// ============================================================================

interface RideRequestCardProps {
  ride: RideRequest;
  variant?: 'grid' | 'list' | 'compact';
  index?: number;
  onAccept?: (rideId: string) => void;
  onClick?: () => void;
  isDriver?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata horário para exibição
 */
function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

/**
 * Verifica se é entrega
 */
function isDelivery(type: string): boolean {
  return type === 'entrega';
}

/**
 * Verifica se está pendente
 */
function isPending(status: string): boolean {
  return status === RIDE_STATUS.PENDING;
}

/**
 * Verifica se está em andamento
 */
function isInProgress(status: string): boolean {
  return [
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.DRIVER_ARRIVED,
    RIDE_STATUS.PASSENGER_ON_BOARD,
    RIDE_STATUS.IN_PROGRESS,
  ].includes(status);
}

/**
 * Verifica se está completa
 */
function isCompleted(status: string): boolean {
  return status === RIDE_STATUS.COMPLETED;
}

/**
 * Verifica se passageiro tem pontos altos
 */
function hasHighPoints(points?: number): boolean {
  return (points ?? 0) > 1000;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RideRequestCardEnhanced = memo(
  forwardRef<HTMLDivElement, RideRequestCardProps>(function RideRequestCardEnhanced(
    {
      ride,
      variant = 'list',
      index = 0,
      onAccept,
      onClick,
      isDriver = false,
      className,
    },
    ref,
  ) {
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const isEntrega = useMemo(() => isDelivery(ride.type), [ride.type]);
    const isPendingStatus = useMemo(() => isPending(ride.status), [ride.status]);
    const isInProgressStatus = useMemo(() => isInProgress(ride.status), [ride.status]);
    const isCompletedStatus = useMemo(() => isCompleted(ride.status), [ride.status]);
    const hasHighPts = useMemo(() => hasHighPoints(ride.passenger?.pontos), [ride.passenger?.pontos]);

    const relativeTime = useMemo(
      () => formatRelativeTime(ride.created_at),
      [ride.created_at],
    );

    const departureTime = useMemo(
      () => formatTime(ride.departure_time),
      [ride.departure_time],
    );

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClick = useCallback(() => {
      onClick?.();
    }, [onClick]);

    const handleAccept = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onAccept?.(ride.id);
      },
      [onAccept, ride.id],
    );

    // ========================================================================
    // RENDER VARIANTS
    // ========================================================================

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
            'group relative flex items-center gap-2 overflow-hidden rounded-lg border border-border/50 bg-card p-2 transition-all duration-200 hover:border-primary/30 hover:shadow-md cursor-pointer',
            !isPendingStatus && 'opacity-70',
            className,
          )}
          role="article"
          aria-label={`Solicitação de ${isEntrega ? 'entrega' : 'carona'}: ${ride.passenger?.name}`}
        >
          {/* Avatar */}
          <BusinessLogo
            name={ride.passenger?.name || 'Passageiro'}
            imageUrl={ride.passenger?.avatar_url}
            size="sm"
            className="shrink-0"
          />

          {/* Conteúdo */}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs font-bold text-foreground">
              {ride.passenger?.name}
            </p>
            <p className="line-clamp-1 text-[10px] text-muted-foreground">
              {ride.origin} → {ride.destination}
            </p>
          </div>

          {/* Preço */}
          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-success">
              R$ {ride.suggested_price.toFixed(2)}
            </p>
          </div>

          {/* Badge Tipo */}
          <Badge
            className={cn(
              'shrink-0 h-5 px-1.5 text-[10px] font-bold',
              isEntrega
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-primary/10 text-primary border-primary/20',
            )}
          >
            {isEntrega ? <Package className="h-2.5 w-2.5" /> : <Car className="h-2.5 w-2.5" />}
          </Badge>
        </motion.article>
      );
    }

    if (variant === 'grid') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer',
            !isPendingStatus && 'opacity-70',
            className,
          )}
          role="article"
          aria-label={`Solicitação de ${isEntrega ? 'entrega' : 'carona'}: ${ride.passenger?.name}`}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Avatar */}
            <BusinessLogo
              name={ride.passenger?.name || 'Passageiro'}
              imageUrl={ride.passenger?.avatar_url}
              size="md"
              className="shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="line-clamp-1 text-sm font-bold text-foreground">
                  {ride.passenger?.name}
                </h3>
                {hasHighPts && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="h-3 w-3 text-warning fill-warning" />
                    <span className="text-[10px] text-warning font-bold">
                      {ride.passenger?.pontos}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {ride.passenger?.neighborhood} · {relativeTime}
              </p>
            </div>

            {/* Badge Tipo */}
            <Badge
              className={cn(
                'shrink-0 text-[10px] font-bold px-2 py-0.5',
                isEntrega
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : 'bg-primary/10 text-primary border-primary/20',
              )}
            >
              {isEntrega ? (
                <>
                  <Package className="h-3 w-3 mr-1" />
                  Entrega
                </>
              ) : (
                <>
                  <Car className="h-3 w-3 mr-1" />
                  Viagem
                </>
              )}
            </Badge>
          </div>

          {/* Rota */}
          <div className="flex items-start gap-2 mb-3">
            {/* Timeline Visual */}
            <div className="mt-1 flex flex-col items-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary/30" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-warning/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning border-2 border-warning/30" />
            </div>

            {/* Endereços */}
            <div className="flex-1 space-y-2 min-w-0">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Origem
                </p>
                <p className="text-sm text-foreground font-medium line-clamp-1">
                  {ride.origin}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Destino
                </p>
                <p className="text-sm text-foreground font-medium line-clamp-1">
                  {ride.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Metadados */}
          <div className="flex items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{departureTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-success" />
              <span className="text-success font-bold">
                R$ {ride.suggested_price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Observação */}
          {ride.observation && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                "{ride.observation}"
              </p>
            </div>
          )}

          {/* Footer - CTA */}
          <div className="mt-auto">
            {isPendingStatus && isDriver ? (
              <Button
                onClick={handleAccept}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
              >
                <Car className="h-4 w-4 mr-2" />
                Aceitar {isEntrega ? 'Entrega' : 'Viagem'}
              </Button>
            ) : isInProgressStatus ? (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-success/10 border border-success/20">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-semibold">Em andamento</span>
              </div>
            ) : isCompletedStatus ? (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary/50 border border-border">
                <span className="text-xs text-muted-foreground">Concluída</span>
              </div>
            ) : null}
          </div>

          {/* Hover Glow Effect */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          </div>
        </motion.article>
      );
    }

    // ========================================================================
    // LIST VARIANT (DEFAULT)
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
          'group flex flex-col gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
          !isPendingStatus && 'opacity-70',
          className,
        )}
        role="article"
        aria-label={`Solicitação de ${isEntrega ? 'entrega' : 'carona'}: ${ride.passenger?.name}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <BusinessLogo
            name={ride.passenger?.name || 'Passageiro'}
            imageUrl={ride.passenger?.avatar_url}
            size="sm"
            className="shrink-0"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground truncate">
                {ride.passenger?.name}
              </span>
              {hasHighPts && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star className="h-3 w-3 text-warning fill-warning" />
                  <span className="text-[10px] text-warning font-medium">
                    {ride.passenger?.pontos}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {ride.passenger?.neighborhood} · {relativeTime}
            </span>
          </div>

          {/* Badge Tipo */}
          <Badge
            className={cn(
              'shrink-0 text-[10px] font-bold px-2 py-0.5',
              isEntrega
                ? 'bg-warning/10 text-warning border-warning/20'
                : 'bg-primary/10 text-primary border-primary/20',
            )}
          >
            {isEntrega ? (
              <>
                <Package className="h-3 w-3 mr-1" />
                Entrega
              </>
            ) : (
              <>
                <Car className="h-3 w-3 mr-1" />
                Viagem
              </>
            )}
          </Badge>
        </div>

        {/* Rota */}
        <div className="flex items-start gap-2">
          {/* Timeline Visual */}
          <div className="mt-1 flex flex-col items-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary border-2 border-primary/30" />
            <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-warning/50" />
            <div className="w-2 h-2 rounded-full bg-warning border-2 border-warning/30" />
          </div>

          {/* Endereços */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div>
              <p className="text-[10px] text-muted-foreground">Origem</p>
              <p className="text-sm text-foreground font-medium line-clamp-1">
                {ride.origin}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Destino</p>
              <p className="text-sm text-foreground font-medium line-clamp-1">
                {ride.destination}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          {/* Metadados */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              <span>{departureTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-success" />
              <span className="text-success font-bold">
                R$ {ride.suggested_price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* CTA */}
          {isPendingStatus && isDriver ? (
            <Button
              onClick={handleAccept}
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
            >
              <Car className="h-3.5 w-3.5 mr-1.5" />
              Aceitar
            </Button>
          ) : isInProgressStatus ? (
            <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-1" />
              Em andamento
            </Badge>
          ) : isCompletedStatus ? (
            <Badge variant="secondary" className="text-[10px]">
              Concluída
            </Badge>
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          )}
        </div>

        {/* Observação (se houver) */}
        {ride.observation && (
          <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground italic line-clamp-1">
              "{ride.observation}"
            </p>
          </div>
        )}
      </motion.article>
    );
  }),
);

RideRequestCardEnhanced.displayName = 'RideRequestCardEnhanced';
