/**
 * createLandingFeaturedService
 *
 * Factory que retorna a implementação Supabase do serviço de featured.
 */

import { LandingFeaturedService } from './services/LandingFeaturedService';
import type { TerritoryFilter } from '@/core/location/types';
import type { TerritoryStats, FeaturedBusiness, FeaturedService, FeaturedClassified } from './services/LandingFeaturedService';

export interface ILandingFeaturedService {
  getFeaturedBusinesses(filter: TerritoryFilter, limit?: number): Promise<FeaturedBusiness[]> | FeaturedBusiness[];
  getFeaturedServices(filter: TerritoryFilter, limit?: number): Promise<FeaturedService[]> | FeaturedService[];
  getFeaturedClassifieds(filter: TerritoryFilter, limit?: number): Promise<FeaturedClassified[]> | FeaturedClassified[];
  getTerritoryStats(filter: TerritoryFilter): Promise<TerritoryStats> | TerritoryStats;
}

export function createLandingFeaturedService(): ILandingFeaturedService {
  return LandingFeaturedService;
}
