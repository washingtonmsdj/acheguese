/**
 * MapLocationControl - Controle de localização GPS unificado
 * 
 * Combina:
 * - Botão de solicitar localização
 * - Indicador de precisão GPS
 * - Status de carregamento
 * - Feedback visual de qualidade do sinal
 */

import { useState } from 'react';
import { LocateFixed, Loader2, X } from 'lucide-react';
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
  error?: string | null;
  permissionDenied?: boolean;
}

export function MapLocationControl({
  onRequestLocation,
  isLoading = false,
  accuracy,
  hasLocation = false,
  isHighAccuracy = false,
  showAccuracy = true,
  className,
  error,
  permissionDenied = false,
}: MapLocationControlProps) {
  const [dismissed, setDismissed] = useState(false);
  return (
    <div className={cn('relative flex flex-col items-end gap-2', className)}>
      {/* Botão de localização */}
      <Button
        variant="default"
        size="icon"
        onClick={() => { setDismissed(false); onRequestLocation(); }}
        disabled={isLoading}
        className={cn(
          'h-11 w-11 shadow-lg shrink-0 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
          hasLocation && 'text-blue-600 border-blue-300',
          isLoading && 'opacity-70'
        )}
        aria-label="Minha localização"
        aria-busy={isLoading}
        title={isLoading ? 'Buscando sua localização…' : hasLocation ? 'Centralizar e atualizar minha localização' : 'Usar minha localização'}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <LocateFixed className="h-5 w-5" />
        )}
      </Button>

      {/* Indicador de precisão */}
      {showAccuracy && hasLocation && accuracy !== undefined && (
        <div title="Precisão informada pelo GPS" className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-lg flex items-center gap-1.5">
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
      <span className="sr-only" role="status">{isLoading ? 'Buscando sua localização' : hasLocation && !error ? 'Localização encontrada. Mapa centralizado.' : ''}</span>
      {error && !dismissed && !isLoading ? (
        <div role="alert" className="w-56 max-w-[calc(100vw-4rem)] rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-700 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <strong>{permissionDenied ? 'Localização bloqueada' : 'Não foi possível localizar'}</strong>
            <button type="button" aria-label="Fechar aviso de localização" onClick={() => setDismissed(true)} className="grid h-11 w-11 shrink-0 place-items-center"><X className="h-4 w-4" /></button>
          </div>
          <p>{permissionDenied ? 'Permita a localização nas configurações deste site no navegador. Depois, toque novamente em Minha localização.' : 'Confira se a localização do aparelho está ativada e tente novamente.'}</p>
        </div>
      ) : null}
    </div>
  );
}
