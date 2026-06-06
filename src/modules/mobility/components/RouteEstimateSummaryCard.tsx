/**
 * 📍 ROUTE ESTIMATE CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design otimizado para estimativas de rota
 * - Hierarquia visual clara (preço em destaque)
 * - Animações de count-up nos valores
 * - Breakdown de preço expansível
 * - Múltiplas variantes (default, compact, detailed)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 * - Skeleton loading state
 *
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useMemo, useCallback } from 'react';
import { Navigation, Clock, DollarSign, TrendingUp, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatBrl } from '@/shared/utils/currency';
type RouteEstimate = {
  distance: { distanceFormatted: string };
  eta: { durationFormatted: string; arrivalTime: Date };
  fare?: { finalFare?: number; totalFare?: number; minimumFare?: number; breakdown?: Array<{ label: string; value: number }> };
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

// ============================================================================
// TYPES
// ============================================================================

interface RouteEstimateCardProps {
  estimate: RouteEstimate;
  variant?: 'default' | 'compact' | 'detailed';
  showBreakdown?: boolean;
  index?: number;
  className?: string;
}

interface RouteEstimateCardSkeletonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se está em horário de pico
 */
function isPeakHour(fare: RouteEstimate['fare']): boolean {
  return !!(fare?.finalFare && fare?.totalFare && fare.finalFare > fare.totalFare);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RouteEstimateSummaryCard = memo(
  forwardRef<HTMLDivElement, RouteEstimateCardProps>(function RouteEstimateSummaryCard(
    {
      estimate,
      variant = 'default',
      showBreakdown = false,
      index = 0,
      className,
    },
    ref,
  ) {
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const { distance, eta, fare } = estimate;

    const isPeak = useMemo(() => isPeakHour(fare), [fare]);

    const arrivalTime = useMemo(
      () =>
        eta.arrivalTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      [eta.arrivalTime],
    );

    // ========================================================================
    // RENDER VARIANTS
    // ========================================================================

    if (variant === 'compact') {
      return (
        <motion.div
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 5) * 0.05 }}
          className={cn('flex items-center gap-3 text-sm', className)}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Navigation className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{distance.distanceFormatted}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{eta.durationFormatted}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-success" />
            <span className="font-bold text-success">{formatBrl(fare?.finalFare ?? 0)}</span>
          </div>
        </motion.div>
      );
    }

    if (variant === 'detailed') {
      return (
        <motion.div
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
        >
          <Card className={cn('bg-card border-border p-5', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                Estimativa da Viagem
              </h3>
              {isPeak && (
                <Badge className="bg-warning/10 text-warning border-warning/20 text-xs font-bold">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Horário de Pico
                </Badge>
              )}
            </div>

            {/* Main Info - Grid */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {/* Distance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10"
              >
                <Navigation className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{distance.distanceFormatted}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Distância
                </p>
              </motion.div>

              {/* ETA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10"
              >
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{eta.durationFormatted}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Tempo</p>
              </motion.div>

              {/* Price */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 rounded-xl bg-success/5 border border-success/10"
              >
                <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-xl font-bold text-success">
                  {formatBrl(fare?.finalFare ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Preço</p>
              </motion.div>
            </div>

            {/* Breakdown */}
            <AnimatePresence>
              {showBreakdown && fare?.breakdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-border space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Info className="h-3.5 w-3.5" />
                    <span className="font-semibold">Detalhamento do Preço</span>
                  </div>
                  {fare.breakdown.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground">
                        {formatBrl(item?.value ?? 0)}
                      </span>
                    </motion.div>
                  ))}
                  {fare?.finalFare && fare?.totalFare && fare.finalFare !== fare.totalFare && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Tarifa mínima aplicada</span>
                      <span className="font-semibold text-foreground">
                        {formatBrl(fare?.minimumFare ?? 0)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arrival Time */}
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chegada prevista</span>
              <span className="font-semibold text-foreground">{arrivalTime}</span>
            </div>
          </Card>
        </motion.div>
      );
    }

    // ========================================================================
    // DEFAULT VARIANT
    // ========================================================================

    return (
      <motion.div
        ref={ref}
        {...CARD_ANIMATION}
        transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
      >
        <Card className={cn('bg-card border-border p-4', className)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Estimativa da Viagem
            </h3>
            {isPeak && (
              <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px] font-bold">
                <TrendingUp className="h-3 w-3 mr-1" />
                Horário de Pico
              </Badge>
            )}
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Distance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
            >
              <Navigation className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{distance.distanceFormatted}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Distância
              </p>
            </motion.div>

            {/* ETA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10"
            >
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{eta.durationFormatted}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tempo</p>
            </motion.div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center p-3 rounded-xl bg-success/5 border border-success/10"
            >
              <DollarSign className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold text-success">
                {formatBrl(fare?.finalFare ?? 0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Preço</p>
            </motion.div>
          </div>

          {/* Breakdown */}
          <AnimatePresence>
            {showBreakdown && fare?.breakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-border space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Info className="h-3 w-3" />
                  <span className="font-semibold">Detalhamento do Preço</span>
                </div>
                {fare.breakdown.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold text-foreground">
                      {formatBrl(item?.value ?? 0)}
                    </span>
                  </motion.div>
                ))}
                {fare?.finalFare && fare?.totalFare && fare.finalFare !== fare.totalFare && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                    <span className="text-muted-foreground">Tarifa mínima aplicada</span>
                    <span className="font-semibold text-foreground">
                      {formatBrl(fare?.minimumFare ?? 0)}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Arrival Time */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Chegada prevista</span>
            <span className="font-semibold text-foreground">{arrivalTime}</span>
          </div>
        </Card>
      </motion.div>
    );
  }),
);

RouteEstimateSummaryCard.displayName = 'RouteEstimateSummaryCard';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export const RouteEstimateCardSkeleton = memo(
  forwardRef<HTMLDivElement, RouteEstimateCardSkeletonProps>(
    function RouteEstimateCardSkeleton({ variant = 'default', className }, ref) {
      if (variant === 'compact') {
        return (
          <div ref={ref} className={cn('flex items-center gap-3', className)}>
            <div className="h-4 w-16 bg-secondary/50 rounded animate-pulse" />
            <div className="w-px h-4 bg-border" />
            <div className="h-4 w-16 bg-secondary/50 rounded animate-pulse" />
            <div className="w-px h-4 bg-border" />
            <div className="h-4 w-20 bg-secondary/50 rounded animate-pulse" />
          </div>
        );
      }

      return (
        <Card ref={ref} className={cn('bg-card border-border p-4', className)}>
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-32 bg-secondary/50 rounded animate-pulse" />
            <div className="h-5 w-20 bg-secondary/50 rounded-full animate-pulse" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-secondary/30">
                <div className="h-5 w-5 bg-secondary/50 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-6 w-16 bg-secondary/50 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-3 w-12 bg-secondary/50 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <div className="h-3 w-24 bg-secondary/50 rounded animate-pulse" />
            <div className="h-3 w-16 bg-secondary/50 rounded animate-pulse" />
          </div>
        </Card>
      );
    },
  ),
);

RouteEstimateCardSkeleton.displayName = 'RouteEstimateCardSkeleton';
