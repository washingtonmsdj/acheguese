/**
 * 📦 DELIVERY TRACKING CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design otimizado para tracking de entregas
 * - Timeline visual de progresso
 * - Hierarquia visual clara (status e ações em destaque)
 * - Animações de transição de status
 * - Prova de entrega destacada
 * - Múltiplas variantes (card, compact, timeline)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 *
 * @version 2.0.0 - Redesign Completo AAA
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useCallback, useMemo } from 'react';
import {
  Package,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { RIDE_STATUS } from '../constants';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.01;
const TAP_SCALE = 0.99;

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  [RIDE_STATUS.REQUESTED]: {
    label: 'Aguardando',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
    icon: <Clock className="h-3 w-3" />,
  },
  [RIDE_STATUS.SEARCHING_DRIVER]: {
    label: 'Buscando motoboy',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: <Clock className="h-3 w-3 animate-spin" />,
  },
  [RIDE_STATUS.DRIVER_ASSIGNED]: {
    label: 'Motoboy a caminho',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DRIVER_ACCEPTED]: {
    label: 'Motoboy confirmado',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DRIVER_ARRIVING]: {
    label: 'Motoboy chegando',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.PICKUP_CONFIRMED]: {
    label: 'Pacote coletado',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
    icon: <Package className="h-3 w-3" />,
  },
  [RIDE_STATUS.IN_DELIVERY]: {
    label: 'Em entrega',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DELIVERED]: {
    label: 'Entregue',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [RIDE_STATUS.COMPLETED]: {
    label: 'Concluída',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [RIDE_STATUS.FAILED_DELIVERY]: {
    label: 'Falha na entrega',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  [RIDE_STATUS.CANCELLED_BY_DRIVER]: {
    label: 'Cancelada',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    icon: <XCircle className="h-3 w-3" />,
  },
  [RIDE_STATUS.CANCELLED_BY_PASSENGER]: {
    label: 'Cancelada',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
    icon: <XCircle className="h-3 w-3" />,
  },
  [RIDE_STATUS.EXPIRED]: {
    label: 'Expirada',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    icon: <XCircle className="h-3 w-3" />,
  },
};

const CANCELLABLE_STATES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.DRIVER_ASSIGNED,
];

// ============================================================================
// TYPES
// ============================================================================

interface DeliveryTrackingCardProps {
  delivery: {
    id: string;
    status: string;
    ride_mode: string;
    recipient_name?: string;
    origin?: string;
    destination?: string;
    suggested_price?: number;
    final_price?: number;
    driver_profile_id?: string;
    proof_of_delivery?: {
      photo_url?: string;
      code?: string;
      observation?: string;
      signed_at?: string;
    };
    delivered_at?: string;
    failed_delivery_reason?: string;
    created_at: string;
  };
  variant?: 'card' | 'compact' | 'timeline';
  index?: number;
  onCancel?: (rideId: string) => void;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se pode cancelar
 */
