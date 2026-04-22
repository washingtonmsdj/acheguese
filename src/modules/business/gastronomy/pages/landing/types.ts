/**
 * Types especificos da Landing Page de Gastronomia
 */

import type { GastronomyBusiness, PublicGastronomyFoodItem } from '../../types';

export type DisplayLayout = 'grid' | 'list';

export interface BusinessSectionItems {
  nearest: GastronomyBusiness[];
  topRated: GastronomyBusiness[];
  featured: GastronomyBusiness[];
}

export interface FoodSectionItems {
  mostOrdered: PublicGastronomyFoodItem[];
  topRated: PublicGastronomyFoodItem[];
}
