/**
 * AdvancedOptions Component (AAA)
 * 
 * Accordion com opções avançadas do formulário de corrida.
 * Mantém foco principal em origem/destino, escondendo opções secundárias.
 * 
 * @module mobility/components/ride-request/AdvancedOptions
 */

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  DollarSign,
  CreditCard,
  Banknote,
  Clock,
  Users,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { formatBrl } from '@/shared/utils/currency';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type { PaymentMethod, RideType } from '@/core/mobility/types';
import { PAYMENT_METHOD } from '@/shared/types/constants';

export interface AdvancedOptionsProps {
  /** Tipo de corrida (afeta campos exibidos) */
  rideType: RideType;
  
  /** Valor sugerido */
  suggestedPrice: string;
  onSuggestedPriceChange: (price: string) => void;
  
  /** Método de pagamento */
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  
  /** Observação */
  observation: string;
  onObservationChange: (obs: string) => void;
  
  /** Horário de partida (apenas agendada) */
  departureTime?: string;
  onDepartureTimeChange?: (time: string) => void;
  
  /** Número de vagas (apenas compartilhada) */
  seats?: number;
  onSeatsChange?: (seats: number) => void;
  
  /** Preço estimado (para exibir como referência) */
  estimatedPrice?: number;
  
  /** Classe CSS adicional */
  className?: string;
  
  /** Desabilitado */
  disabled?: boolean;
  
  /** Inicialmente expandido */
  defaultExpanded?: boolean;
}

/**
 * Accordion com opções avançadas do formulário
 * 
 * @example
 * ```tsx
 * <AdvancedOptions
 *   rideType="viagem"
 *   suggestedPrice={suggestedPrice}
 *   onSuggestedPriceChange={setSuggestedPrice}
 *   paymentMethod={paymentMethod}
 *   onPaymentMethodChange={setPaymentMethod}
 *   observation={observation}
 *   onObservationChange={setObservation}
 *   estimatedPrice={15.50}
 * />
 * ```
 */
export const AdvancedOptions = memo<AdvancedOptionsProps>(function AdvancedOptions({
  rideType,
  suggestedPrice,
  onSuggestedPriceChange,
  paymentMethod,
  onPaymentMethodChange,
  observation,
  onObservationChange,
  departureTime,
  onDepartureTimeChange,
  seats,
  onSeatsChange,
  estimatedPrice,
  className,
  disabled = false,
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleExpanded();
      }
    },
    [toggleExpanded]
  );

  const isDelivery = rideType === 'entrega';
  const isScheduled = rideType === 'agendada';
  const isShared = rideType === 'carona_compartilhada';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Accordion Header */}
      <motion.button
        type="button"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between p-3 rounded-xl transition-all',
          'border-2 border-border hover:border-border/80',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          isExpanded && 'border-primary/30 bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-expanded={isExpanded}
        aria-controls="advanced-options-content"
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            ⚙️ Opções avançadas
          </span>
          {!isExpanded && estimatedPrice && (
            <span className="text-xs text-muted-foreground">
              • {formatBrl(estimatedPrice)}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="advanced-options-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-2">
              {/* Horário (apenas agendada) */}
              {isScheduled && onDepartureTimeChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Data e hora
                  </Label>
                  <Input
                    type="datetime-local"
                    value={departureTime || ''}
                    onChange={(e) => onDepartureTimeChange(e.target.value)}
                    className="bg-secondary/50 border-border text-foreground"
                    disabled={disabled}
                    required
                  />
                </div>
              )}

              {/* Vagas (apenas compartilhada) */}
              {isShared && onSeatsChange && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Vagas para compartilhar
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={seats || 1}
                    onChange={(e) => onSeatsChange(parseInt(e.target.value) || 1)}
                    className="bg-secondary/50 border-border text-foreground"
                    disabled={disabled}
                  />
                </div>
              )}

              {/* Valor Sugerido */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Valor sugerido
                  {estimatedPrice && (
                    <span className="text-success ml-1">
                      (calculado: {formatBrl(estimatedPrice)})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={suggestedPrice}
                  onChange={(e) => onSuggestedPriceChange(e.target.value)}
                  placeholder="R$ 0,00 (opcional)"
                  className="bg-secondary/50 border-border text-foreground"
                  disabled={disabled}
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Forma de pagamento
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={() => onPaymentMethodChange(PAYMENT_METHOD.PIX as PaymentMethod)}
                    disabled={disabled}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all text-xs font-medium',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                      paymentMethod === PAYMENT_METHOD.PIX
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/80',
                      disabled && 'opacity-50 cursor-not-allowed',
                    )}
                    whileHover={!disabled ? { scale: 1.02 } : undefined}
                    whileTap={!disabled ? { scale: 0.98 } : undefined}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Pix
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => onPaymentMethodChange(PAYMENT_METHOD.DINHEIRO as PaymentMethod)}
                    disabled={disabled}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all text-xs font-medium',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                      paymentMethod === PAYMENT_METHOD.DINHEIRO
                        ? 'border-success bg-success/10 text-success'
                        : 'border-border text-muted-foreground hover:border-border/80',
                      disabled && 'opacity-50 cursor-not-allowed',
                    )}
                    whileHover={!disabled ? { scale: 1.02 } : undefined}
                    whileTap={!disabled ? { scale: 0.98 } : undefined}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    Dinheiro
                  </motion.button>
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {isDelivery ? 'Descrição do objeto (obrigatório)' : 'Observação (opcional)'}
                </Label>
                <Textarea
                  value={observation}
                  onChange={(e) => onObservationChange(e.target.value)}
                  placeholder={
                    isDelivery
                      ? 'Ex: remédio, documento, bolsa'
                      : 'Alguma informação adicional...'
                  }
                  className="bg-secondary/50 border-border text-foreground resize-none h-16"
                  maxLength={200}
                  disabled={disabled}
                  required={isDelivery}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {observation.length}/200
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AdvancedOptions.displayName = 'AdvancedOptions';
