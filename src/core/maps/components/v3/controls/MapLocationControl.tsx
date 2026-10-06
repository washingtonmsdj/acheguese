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
      <Button
        variant="default"
        size="icon"
        onClick={() => { setDismissed(false); onRequestLocation(); }}
        disabled={isLoading}
        className={cn(
          'h-11 w-11 shrink-0 border border-territory-border bg-territory-surface text-territory-muted shadow-lg hover:bg-territory-raised hover:text-territory-ink',
          hasLocation && 'border-territory-brand/35 text-territory-brand',
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

      {showAccuracy && hasLocation && accuracy !== undefined && (
        <div title="Precisão informada pelo GPS" className="flex items-center gap-1.5 rounded-lg border border-territory-border bg-territory-surface px-2 py-1 text-xs shadow-lg">
          <div
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isHighAccuracy ? 'bg-success' : 'bg-warning'
            )}
          />
          <span className="whitespace-nowrap font-medium text-territory-ink">
            ±{Math.round(accuracy)}m
          </span>
        </div>
      )}
      <span className="sr-only" role="status">{isLoading ? 'Buscando sua localização' : hasLocation && !error ? 'Localização encontrada. Mapa centralizado.' : ''}</span>
      {error && !dismissed && !isLoading ? (
        <div role="alert" className="w-56 max-w-[calc(100vw-4rem)] rounded-xl border border-territory-border bg-territory-surface p-3 text-xs leading-relaxed text-territory-ink shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <strong>{permissionDenied ? 'Localização bloqueada' : 'Não foi possível localizar'}</strong>
            <button type="button" aria-label="Fechar aviso de localização" onClick={() => setDismissed(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-territory-muted hover:bg-territory-raised hover:text-territory-ink"><X className="h-4 w-4" /></button>
          </div>
          <p>{permissionDenied ? 'Permita a localização nas configurações deste site no navegador. Depois, toque novamente em Minha localização.' : 'Confira se a localização do aparelho está ativada e tente novamente.'}</p>
        </div>
      ) : null}
    </div>
  );
}
