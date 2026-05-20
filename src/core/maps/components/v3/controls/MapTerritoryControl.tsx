/**
 * MapTerritoryControl - Controle territorial do mapa
 *
 * Wrapper que combina TerritoryModeSelector + TerritoryIndicator
 * em um unico controle posicionavel no mapa.
 */

import { TerritoryModeSelector } from '@/core/location/components/TerritoryModeSelector';
import { TerritoryIndicator } from '@/core/location/components/TerritoryIndicator';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import type { TerritoryControlConfig } from './types';

interface MapTerritoryControlProps extends TerritoryControlConfig {
  resolved?: ResolvedTerritory | null;
  className?: string;
}

export function MapTerritoryControl({
  showSelector = true,
  showIndicator = true,
  compact = true,
  resolved,
  className,
}: MapTerritoryControlProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      {showSelector && <TerritoryModeSelector compact={compact} />}
      {showIndicator && resolved && (
        <TerritoryIndicator
          resolved={resolved}
          variant="compact"
          className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs shadow-lg border border-border"
        />
      )}
    </div>
  );
}
