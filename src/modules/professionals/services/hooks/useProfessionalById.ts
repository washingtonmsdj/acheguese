import { useQuery } from "@tanstack/react-query";
import { ProfessionalFacade } from "@/core/professional/services";
import type { Professional } from "@/core/professional/types";

interface UseProfessionalByIdProps {
  id: string;
  enabled?: boolean;
}

interface UseProfessionalByIdReturn {
  professional: Professional | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfessionalById({
  id,
  enabled = true,
}: UseProfessionalByIdProps): UseProfessionalByIdReturn {
  const {
    data: professional,
    error,
    isLoading,
    refetch,
  } = useQuery<Professional | null, Error>({
    queryKey: ["professional", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do profissional é obrigatório");
      return await ProfessionalFacade.queries.getProfessionalById(id);
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes("não encontrado")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    professional: professional ?? null,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
