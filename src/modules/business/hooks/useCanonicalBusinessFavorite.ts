import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { BusinessFavoriteService } from '@/core/business/services/BusinessFavoriteService';
import { logger } from '@/shared/utils/logger';

const favoriteKeys = {
  all: (userId: string) =>
    ['business-favorite', 'canonical-all', userId] as const,
  check: (businessDataId: string, userId: string) =>
    ['business-favorite', 'canonical-check', businessDataId, userId] as const,
};

export function useCanonicalBusinessFavorite(
  businessDataId: string | undefined,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: isFavorite = false } = useQuery({
    queryKey: favoriteKeys.check(businessDataId || '', userId || ''),
    queryFn: async () => {
      if (!businessDataId || !userId) return false;
      return BusinessFavoriteService.isFavoritedByUser(businessDataId, userId);
    },
    enabled: Boolean(businessDataId && userId),
    staleTime: 30 * 1000,
  });

  const { mutateAsync: toggleMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!businessDataId || !userId) {
        throw new Error('Usuario ou empresa indisponivel para favorito');
      }

      return BusinessFavoriteService.toggleFavorite(businessDataId, userId);
    },
    onSuccess: (nextIsFavorite) => {
      if (!businessDataId || !userId) return;

      queryClient.setQueryData(
        favoriteKeys.check(businessDataId, userId),
        nextIsFavorite,
      );
      queryClient.setQueryData<string[]>(
        favoriteKeys.all(userId),
        (current = []) => {
          if (nextIsFavorite) {
            return current.includes(businessDataId)
              ? current
              : [...current, businessDataId];
          }

          return current.filter((id) => id !== businessDataId);
        },
      );
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'favorites', 'user', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'favorites', 'count', businessDataId],
      });

      toast.success(
        nextIsFavorite
          ? 'Adicionado aos favoritos'
          : 'Removido dos favoritos',
      );
    },
    onError: (error) => {
      logger.error('[useCanonicalBusinessFavorite] Error toggling favorite', error);
      toast.error('Erro ao atualizar favorito');
    },
  });

  const toggleFavorite = async (): Promise<boolean | null> => {
    if (!userId) {
      toast.error('Faca login para favoritar');
      return null;
    }

    return toggleMutation();
  };

  return {
    isFavorite,
    toggleFavorite,
    loading: isPending,
  };
}

export function useCanonicalBusinessFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const {
    data: favorites = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: favoriteKeys.all(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return BusinessFavoriteService.getUserFavoriteBusinessIds(userId);
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const { mutateAsync: toggleMutation, isPending } = useMutation({
    mutationFn: async (businessDataId: string) => {
      if (!userId) {
        throw new Error('Faca login para favoritar');
      }

      return BusinessFavoriteService.toggleFavorite(businessDataId, userId);
    },
    onSuccess: (nextIsFavorite, businessDataId) => {
      if (!userId) return;

      queryClient.setQueryData<string[]>(
        favoriteKeys.all(userId),
        (current = []) => {
          if (nextIsFavorite) {
            return current.includes(businessDataId)
              ? current
              : [...current, businessDataId];
          }

          return current.filter((id) => id !== businessDataId);
        },
      );
      queryClient.setQueryData(
        favoriteKeys.check(businessDataId, userId),
        nextIsFavorite,
      );
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'favorites', 'count', businessDataId],
      });

      toast.success(
        nextIsFavorite
          ? 'Adicionado aos favoritos'
          : 'Removido dos favoritos',
      );
    },
    onError: (error) => {
      logger.error('[useCanonicalBusinessFavorites] Error toggling favorite', error);
      toast.error('Erro ao atualizar favorito');
    },
  });

  const isFavorite = (businessDataId: string | undefined) =>
    Boolean(businessDataId && favorites.includes(businessDataId));

  const toggleFavorite = async (businessDataId: string) => {
    if (!userId) {
      toast.error('Faca login para favoritar');
      return null;
    }

    return toggleMutation(businessDataId);
  };

  return {
    favorites,
    loading: isLoading || isFetching || isPending,
    isFavorite,
    toggleFavorite,
    refetch,
  };
}
