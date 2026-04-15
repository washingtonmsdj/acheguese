// @ts-nocheck
import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/core/profiles/services/types";

interface UseFavoritesResult {
  favorites: Business[];
  favoriteIds: string[];
  loading: boolean;
  toggleFavorite: (itemId: string, itemType: string) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
  fetchFavorites: () => void;
}

export function useFavorites(profileId?: string | null): UseFavoritesResult {
  const queryClient = useQueryClient();

  const { data: favorites = [], refetch, isLoading, isFetching } = useQuery<Business[]>({
    queryKey: ["profile", "business-favorites", profileId],
    queryFn: async () => {
      if (!profileId) {
        return [];
      }

      const favoriteIds = await BusinessService.getFavorites(profileId);
      if (favoriteIds.length === 0) {
        return [];
      }

      const businesses = await BusinessService.getBusinessesByIds(favoriteIds);
      const businessById = new Map(
        businesses.map((business) => [business.id, business]),
      );

      return favoriteIds
        .map((favoriteId) => businessById.get(favoriteId))
        .filter((business): business is Business => Boolean(business));
    },
    enabled: Boolean(profileId),
  });

  const favoriteIds = useMemo(
    () => favorites.map((favorite) => favorite.id),
    [favorites],
  );

  const fetchFavorites = useCallback(() => {
    void refetch();
  }, [refetch]);

  const toggleFavorite = useCallback(
    async (itemId: string, _itemType: string) => {
      if (!profileId) {
        return;
      }

      await BusinessService.toggleFavorite(itemId, profileId);
      await queryClient.invalidateQueries({
        queryKey: ["profile", "business-favorites"],
      });
    },
    [profileId, queryClient],
  );

  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.includes(itemId),
    [favoriteIds],
  );

  return {
    favorites,
    favoriteIds,
    loading: isLoading || isFetching,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
  };
}
