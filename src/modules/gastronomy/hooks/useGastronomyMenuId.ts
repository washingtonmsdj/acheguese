/**
 * useGastronomyMenuId
 *
 * Resolve o ID do menu principal de um negócio gastronômico.
 * O menu principal é o primeiro menu ativo, ordenado por display_order.
 *
 * SSOT: Delega para GastronomyFacade.queries.getMenusByBusiness (menu.queries.ts).
 * Componentes NÃO devem resolver o menuId manualmente.
 */

import { useQuery } from '@tanstack/react-query';
import { GastronomyFacade } from '../services';

const STALE_TIME = 5 * 60 * 1000; // 5 minutos — menus mudam raramente

export interface UseGastronomyMenuIdResult {
  menuId: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useGastronomyMenuId(businessId: string | undefined): UseGastronomyMenuIdResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gastronomy-menu-id', businessId],
    queryFn: async () => {
      const menus = await GastronomyFacade.queries.getMenusByBusiness(businessId!);
      // Retorna o ID do primeiro menu ativo (já ordenado por display_order no service)
      return menus[0]?.id ?? null;
    },
    enabled: !!businessId,
    staleTime: STALE_TIME,
  });

  return {
    menuId: data ?? null,
    isLoading,
    isError,
  };
}
