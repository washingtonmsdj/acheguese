/**
 * MapTerritoryControl - Controle territorial do mapa
 *
 * Wrapper que combina TerritorySelectorV2 + TerritoryIndicator
 * em um único controle posicionável no mapa.
 */

import { TerritorySelectorV2 } from '@/core/location/components/TerritorySelectorV2';
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
      {showSelector && <TerritorySelectorV2 compact={compact} />}
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
