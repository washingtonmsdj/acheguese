import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { getCurrentUserBusinessFavorites } from "@/core/favorites/services/favorites.queries";
import { setBusinessFavorite } from "@/core/favorites/services/favorites.mutations";
import type { ProfileAssociatedBusiness } from "@/core/profiles/services/ProfileBusinessTypes";

interface UseFavoritesResult {
  favorites: ProfileAssociatedBusiness[];
  favoriteIds: string[];
  loading: boolean;
  toggleFavorite: (itemId: string, itemType: string) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
  fetchFavorites: () => void;
}

export function useFavorites(profileId?: string | null): UseFavoritesResult {
  const queryClient = useQueryClient();

  const { data: favorites = [], refetch, isLoading, isFetching } = useQuery<ProfileAssociatedBusiness[]>({
    queryKey: ["profile", "business-favorites", profileId],
    queryFn: async () => {
      if (!profileId) {
        return [];
      }

      const favoriteIds = await getCurrentUserBusinessFavorites();
      if (favoriteIds.length === 0) {
        return [];
      }

      const businesses = await BusinessService.getBusinessesByIds(favoriteIds);
      const businessById = new Map(
        businesses.map((business) => [business.id, business]),
      );

      return favoriteIds
        .map((favoriteId) => businessById.get(favoriteId))
        .filter(Boolean) as ProfileAssociatedBusiness[];
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

      await setBusinessFavorite(itemId, !favoriteIds.includes(itemId));
      await queryClient.invalidateQueries({
        queryKey: ["profile", "business-favorites"],
      });
    },
    [favoriteIds, profileId, queryClient],
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
