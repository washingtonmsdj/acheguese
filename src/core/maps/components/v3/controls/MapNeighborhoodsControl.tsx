/**
 * MapNeighborhoodsControl
 *
 * Botão toggle que ativa/desativa a exibição dos polígonos de todos os
 * bairros da cidade no mapa. Só é renderizado quando o território ativo
 * é uma cidade (não um bairro ou grupo).
 */

import { Map } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { NeighborhoodsControlConfig } from './types';

interface MapNeighborhoodsControlProps extends NeighborhoodsControlConfig {
  active: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  className?: string;
}

export function MapNeighborhoodsControl({
  active,
  isLoading = false,
  onToggle,
  className,
}: MapNeighborhoodsControlProps) {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
        'bg-background/95 backdrop-blur-sm border border-border shadow-lg',
        active
          ? 'text-foreground border-primary/50 bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        isLoading && 'opacity-60 cursor-wait',
        className,
      )}
      aria-pressed={active}
      aria-label={active ? 'Ocultar bairros no mapa' : 'Mostrar bairros no mapa'}
      title={active ? 'Ocultar bairros' : 'Mostrar bairros'}
    >
      <Map className="h-3.5 w-3.5 shrink-0" />
      <span>{isLoading ? 'Carregando...' : 'Bairros'}</span>
    </button>
  );
}
