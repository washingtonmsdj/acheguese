import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { BusinessFavoriteService } from '@/core/business/services/BusinessFavoriteService';
import { businessFavoriteKeys } from '@/core/favorites/businessFavoriteKeys';
import { logger } from '@/shared/utils/logger';

export function useCanonicalBusinessFavorite(
  businessDataId: string | undefined,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: isFavorite = false } = useQuery({
    queryKey: businessFavoriteKeys.status(userId || '', businessDataId || ''),
    queryFn: async () => {
      if (!businessDataId || !userId) return false;
      return BusinessFavoriteService.isFavorited(businessDataId);
    },
    enabled: Boolean(businessDataId && userId),
    staleTime: 30 * 1000,
  });

  const { mutateAsync: toggleMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!businessDataId || !userId) {
        throw new Error('Usuario ou empresa indisponivel para favorito');
      }

      return BusinessFavoriteService.setFavorite(businessDataId, !isFavorite);
    },
    onSuccess: (nextIsFavorite) => {
      if (!businessDataId || !userId) return;

      queryClient.setQueryData(
        businessFavoriteKeys.status(userId, businessDataId),
        nextIsFavorite,
      );
      queryClient.setQueryData<string[]>(
        businessFavoriteKeys.ids(userId, [businessDataId]),
        (current = []) => {
          if (nextIsFavorite) {
            return current.includes(businessDataId)
              ? current
              : [...current, businessDataId];
          }

          return current.filter((id) => id !== businessDataId);
        },
      );
      queryClient.invalidateQueries({ queryKey: businessFavoriteKeys.all });

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

export function useCanonicalBusinessFavorites(businessDataIds: string[] = []) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const {
    data: favorites = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: businessFavoriteKeys.ids(userId || '', businessDataIds),
    queryFn: async () => {
      if (!userId) return [];
      return BusinessFavoriteService.getFavoriteIdsForBusinesses(businessDataIds);
    },
    enabled: Boolean(userId && businessDataIds.length > 0),
    staleTime: 60 * 1000,
  });

  const { mutateAsync: toggleMutation, isPending } = useMutation({
    mutationFn: async (businessDataId: string) => {
      if (!userId) {
        throw new Error('Faca login para favoritar');
      }

      return BusinessFavoriteService.setFavorite(
        businessDataId,
        !favorites.includes(businessDataId),
      );
    },
    onSuccess: (nextIsFavorite, businessDataId) => {
      if (!userId) return;

      queryClient.setQueryData<string[]>(
        businessFavoriteKeys.ids(userId, businessDataIds),
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
        businessFavoriteKeys.status(userId, businessDataId),
        nextIsFavorite,
      );
      queryClient.invalidateQueries({ queryKey: businessFavoriteKeys.all });

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
