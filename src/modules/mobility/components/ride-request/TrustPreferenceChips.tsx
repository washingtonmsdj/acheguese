/**
 * TrustPreferenceChips Component (AAA)
 * 
 * Chips horizontais compactos para preferências de confiança.
 * Reduz de ~200px (3 botões verticais) para ~40px (chips horizontais).
 * 
 * @module mobility/components/ride-request/TrustPreferenceChips
 * @version 2.0.0 (AAA)
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, BadgeCheck, Home } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export type TrustPreference = 'qualquer' | 'verificado' | 'vizinho';

export interface TrustOption {
  value: TrustPreference;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const trustOptions: TrustOption[] = [
  {
    value: 'qualquer',
    label: 'Qualquer motorista',
    shortLabel: 'Qualquer',
    description: 'Mais rápido, maior disponibilidade de motoristas',
    icon: <Users className="h-3.5 w-3.5" />,
    color: 'muted',
  },
  {
    value: 'verificado',
    label: 'Apenas verificados',
    shortLabel: 'Verificado ✓',
    description: 'Motoristas com CNH e veículo confirmados pela plataforma',
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
    color: 'success',
  },
  {
    value: 'vizinho',
    label: 'Só vizinhos',
    shortLabel: 'Vizinho 🏘️',
    description: 'Motoristas que moram no mesmo bairro que você',
    icon: <Home className="h-3.5 w-3.5" />,
    color: 'info',
  },
];

export interface TrustPreferenceChipsProps {
  /** Preferência selecionada */
  value: TrustPreference;
  /** Callback quando preferência muda */
  onChange: (preference: TrustPreference) => void;
  /** Classe CSS adicional */
  className?: string;
  /** Desabilitado */
  disabled?: boolean;
  /** Mostrar label "Corrida de Confiança" */
  showLabel?: boolean;
}

/**
 * Chips horizontais para seleção de preferência de confiança
 * 
 * @example
 * ```tsx
 * <TrustPreferenceChips
 *   value={trustPreference}
 *   onChange={setTrustPreference}
 *   showLabel
 * />
 * ```
 */
export const TrustPreferenceChips = memo<TrustPreferenceChipsProps>(
  function TrustPreferenceChips({
    value,
    onChange,
    className,
    disabled = false,
    showLabel = true,
  }) {
    const handleSelect = useCallback(
      (preference: TrustPreference) => {
        if (!disabled) {
          onChange(preference);
        }
      },
      [onChange, disabled]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, preference: TrustPreference) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect(preference);
        }
      },
      [handleSelect]
    );

    return (
      <div className={cn('space-y-2', className)}>
        {/* Label */}
        {showLabel && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="text-xs text-muted-foreground font-medium">
              Corrida de Confiança
            </span>
          </div>
        )}

        {/* Chips */}
        <TooltipProvider delayDuration={300}>
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            role="radiogroup"
            aria-label="Preferência de confiança"
          >
            {trustOptions.map((option) => {
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
                        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all flex-shrink-0',
                        'border-2 font-medium text-xs',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
                        isSelected
                          ? cn(
                              'border-current shadow-sm',
                              option.color === 'success' && 'bg-success/10 text-success border-success',
                              option.color === 'info' && 'bg-blue-500/10 text-blue-400 border-blue-400',
                              option.color === 'muted' && 'bg-secondary/50 text-foreground border-border',
                            )
                          : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
                        disabled && 'opacity-50 cursor-not-allowed',
                      )}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${option.label}: ${option.description}`}
                      whileHover={!disabled ? { scale: 1.05 } : undefined}
                      whileTap={!disabled ? { scale: 0.95 } : undefined}
                    >
                      {/* Icon */}
                      <span className="flex-shrink-0">{option.icon}</span>

                      {/* Label */}
                      <span className="whitespace-nowrap">{option.shortLabel}</span>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="trust-preference-indicator"
                          className={cn(
                            'absolute inset-0 rounded-full -z-10',
                            option.color === 'success' && 'bg-success/5',
                            option.color === 'info' && 'bg-blue-500/5',
                            option.color === 'muted' && 'bg-secondary/20',
                          )}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs font-semibold mb-1">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    );
  }
);

TrustPreferenceChips.displayName = 'TrustPreferenceChips';