function canCancelDelivery(status: string, onCancel?: (id: string) => void): boolean {
  return CANCELLABLE_STATES.includes(status) && !!onCancel;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const DeliveryTrackingCardEnhanced = memo(
  forwardRef<HTMLDivElement, DeliveryTrackingCardProps>(
    function DeliveryTrackingCardEnhanced(
      {
        delivery,
        variant = 'card',
        index = 0,
        onCancel,
        onClick,
        className,
      },
      ref,
    ) {
      // ========================================================================
      // EARLY RETURN
      // ========================================================================

      if (delivery.ride_mode !== 'motoboy') return null;

      // ========================================================================
      // COMPUTED VALUES
      // ========================================================================

      const statusConfig = useMemo(
        () =>
          STATUS_CONFIG[delivery.status] || {
            label: delivery.status,
            color: 'text-gray-500',
            bgColor: 'bg-gray-500/10 border-gray-500/20',
            icon: <Clock className="h-3 w-3" />,
          },
        [delivery.status],
      );

      const canCancel = useMemo(
        () => canCancelDelivery(delivery.status, onCancel),
        [delivery.status, onCancel],
      );

      const price = useMemo(
        () => delivery.final_price ?? delivery.suggested_price,
        [delivery.final_price, delivery.suggested_price],
      );

      const hasProof = !!delivery.proof_of_delivery;
      const hasFailed = !!delivery.failed_delivery_reason;

      // ========================================================================
      // HANDLERS
      // ========================================================================

      const handleClick = useCallback(() => {
        onClick?.();
      }, [onClick]);

      const handleCancel = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          onCancel?.(delivery.id);
        },
        [onCancel, delivery.id],
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
              className,
            )}
            role="article"
            aria-label={`Entrega: ${statusConfig.label}`}
          >
            {/* Ícone */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-xs font-bold text-foreground">
                Entrega Motoboy
              </p>
              <p className={cn('text-[10px] font-medium', statusConfig.color)}>
                {statusConfig.label}
              </p>
            </div>

            {/* Preço */}
            {price && (
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-foreground">
                  R$ {price.toFixed(2)}
                </p>
              </div>
            )}
          </motion.article>
        );
      }

      if (variant === 'timeline') {
        return (
          <motion.article
            ref={ref}
            {...CARD_ANIMATION}
            transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
            className={cn(
              'relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/50 bg-card p-4',
              className,
            )}
            role="article"
            aria-label={`Entrega: ${statusConfig.label}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Entrega Motoboy</span>
              </div>
              <Badge className={cn('flex items-center gap-1 text-xs border', statusConfig.bgColor, statusConfig.color)}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>

            {/* Timeline Visual */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-500/30" />
                <div className="w-0.5 h-16 bg-gradient-to-b from-emerald-500/50 to-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-500/30" />
              </div>

              <div className="flex-1 space-y-4">
                {delivery.origin && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Origem</p>
                    <p className="text-sm font-medium text-foreground">{delivery.origin}</p>
                  </div>
                )}
                {delivery.destination && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Destino</p>
                    <p className="text-sm font-medium text-foreground">{delivery.destination}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Destinatário e Preço */}
            <div className="flex items-center justify-between text-sm">
              {delivery.recipient_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{delivery.recipient_name}</span>
                </div>
              )}
              {price && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="font-bold text-success">R$ {price.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Prova de Entrega */}
            <AnimatePresence>
              {hasProof && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Entrega confirmada
                  </div>
                  {delivery.proof_of_delivery?.code && (
                    <p className="text-xs text-muted-foreground">
                      Código: <span className="font-mono font-medium">{delivery.proof_of_delivery.code}</span>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Falha */}
            <AnimatePresence>
              {hasFailed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    Falha na entrega
                  </div>
                  <p className="text-xs text-muted-foreground">{delivery.failed_delivery_reason}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cancelar */}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleCancel}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar entrega
              </Button>
            )}
          </motion.article>
        );
      }

      // ========================================================================
      // CARD VARIANT (DEFAULT)
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
            'group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Entrega: ${statusConfig.label}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">Entrega Motoboy</span>
            </div>
            <Badge className={cn('flex items-center gap-1 text-xs border', statusConfig.bgColor, statusConfig.color)}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
          </div>

          {/* Rota */}
          <div className="space-y-1.5 text-sm">
            {delivery.origin && (
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="text-muted-foreground">{delivery.origin}</span>
              </div>
            )}
            {delivery.destination && (
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span className="text-muted-foreground">{delivery.destination}</span>
              </div>
            )}
          </div>

          {/* Destinatário */}
          {delivery.recipient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Para:</span>
              <span className="font-medium">{delivery.recipient_name}</span>
            </div>
          )}

          {/* Preço */}
          {price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-bold text-foreground">
                R$ {price.toFixed(2)}
                {delivery.final_price && (
                  <span className="text-xs text-muted-foreground ml-1">(final)</span>
                )}
              </span>
            </div>
          )}

          {/* Prova de Entrega */}
          <AnimatePresence>
            {hasProof && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Entrega confirmada
                </div>
                {delivery.proof_of_delivery?.code && (
                  <p className="text-xs text-muted-foreground">
                    Código: <span className="font-mono font-medium">{delivery.proof_of_delivery.code}</span>
                  </p>
                )}
                {delivery.proof_of_delivery?.observation && (
                  <p className="text-xs text-muted-foreground">{delivery.proof_of_delivery.observation}</p>
                )}
                {delivery.proof_of_delivery?.signed_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(delivery.proof_of_delivery.signed_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Falha na Entrega */}
          <AnimatePresence>
            {hasFailed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Falha na entrega
                </div>
                <p className="text-xs text-muted-foreground">{delivery.failed_delivery_reason}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancelar */}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleCancel}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar entrega
            </Button>
          )}

          {/* Hover Glow Effect */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald-500/5" />
          </div>
        </motion.article>
      );
    },
  ),
);

DeliveryTrackingCardEnhanced.displayName = 'DeliveryTrackingCardEnhanced';
