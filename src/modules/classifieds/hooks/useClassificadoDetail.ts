/**
 * useClassificadoDetail - Hook para buscar detalhes de um classificado
 *
 * ? SSOT compliant:
 * - Usa ClassifiedsService
 * - TanStack Query para cache
 * - Mapper centralizado para transformação de dados
 * - Tipagem correta
 */

import { useQuery } from "@tanstack/react-query";
import { ClassifiedsService, mapToClassificadoWithVendedor } from "@/core/classifieds/services";
import type { ClassificadoWithVendedor } from "@/core/classifieds/hooks/useClassificados";

export function useClassificadoDetail(id: string) {
  const query = useQuery<ClassificadoWithVendedor | null>({
    queryKey: ["classificado", id],
    queryFn: async () => {
      const data = await ClassifiedsService.queries.getClassifiedById(id);

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
