/**
 * MapLocationControl - Controle de localização GPS unificado
 * 
 * Combina:
 * - Botão de solicitar localização
 * - Indicador de precisão GPS
 * - Status de carregamento
 * - Feedback visual de qualidade do sinal
 */

import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import type { LocationControlConfig } from './types';

interface MapLocationControlProps extends LocationControlConfig {
  onRequestLocation: () => void;
  isLoading?: boolean;
  accuracy?: number;
  hasLocation?: boolean;
  isHighAccuracy?: boolean;
  className?: string;
}

export function MapLocationControl({
  onRequestLocation,
  isLoading = false,
  accuracy,
  hasLocation = false,
  isHighAccuracy = false,
  showAccuracy = true,
  className,
}: MapLocationControlProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Botão de localização */}
      <Button
        variant="default"
        size="icon"
        onClick={onRequestLocation}
        disabled={isLoading}
        className={cn(
          'shadow-lg shrink-0 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
          hasLocation && isHighAccuracy && 'bg-green-500 hover:bg-green-600 text-white border-green-600',
          isLoading && 'opacity-70'
        )}
        aria-label="Minha localização"
        title={hasLocation ? 'Atualizar localização' : 'Obter minha localização'}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Navigation className={cn('h-5 w-5', hasLocation && 'fill-current')} />
        )}
      </Button>

      {/* Indicador de precisão */}
      {showAccuracy && hasLocation && accuracy !== undefined && (
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-lg flex items-center gap-2 min-w-[140px]">
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isHighAccuracy ? 'bg-green-500' : 'bg-yellow-500'
            )}
          />
          <span className="text-gray-700 font-medium whitespace-nowrap">
            ±{Math.round(accuracy)}m
          </span>
        </div>
      )}
    </div>
  );
}
