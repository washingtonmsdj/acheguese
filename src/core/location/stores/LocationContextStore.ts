/**
 * Location Context Store - In-Memory Implementation
 *
 * Única fonte de verdade territorial da aplicação.
 * Agora inclui TerritoryMode ('bairro' | 'cidade' | null).
 */

import type { ILocationContextStore } from '../services/ILocationContextStore';
import type { ActiveTerritory, Location, LocationError, TerritoryMode } from '../types';
import { LocationErrorCode } from '../types';

export class LocationContextStore implements ILocationContextStore {
  private activeTerritory: ActiveTerritory = null;
  private territoryMode: TerritoryMode = null;
  private error: LocationError | null = null;
  private listeners: Set<() => void> = new Set();

  getActiveTerritory(): ActiveTerritory {
    return this.activeTerritory;
  }

  getActiveLocation(): Location | null {
    if (!this.activeTerritory) return null;
    return this.activeTerritory.location;
  }

  getTerritoryMode(): TerritoryMode {
    return this.territoryMode;
  }

  setTerritoryMode(mode: TerritoryMode): void {
    this.territoryMode = mode;
    this.notify();
  }

  setActiveLocation(location: Location | null): void {
    // Permitir null para limpar território
    if (location === null) {
      this.clearActiveTerritory();
      return;
    }
    
    // Validar localização
    if (location.status !== 'active') {
      this.error = { 
        code: LocationErrorCode.LOCATION_INACTIVE, 
        message: `Location ${location.id} is not active` 
      };
      throw this.error;
    }
    
    // Definir território ativo
    this.error = null;
    this.activeTerritory = { type: 'location', location };
    this.notify();
  }

  clearActiveTerritory(): void {
    this.activeTerritory = null;
    this.territoryMode = null;
    this.error = null;
    this.notify();
  }

  getError(): LocationError | null {
    return this.error;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

// Singleton — única fonte de verdade territorial
export const locationContextStore = new LocationContextStore();
