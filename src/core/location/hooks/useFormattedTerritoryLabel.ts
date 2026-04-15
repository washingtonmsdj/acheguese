/**
 * useFormattedTerritoryLabel
 * 
 * SSOT: Formata o label do seletor baseado no MODO TERRITORIAL do usuário.
 * 
 * REGRA FUNDAMENTAL:
 * - Seletor mostra o território do USUÁRIO, não o território da URL
 * - Modo "bairro" → Mostra o bairro do usuário
 * - Modo "cidade" → Mostra a cidade do usuário
 * - Visitante → Mostra o território da URL
 * 
 * Formato:
 * - Bairro: "Nome do Bairro (Cidade/UF)"
 * - Cidade: "Nome da Cidade/UF"
 * - Fallback: "Brasil"
 */

import { useMemo } from 'react';
import { useUserTerritory } from './useUserTerritory';
import { useActiveTerritory } from './useActiveTerritory';
import { TERRITORY_CONFIG } from '@/config/territory';

interface FormattedLabel {
  /** Label completo formatado */
  full: string;
  /** Label curto (apenas nome) */
  short: string;
  /** Subtítulo contextual */
  subtitle: string;
}

export function useFormattedTerritoryLabel(): FormattedLabel {
  const { homeDistrict, homeCity, hasHome } = useUserTerritory();
  const { territoryMode } = useActiveTerritory();

  return useMemo(() => {
    // Usuário cadastrado: usar território do usuário baseado no modo
    if (hasHome) {
      // Modo Bairro: mostrar bairro do usuário
      if (territoryMode === 'bairro' && homeDistrict) {
        const parts = homeDistrict.path.split('/').filter(Boolean);
        const state = parts[1]?.toUpperCase() || '';
        const cityName = homeCity?.name || '';
        
        return {
          full: `${homeDistrict.name} (${cityName}/${state})`,
          short: homeDistrict.name,
          subtitle: `${cityName}/${state}`,
        };
      }
      
      // Modo Cidade: mostrar cidade do usuário
      if (homeCity) {
        const parts = homeCity.path.split('/').filter(Boolean);
        const state = parts[1]?.toUpperCase() || '';
        
        return {
          full: `${homeCity.name}/${state}`,
          short: homeCity.name,
          subtitle: state,
        };
      }
    }
    
    // Visitante: fallback Brasil
    const fallbackName = TERRITORY_CONFIG.launch.name;
    return {
      full: fallbackName,
      short: fallbackName,
      subtitle: 'Selecione seu local',
    };
  }, [hasHome, territoryMode, homeDistrict, homeCity]);
}
