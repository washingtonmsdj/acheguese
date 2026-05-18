import { useInfiniteQuery } from "@tanstack/react-query";
import { ProfessionalFacade } from "@/core/professional/services";
import { useServicesLocation } from "./useServicesLocation";
import type {
  Professional,
  ProfessionalFilters,
} from "@/core/professional/types";

interface UseProfessionalListProps {
  filters?: ProfessionalFilters;
  pageSize?: number;
  enabled?: boolean;
}

interface ProfessionalPage {
  professionals: Professional[];
  nextPage?: number;
}

interface UseProfessionalListReturn {
  professionals: Professional[];
  loading: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  refetch: () => void;
  totalCount: number;
  /** ID da localização ativa usada para filtrar a listagem */
  activeLocationId: string | null;
  /** Indica se a listagem está bloqueada por ausência de localização */
  isLocationRequired: boolean;
}

export function useProfessionalList({
  filters = {},
  pageSize = 12,
  enabled = true,
}: UseProfessionalListProps = {}): UseProfessionalListReturn {
  const { activeLocationId, hasActiveLocation } = useServicesLocation();

  // Listagem habilitada apenas com localização ativa
  const queryEnabled = enabled && hasActiveLocation;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<ProfessionalPage, Error>({
    // location_id incluído na query key para cache correto por localização
    queryKey: ["professionals", "list", activeLocationId, filters, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      return await ProfessionalFacade.queries.getProfessionalsList({
        pageParam: pageParam as number,
        category: filters.category,
        search: filters.search,
        // Parâmetro de localização passado para o service (preparado para backend)
        territory: activeLocationId
          ? { scope: "location", location_id: activeLocationId }
          : undefined,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const professionals = data?.pages.flatMap((page) => page.professionals) ?? [];

  return {
    professionals,
    loading: isLoading,
    error: error as Error | null,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    totalCount: professionals.length,
    activeLocationId,
    isLocationRequired: !hasActiveLocation,
  };
}
