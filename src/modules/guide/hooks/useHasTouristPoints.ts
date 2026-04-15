/**
 * useHasTouristPoints — Verifica se o território tem pontos turísticos publicados
 *
 * Usado pela sidebar para exibir/ocultar o item de navegação condicionalmente.
 */

import { useTouristPointsCount } from './useTouristPoints';
import type { TerritoryFilter } from '@/core/location/types';

export function useHasTouristPoints(filter: TerritoryFilter): boolean {
  const { data: count = 0 } = useTouristPointsCount(filter);
  return count > 0;
}
