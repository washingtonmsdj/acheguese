import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSessionContext } from "@/core/session";
import { ClassifiedFavoriteService } from "@/core/classifieds/services/ClassifiedFavoriteService";

export function useClassifiedFavorite(classifiedId: string | null | undefined) {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const profileId = activeProfile?.id ?? null;
  const queryKey = ["classified-favorite", profileId, classifiedId];

  const favoriteQuery = useQuery({
    queryKey,
    enabled: Boolean(profileId && classifiedId),
    queryFn: () => ClassifiedFavoriteService.isFavorite(classifiedId!),
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!classifiedId || !profileId) {
        throw new Error("Entre na sua conta para salvar favoritos.");
      }

      const currentlyFavorite = Boolean(favoriteQuery.data);
      if (currentlyFavorite) {
        await ClassifiedFavoriteService.removeFavorite(classifiedId);
        return false;
      }

      await ClassifiedFavoriteService.addFavorite(classifiedId);
      return true;
    },
    onSuccess: (nextValue) => {
      queryClient.setQueryData(queryKey, nextValue);
      void queryClient.invalidateQueries({ queryKey: ["classified-favorite", profileId] });
      void queryClient.invalidateQueries({ queryKey: ["classified-favorites", profileId] });
    },
  });

  return {
    canFavorite: Boolean(profileId),
    isFavorite: Boolean(favoriteQuery.data),
    isLoading: favoriteQuery.isLoading,
    isPending: toggleMutation.isPending,
    toggleFavorite: toggleMutation.mutateAsync,
  };
}
