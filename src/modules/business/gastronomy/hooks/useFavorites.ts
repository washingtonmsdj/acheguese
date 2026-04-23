/**
 * useFavorites - Hook para gerenciar favoritos de gastronomia
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSessionContext } from '@/core/session';
import { isValidUUID } from '@/shared/utils/validation';
import {
  FavoritesQueryService,
  type FavoriteBusiness,
  type UpdateFavoritePreferencesInput,
} from '../services/favorites.queries';

const QUERY_KEYS = {
  userFavorites: (userId: string, limit?: number, offset?: number) => [
    'gastronomy',
    'favorites',
    'user',
    userId,
    limit ?? 50,
    offset ?? 0,
  ],
  isFavorited: (userId: string, businessId: string) => [
    'gastronomy',
    'favorites',
    'status',
    userId,
    businessId,
  ],
  businessFavoritesCount: (businessId: string) => [
    'gastronomy',
    'favorites',
    'count',
    businessId,
  ],
  favoritesByTags: (userId: string, tags: string[]) => [
    'gastronomy',
    'favorites',
    'tags',
    userId,
    ...tags,
  ],
};

/**
 * Hook para obter favoritos do usuário
 */
export function useUserFavorites(params: {
  userId: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.userFavorites(params.userId, params.limit, params.offset),
    queryFn: () => FavoritesQueryService.getUserFavorites(params),
    enabled: params.enabled !== false && !!params.userId,
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para verificar se negócio está nos favoritos
 */
export function useIsFavorited(params: {
  userId: string;
  businessId: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.isFavorited(params.userId, params.businessId),
    queryFn: () => FavoritesQueryService.isBusinessFavorited(params),
    enabled: params.enabled !== false && !!params.userId && isValidUUID(params.businessId),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obter contador de favoritos de um negócio
 */
export function useBusinessFavoritesCount(businessId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.businessFavoritesCount(businessId),
    queryFn: () => FavoritesQueryService.getBusinessFavoritesCount(businessId),
    enabled: isValidUUID(businessId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para toggle de favorito (adiciona ou remove)
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; businessId: string }) =>
      FavoritesQueryService.toggleFavorite(params),
    onMutate: async (variables) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
      });

      // Snapshot do valor anterior
      const previousValue = queryClient.getQueryData<boolean>(
        QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
      );

      // Atualização otimista
      queryClient.setQueryData(
        QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
        (old: boolean | undefined) => !old,
      );

      return { previousValue };
    },
    onSuccess: (isFavorited, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userFavorites(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.businessFavoritesCount(variables.businessId),
      });

      // Feedback ao usuário
      if (isFavorited) {
        toast.success('Adicionado aos favoritos!');
      } else {
        toast.success('Removido dos favoritos!');
      }
    },
    onError: (error, variables, context) => {
      // Reverter atualização otimista
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(
          QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
          context.previousValue,
        );
      }

      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar favoritos. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para adicionar aos favoritos
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; businessId: string }) =>
      FavoritesQueryService.addFavorite(params),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userFavorites(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.businessFavoritesCount(variables.businessId),
      });

      toast.success('Adicionado aos favoritos!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao adicionar favorito. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para remover dos favoritos
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; businessId: string }) =>
      FavoritesQueryService.removeFavorite(params),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userFavorites(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.isFavorited(variables.userId, variables.businessId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.businessFavoritesCount(variables.businessId),
      });

      toast.success('Removido dos favoritos!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao remover favorito. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para atualizar preferências de um favorito
 */
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
      // Invalidar favoritos do usuário
      queryClient.invalidateQueries({
        queryKey: ['gastronomy', 'favorites', 'user'],
      });

      toast.success('Preferências atualizadas!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar preferências. Tente novamente.',
      );
    },
  });
}

/**
 * Hook para buscar favoritos por tags
 */
export function useFavoritesByTags(params: {
  userId: string;
  tags: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.favoritesByTags(params.userId, params.tags),
    queryFn: () => FavoritesQueryService.searchFavoritesByTags(params),
    enabled: params.enabled !== false && !!params.userId && params.tags.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook completo para gerenciar favoritos
 */
export function useFavoritesManager(businessId?: string) {
  const { user } = useSessionContext();
  const userId = user?.id || '';

  const favorites = useUserFavorites({
    userId,
    enabled: !!userId,
  });

  const isFavorited = useIsFavorited({
    userId,
    businessId: businessId || '',
    enabled: !!userId && !!businessId,
  });

  const favoritesCount = useBusinessFavoritesCount(businessId || '');

  const toggleFavorite = useToggleFavorite();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const updatePreferences = useUpdateFavoritePreferences();

  const handleToggle = async () => {
    if (!userId || !businessId) {
      toast.error('Faça login para adicionar favoritos');
      return;
    }

    await toggleFavorite.mutateAsync({ userId, businessId });
  };

  return {
    // Data
    favorites: favorites.data || [],
    isFavorited: isFavorited.data || false,
    favoritesCount: favoritesCount.data || 0,

    // Loading states
    isLoadingFavorites: favorites.isLoading,
    isCheckingFavorited: isFavorited.isLoading,
    isLoadingCount: favoritesCount.isLoading,

    // Mutations
    toggleFavorite: handleToggle,
    addFavorite: addFavorite.mutateAsync,
    removeFavorite: removeFavorite.mutateAsync,
    updatePreferences: updatePreferences.mutateAsync,

    // Mutation states
    isToggling: toggleFavorite.isPending,
    isAdding: addFavorite.isPending,
    isRemoving: removeFavorite.isPending,
    isUpdatingPreferences: updatePreferences.isPending,

    // User context
    user,
    isAuthenticated: !!user,
  };
}
