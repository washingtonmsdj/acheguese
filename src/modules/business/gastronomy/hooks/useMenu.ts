/**
 * Hook para cardápio completo
 *
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';

export function useMenu(menuId?: string) {
  return useQuery({
    queryKey: ['menu', 'detail', menuId],
    queryFn: () => GastronomyFacade.queries.getMenuWithCategories(menuId!),
    enabled: !!menuId,
  });
}

export function useMenusByBusiness(businessId?: string) {
  return useQuery({
    queryKey: ['menu', 'list', businessId],
    queryFn: () => GastronomyFacade.queries.getMenusByBusiness(businessId!),
    enabled: !!businessId,
  });
}

export function useFeaturedItems(businessId?: string, limit?: number) {
  return useQuery({
    queryKey: ['menu', 'featured', businessId, limit],
    queryFn: () => GastronomyFacade.queries.getFeaturedMenuItems(businessId!),
    enabled: !!businessId,
  });
}

export function useActivePromotions(businessId?: string) {
  return useQuery({
    queryKey: ['menu', 'promotions', businessId],
    queryFn: () => GastronomyFacade.queries.getActiveMenuPromotions(businessId!),
    enabled: !!businessId,
  });
}
