/**
 * useClassificadoDetail - Hook para buscar detalhes de um classificado
 *
 * ✅ SSOT compliant:
 * - Usa ClassifiedsFacade
 * - TanStack Query para cache
 * - Mapper centralizado para transformação de dados
 * - Tipagem correta
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade, mapToClassificadoWithVendedor } from "@/modules/classifieds/services";
import type { ClassificadoWithVendedor } from "./useClassificados";

export function useClassificadoDetail(id: string) {
  const query = useQuery<ClassificadoWithVendedor | null>({
    queryKey: ["classificado", id],
    queryFn: async () => {
      const data = await ClassifiedsFacade.queries.getClassifiedById(id);

      if (!data) return null;

      return mapToClassificadoWithVendedor(data);
    },
    enabled: !!id,
  });

  return {
    classificado: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
