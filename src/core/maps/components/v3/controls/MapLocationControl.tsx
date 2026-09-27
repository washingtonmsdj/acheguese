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
          'shrink-0 border border-territory-border bg-territory-surface text-territory-brand shadow-lg hover:bg-territory-raised',
          hasLocation && isHighAccuracy && 'border-territory-success bg-territory-success text-territory-on-image hover:bg-territory-success',
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
        <div className="flex min-w-[140px] items-center gap-2 rounded-lg border border-territory-border bg-territory-surface px-3 py-2 text-sm shadow-lg">
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              isHighAccuracy ? 'bg-territory-success' : 'bg-territory-warning'
            )}
          />
          <span className="whitespace-nowrap font-medium text-territory-ink">
            ±{Math.round(accuracy)}m
          </span>
        </div>
      )}
    </div>
  );
}
