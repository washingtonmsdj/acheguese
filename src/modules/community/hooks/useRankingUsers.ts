import { useQuery } from "@tanstack/react-query";
import { RankingUser } from "@/modules/community/types";

/**
 * Hook for search ranking de vizinhos
 *
 * TODO: Implementar query real quando tabela de pontuação estiver pronta
 * Estrutura esperada: profiles com campo 'points' ou tabela separada 'user_points'
 */
export function useRankingUsers(limit: number = 3) {
  return useQuery({
    queryKey: ["ranking-users", limit],
    queryFn: async (): Promise<RankingUser[]> => {
      // TODO: Substituir por ranking centralizado via serviço SSOT de comunidade/perfis.

      // Retornar dados vazios até implementar
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}
