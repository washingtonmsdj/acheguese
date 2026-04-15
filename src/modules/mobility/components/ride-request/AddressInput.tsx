/**
 * AddressInput Component (AAA)
 * 
 * Input reutilizável para endereços com:
 * - Geocoding automático
 * - Botão GPS integrado
 * - Validação visual
 * - Feedback de loading
 * - Acessibilidade WCAG AAA
 * 
 * @module mobility/components/ride-request/AddressInput
 * @version 2.0.0 (AAA)
 */

import React, { memo, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { cn } from '@/shared/utils/cn';
import { useAddressInput } from '@/modules/mobility/hooks/useAddressInput';
import type { AddressInputResult } from '@/modules/mobility/hooks/useAddressInput';

export interface AddressInputProps {
  /** Label do campo */
  label: string;
  /** Placeholder */
  placeholder?: string;
  /** Valor inicial */
  value?: string;
  /** Callback quando endereço é validado */
  onValidated?: (result: AddressInputResult) => void;
  /** Callback quando há erro */
  onError?: (error: string) => void;
  /** Mostrar botão GPS */
  showGPS?: boolean;
  /** Auto-capturar GPS ao montar */
  autoCaptureGPS?: boolean;
  /** Ícone customizado */
  icon?: React.ReactNode;
  /** Cor do ícone */
  iconColor?: string;
  /** Classe CSS adicional */
  className?: string;
  /** Desabilitado */
  disabled?: boolean;
  /** Obrigatório */
  required?: boolean;
  /** ID para acessibilidade */
  id?: string;
}

/**
 * Input de endereço com geocoding e GPS integrados
 * 
 * @example
 * ```tsx
 * <AddressInput
 *   label="Origem"
 *   placeholder="Digite o endereço de origem"
 *   showGPS
 *   autoCaptureGPS
 *   onValidated={(result) => console.log('Validado:', result)}
 *   icon={<MapPin className="h-4 w-4" />}
 *   iconColor="text-primary"
 * />
 * ```
 */
export const AddressInput = memo(
  forwardRef<HTMLInputElement, AddressInputProps>(function AddressInput(
    {
      label,
      placeholder = 'Digite o endereço',
      value: initialValue,
      onValidated,
      onError,
      showGPS = true,
      autoCaptureGPS = false,
      icon = <MapPin className="h-4 w-4" />,
      iconColor = 'text-primary',
      className,
      disabled = false,
      required = false,
      id,
    },
    ref
  ) {
    const addressInput = useAddressInput({
      onValidated,
      onError,
      autoGeocodeOnBlur: true,
    });
    
    // Auto-capturar GPS ao montar
    React.useEffect(() => {
      if (autoCaptureGPS && !addressInput.text && !addressInput.isLoading) {
        addressInput.captureGPS();
      }
    }, [autoCaptureGPS]); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Setar valor inicial
    React.useEffect(() => {
      if (initialValue && !addressInput.text) {
        addressInput.setText(initialValue);
      }
    }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps
    
    const handleBlur = useCallback(() => {
      if (addressInput.text.trim() && !addressInput.isValid && !addressInput.isLoading) {
        addressInput.geocode();
      }
    }, [addressInput]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (addressInput.text.trim() && !addressInput.isValid) {
          addressInput.geocode();
        }
      }
    }, [addressInput]);
    
    const isLoading = addressInput.isLoading || addressInput.isGeocodingGPS;
    const showValidIcon = addressInput.isValid && !isLoading;
    const showErrorIcon = addressInput.text.trim() && !addressInput.isValid && !isLoading;
    
    return (
      <div className={cn('space-y-1.5', className)}>
        {/* Label */}
        <Label
          htmlFor={id}
          className="text-xs text-muted-foreground flex items-center gap-1.5"
        >
          <span className={cn('flex-shrink-0', iconColor)}>
            {icon}
          </span>
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        {/* Input Container */}
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            value={addressInput.text}
            onChange={(e) => addressInput.setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Carregando...' : placeholder}
            className={cn(
              'bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground pr-24 transition-all',
              addressInput.isValid && 'border-success/50 focus:border-success',
              showErrorIcon && 'border-destructive/50 focus:border-destructive',
            )}
            disabled={disabled || isLoading}
            required={required}
            aria-label={label}
            aria-invalid={showErrorIcon}
            aria-describedby={showErrorIcon ? `${id}-error` : undefined}
          />
          
          {/* Right Icons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Loading Spinner */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Valid Icon */}
            <AnimatePresence>
              {showValidIcon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error Icon */}
            <AnimatePresence>
              {showErrorIcon && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Clear Button */}
            {addressInput.text && !isLoading && (
              <motion.button
                type="button"
                onClick={addressInput.clear}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar endereço"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-3.5 w-3.5" />
              </motion.button>
            )}
            
            {/* GPS Button */}
            {showGPS && (
              <motion.button
                type="button"
                onClick={addressInput.captureGPS}
                disabled={isLoading}
                className={cn(
                  'flex items-center gap-1 text-[0.65rem] font-medium px-2 py-1 rounded-lg transition-all',
                  addressInput.hasGPS
                    ? 'text-success bg-success/10'
                    : 'text-primary bg-primary/10 hover:bg-primary/20',
                  isLoading && 'opacity-50 cursor-not-allowed',
                )}
                aria-label="Usar minha localização"
                whileHover={!isLoading ? { scale: 1.05 } : undefined}
                whileTap={!isLoading ? { scale: 0.95 } : undefined}
              >
                <Navigation className="h-3 w-3" />
                {addressInput.hasGPS ? 'GPS ✓' : 'GPS'}
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Error Message */}
        <AnimatePresence>
          {showErrorIcon && (
            <motion.p
              id={`${id}-error`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
              role="alert"
            >
              Endereço inválido ou fora do território atendido
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  })
);

AddressInput.displayName = 'AddressInput';
