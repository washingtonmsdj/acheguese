/**
 * useTerritoryLabels
 *
 * Hook para obter labels contextuais baseados no território ativo.
 * Usa ResolvedTerritory para determinar o nível territorial e gerar textos apropriados.
 *
 * SSOT: Toda linguagem contextual de território deve vir deste hook.
 */

import { useMemo } from 'react';
import { getTerritoryLabels, getCategoryDescription } from '../utils/territoryLabels';
import type { TerritoryLabels } from '../utils/territoryLabels';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export function useTerritoryLabels(resolved: ResolvedTerritory | null | undefined): TerritoryLabels {
  return useMemo(() => getTerritoryLabels(resolved), [resolved]);
}

export { getCategoryDescription };
