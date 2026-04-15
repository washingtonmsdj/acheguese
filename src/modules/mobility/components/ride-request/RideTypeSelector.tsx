/**
 * RideTypeSelector Component (AAA)
 * 
 * Seletor compacto de tipo de corrida em formato de tabs horizontais.
 * Reduz de ~120px (grid 2x2) para ~48px (tabs 1 linha).
 * 
 * @module mobility/components/ride-request/RideTypeSelector
 * @version 2.0.0 (AAA)
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Car, Package, Calendar, Users } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { RideType } from '@/modules/mobility/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export interface RideTypeOption {
  value: RideType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const rideTypeOptions: RideTypeOption[] = [
  {
    value: 'viagem',
    label: 'Viagem',
    icon: <Car className="h-4 w-4" />,
    description: 'Corrida rápida para você',
    color: 'primary',
  },
  {
    value: 'entrega',
    label: 'Entrega',
    icon: <Package className="h-4 w-4" />,
    description: 'Enviar objetos, documentos ou compras',
    color: 'warning',
  },
  {
    value: 'agendada',
    label: 'Agendada',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Agendar para data e hora específica',
    color: 'accent',
  },
  {
    value: 'carona_compartilhada',
    label: 'Compartilhada',
    icon: <Users className="h-4 w-4" />,
    description: 'Dividir corrida com outros passageiros',
    color: 'secondary',
  },
];

export interface RideTypeSelectorProps {
  /** Tipo selecionado */
  value: RideType;
  /** Callback quando tipo muda */
  onChange: (type: RideType) => void;
  /** Classe CSS adicional */
  className?: string;
  /** Desabilitado */
  disabled?: boolean;
}

/**
 * Seletor de tipo de corrida em formato de tabs compactas
 * 
 * @example
 * ```tsx
 * <RideTypeSelector
 *   value={type}
 *   onChange={setType}
 * />
 * ```
 */
export const RideTypeSelector = memo<RideTypeSelectorProps>(function RideTypeSelector({
  value,
  onChange,
  className,
  disabled = false,
}) {
  const handleSelect = useCallback(
    (type: RideType) => {
      if (!disabled) {
        onChange(type);
      }
    },
    [onChange, disabled]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: RideType) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(type);
      }
    },
    [handleSelect]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-none', className)}
        role="tablist"
        aria-label="Tipo de corrida"
      >
        {rideTypeOptions.map((option) => {
          const isSelected = value === option.value;

          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  disabled={disabled}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all flex-shrink-0',
                    'border-2 font-medium text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                    isSelected
                      ? cn(
                          'border-current shadow-sm',
                          option.color === 'primary' && 'bg-primary/10 text-primary border-primary',
                          option.color === 'warning' && 'bg-warning/10 text-warning border-warning',
                          option.color === 'accent' && 'bg-accent/10 text-accent border-accent',
                          option.color === 'secondary' && 'bg-secondary/10 text-secondary-foreground border-secondary',
                        )
                      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                    disabled && 'opacity-50 cursor-not-allowed',
                  )}
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${option.label}: ${option.description}`}
                  whileHover={!disabled ? { scale: 1.02 } : undefined}
                  whileTap={!disabled ? { scale: 0.98 } : undefined}
                >
                  {/* Icon */}
                  <span className="flex-shrink-0">{option.icon}</span>

                  {/* Label */}
                  <span className="whitespace-nowrap">{option.label}</span>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="ride-type-indicator"
                      className={cn(
                        'absolute inset-0 rounded-xl -z-10',
                        option.color === 'primary' && 'bg-primary/5',
                        option.color === 'warning' && 'bg-warning/5',
                        option.color === 'accent' && 'bg-accent/5',
                        option.color === 'secondary' && 'bg-secondary/5',
                      )}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{option.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});

RideTypeSelector.displayName = 'RideTypeSelector';
