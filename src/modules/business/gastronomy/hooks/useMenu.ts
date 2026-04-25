/**
 * Hook para cardápio completo
 *
 * @version 2.0.0 - Atualizado para GastronomyFacade
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';
import {
  getMockMenuById,
  getMockMenusByBusinessId,
  getMockPromotionsByBusinessId,
  isGastronomyDevMockEnabled,
} from '../dev/devMockRuntime';

export function useMenu(menuId?: string) {
  const shouldUseDevMocks = isGastronomyDevMockEnabled();

  return useQuery({
    queryKey: ['menu', 'detail', menuId],
    queryFn: async () => {
      const menu = await GastronomyFacade.queries.getMenuWithCategories(menuId!);
      if (menu || !shouldUseDevMocks) {
        return menu;
      }

      return getMockMenuById(menuId!);
    },
    enabled: !!menuId,
  });
}

export function useMenusByBusiness(businessId?: string) {
  const shouldUseDevMocks = isGastronomyDevMockEnabled();

  return useQuery({
    queryKey: ['menu', 'list', businessId],
    queryFn: async () => {
      const menus = await GastronomyFacade.queries.getMenusByBusiness(businessId!);
      if (menus.length > 0 || !shouldUseDevMocks) {
        return menus;
      }

      return getMockMenusByBusinessId(businessId!);
    },
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
  const shouldUseDevMocks = isGastronomyDevMockEnabled();

  return useQuery({
    queryKey: ['menu', 'promotions', businessId],
    queryFn: async () => {
      const promotions = await GastronomyFacade.queries.getActiveMenuPromotions(businessId!);
      if (promotions.length > 0 || !shouldUseDevMocks) {
        return promotions;
      }

      return getMockPromotionsByBusinessId(businessId!);
    },
    enabled: !!businessId,
  });
}
