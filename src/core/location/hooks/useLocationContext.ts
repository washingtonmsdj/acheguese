/**
 * useLocationContext
 *
 * Hook canônico para acesso ao contexto territorial.
 * 
 * REFATORADO: Simplificado após correção de null handling no LocationContextStore.
 */

import { useActiveTerritory } from './useActiveTerritory';
import type { LocationContextValue } from '../types';

export function useLocationContext(): LocationContextValue {
  const { activeTerritory, activeLocation, setActiveLocation, clearActiveTerritory } =
    useActiveTerritory();

  return {
    activeTerritory,
    activeLocation,
    setActiveLocation, // Agora aceita null diretamente no store
    clearActiveTerritory,
    isLoading: false,
    error: null,
  };
}
