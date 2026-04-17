/**
 * useActiveTerritory
 *
 * Hook público para leitura do território ativo e modo territorial.
 * Modos: 'bairro' (filtra pelo bairro do morador), 'cidade' (cidade inteira), null (visitante)
 */

import { useSyncExternalStore } from 'react';
import { locationContextStore } from '../stores/LocationContextStore';
import type { ActiveTerritory, Location, TerritoryMode } from '../types';

export function useActiveTerritory(): {
  activeTerritory: ActiveTerritory;
  activeLocation: Location | null;
  territoryMode: TerritoryMode;
  setActiveLocation: (location: Location | null) => void;
  setTerritoryMode: (mode: TerritoryMode) => void;
  clearActiveTerritory: () => void;
} {
  const activeTerritory = useSyncExternalStore(
    locationContextStore.subscribe.bind(locationContextStore),
    locationContextStore.getActiveTerritory.bind(locationContextStore),
  ) as ActiveTerritory;

  const territoryMode = useSyncExternalStore(
    locationContextStore.subscribe.bind(locationContextStore),
    locationContextStore.getTerritoryMode.bind(locationContextStore),
  ) as TerritoryMode;

  return {
    activeTerritory,
    activeLocation: activeTerritory?.location ?? null,
    territoryMode,
    setActiveLocation: (location) => locationContextStore.setActiveLocation(location),
    setTerritoryMode: (mode) => locationContextStore.setTerritoryMode(mode),
    clearActiveTerritory: () => locationContextStore.clearActiveTerritory(),
  };
}
