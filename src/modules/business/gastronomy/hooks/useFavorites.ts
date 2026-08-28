import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  FavoritesQueryService,
  type UpdateFavoritePreferencesInput,
} from '@/core/business/services/gastronomy.favorites.queries';
import { businessFavoriteKeys } from '@/core/favorites/businessFavoriteKeys';
import { useSessionContext } from '@/core/session';
import { isValidUUID } from '@/shared/utils/validation';

const gastronomyFavoriteKeys = {
  details: (
    userId: string,
    input: { limit?: number; offset?: number } = {},
  ) =>
    [
      ...businessFavoriteKeys.records(userId, input),
      'gastronomy-details',
    ] as const,
};

export function useUserFavorites(params: {
  userId: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: gastronomyFavoriteKeys.details(params.userId, params),
    queryFn: () =>
      FavoritesQueryService.getCurrentUserFavorites({
        limit: params.limit,
        offset: params.offset,
      }),
    enabled: params.enabled !== false && !!params.userId,
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
}

export function useIsFavorited(params: {
  userId: string;
  businessId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: businessFavoriteKeys.status(params.userId, params.businessId),
    queryFn: () => FavoritesQueryService.isBusinessFavorited(params.businessId),
    enabled:
      params.enabled !== false &&
      !!params.userId &&
      isValidUUID(params.businessId),
    staleTime: 60 * 1000,
  });
}

export function useBusinessFavoritesCount(
  businessId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: businessFavoriteKeys.count(businessId),
    queryFn: () => FavoritesQueryService.getBusinessFavoritesCount(businessId),
    enabled: options?.enabled !== false && isValidUUID(businessId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSetFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      userId: string;
      businessId: string;
      favorited: boolean;
    }) => FavoritesQueryService.setFavorite(params.businessId, params.favorited),
    onMutate: async (variables) => {
      const statusKey = businessFavoriteKeys.status(
        variables.userId,
        variables.businessId,
      );
      await queryClient.cancelQueries({ queryKey: statusKey });
      const previousValue = queryClient.getQueryData<boolean>(statusKey);
      queryClient.setQueryData(statusKey, variables.favorited);
      return { previousValue, statusKey };
    },
    onSuccess: (favorited, variables) => {
      queryClient.setQueryData(
        businessFavoriteKeys.status(variables.userId, variables.businessId),
        favorited,
      );
      queryClient.invalidateQueries({ queryKey: businessFavoriteKeys.all });
      toast.success(
        favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos',
      );
    },
    onError: (error, _variables, context) => {
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(context.statusKey, context.previousValue);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar favoritos. Tente novamente.',
      );
    },
  });
}

export function useUpdateFavoritePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      favoriteId: string;
      input: UpdateFavoritePreferencesInput;
    }) =>
      FavoritesQueryService.updateFavoritePreferences(
        params.favoriteId,
        params.input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessFavoriteKeys.all });
      toast.success('Preferencias atualizadas');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar preferencias. Tente novamente.',
      );
    },
  });
}

export function useFavoritesManager(businessId?: string) {
  const { user } = useSessionContext();
  const userId = user?.id ?? '';

  const favorites = useUserFavorites({ userId, enabled: !!userId });
  const favoriteState = useIsFavorited({
    userId,
    businessId: businessId ?? '',
    enabled: !!userId && !!businessId,
  });
  const favoritesCount = useBusinessFavoritesCount(businessId ?? '', {
    enabled: !!businessId,
  });
  const setFavorite = useSetFavorite();
  const updatePreferences = useUpdateFavoritePreferences();

  const handleToggle = async () => {
    if (!userId || !businessId) {
      toast.error('Faca login para adicionar favoritos');
      return;
    }

    await setFavorite.mutateAsync({
      userId,
      businessId,
      favorited: !(favoriteState.data ?? false),
    });
  };

  return {
    favorites: favorites.data ?? [],
    isFavorited: favoriteState.data ?? false,
    favoritesCount: favoritesCount.data ?? 0,
    isLoadingFavorites: favorites.isLoading,
    isCheckingFavorited: favoriteState.isLoading,
    isLoadingCount: favoritesCount.isLoading,
    toggleFavorite: handleToggle,
    updatePreferences: updatePreferences.mutateAsync,
    isToggling: setFavorite.isPending,
    isUpdatingPreferences: updatePreferences.isPending,
    user,
    isAuthenticated: !!user,
  };
}
