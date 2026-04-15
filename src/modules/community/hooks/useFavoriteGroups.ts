import { useQuery } from "@tanstack/react-query";
import { FavoriteGroup } from "@/modules/community/types";
import { useSessionContext } from "@/core/session";

/**
 * Hook for search grupos favoritos do usuário
 *
 * TODO: Implementar query real quando sistema de grupos estiver pronto
 * Estrutura esperada: tabela 'groups' e 'user_favorite_groups'
 * Quando implementar, usar FavoritesService para acesso ao banco
 */
export function useFavoriteGroups() {
  const { user, activeProfile } = useSessionContext();

  return useQuery({
    queryKey: ["favorite-groups", activeProfile?.id],
    queryFn: async (): Promise<FavoriteGroup[]> => {
      if (!activeProfile?.id) return [];

      // TODO: Substituir por query real usando FavoritesService
      // const favoriteGroups = await favoritesService.getFavoriteGroups(activeProfile.id);
      // return favoriteGroups;

      // Retornar dados vazios até implementar
      return [];
    },
    enabled: !!user && !!activeProfile?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}
