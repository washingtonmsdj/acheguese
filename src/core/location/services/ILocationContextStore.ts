/**
 * Location Context Store - Public Interface
 *
 * Gerencia o estado ativo de localização do usuário.
 * Separado de ILocationService (domínio).
 * 
 * REFATORADO: setActiveLocation agora aceita null.
 */

import type { ActiveTerritory, Location, LocationError, TerritoryMode } from '../types';

export interface ILocationContextStore {
  getActiveTerritory(): ActiveTerritory;
  getActiveLocation(): Location | null;
  getTerritoryMode(): TerritoryMode;
  setActiveLocation(location: Location | null): void; // Agora aceita null
  setTerritoryMode(mode: TerritoryMode): void;
  clearActiveTerritory(): void;
  subscribe(listener: () => void): () => void;
  getError(): LocationError | null;
}
