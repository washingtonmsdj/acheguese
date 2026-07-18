/**
 * useGastronomyMenuId
 *
 * Resolve o ID do menu principal de um negócio gastronômico.
 * O menu principal é o primeiro menu ativo, ordenado por display_order.
 *
 * SSOT: Delega para GastronomyFacade.queries.getMenusByBusiness (menu.queries.ts).
 * Componentes NÃO devem resolver o menuId manualmente.
 */

import { useQuery } from "@tanstack/react-query";
import { GastronomyFacade } from "../services";
import { withTimeout } from "@/shared/utils/withTimeout";

const STALE_TIME = 5 * 60 * 1000; // 5 minutos — menus mudam raramente

export interface UseGastronomyMenuIdResult {
  menuId: string | null;
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}

export function useGastronomyMenuId(
  businessId: string | undefined,
): UseGastronomyMenuIdResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["gastronomy-menu-id", businessId],
    queryFn: async () => {
      const menus = await withTimeout(
        GastronomyFacade.queries.getMenusByBusiness(businessId!),
        {
          message: "A consulta do cardapio excedeu o tempo limite.",
          timeoutMs: 10_000,
        },
      );
      // Retorna o ID do primeiro menu ativo (já ordenado por display_order no service)
      return menus[0]?.id ?? null;
    },
    enabled: !!businessId,
    retry: 1,
    retryDelay: 750,
    staleTime: STALE_TIME,
  });

  return {
    menuId: data ?? null,
    isLoading,
    isError,
    retry: () => {
      void refetch();
    },
  };
}
