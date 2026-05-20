import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addBusinessFavorite,
  getUserBusinessFavorites,
  isBusinessFavorited,
  removeBusinessFavorite,
  toggleBusinessFavorite,
} from "@/core/favorites/services";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";

const favoriteKeys = {
  all: (profileId: string) =>
    ["business-favorites", "all", profileId] as const,
  check: (businessId: string, profileId: string) =>
    ["business-favorites", "check", businessId, profileId] as const,
};

export function useBusinessFavorite(businessId: string | undefined) {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const profileId = activeProfile?.id;

  const { data: isFavorite = false } = useQuery({
    queryKey: favoriteKeys.check(businessId || "", profileId || ""),
    queryFn: async () => {
      if (!profileId || !businessId) return false;
      return await isBusinessFavorited(businessId, profileId);
    },
    enabled: !!profileId && !!businessId,
    staleTime: 30 * 1000,
  });

  const { mutateAsync: toggleFavoriteMutation, isPending: loading } =
    useMutation({
      mutationFn: async () => {
        if (!profileId || !businessId) {
          throw new Error("Profile ou business nao disponivel");
        }

        return await toggleBusinessFavorite(businessId, profileId);
      },
      onSuccess: (nextIsFavorite) => {
        if (!profileId || !businessId) return;

        queryClient.setQueryData(
          favoriteKeys.check(businessId, profileId),
          nextIsFavorite,
        );
        queryClient.setQueryData<string[]>(
          favoriteKeys.all(profileId),
          (current = []) => {
            if (nextIsFavorite) {
              return current.includes(businessId)
                ? current
                : [...current, businessId];
            }

            return current.filter((id) => id !== businessId);
          },
        );

        toast.success(
          nextIsFavorite
            ? "Adicionado aos favoritos ❤️"
            : "Removido dos favoritos",
        );
      },
      onError: (error) => {
        logger.error("Error toggling favorite:", error);
        toast.error("Erro ao atualizar favorito");
      },
    });

  const toggleFavorite = () => {
    if (!profileId) {
      toast.error("Faca login para favoritar");
      return;
    }

    void toggleFavoriteMutation();
  };

  return {
    isFavorite,
    toggleFavorite,
    loading,
  };
}

export function useBusinessFavorites() {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const profileId = activeProfile?.id;

  const {
    data: favorites = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: favoriteKeys.all(profileId || ""),
    queryFn: async () => {
      if (!profileId) return [];
      return await getUserBusinessFavorites(profileId);
    },
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });

  const { mutateAsync: addFavoriteMutation } = useMutation({
    mutationFn: async (businessId: string) => {
      if (!activeProfile?.id) {
        throw new Error("Faca login para favoritar");
      }

      await addBusinessFavorite(businessId, activeProfile.id);
    },
    onSuccess: (_, businessId) => {
      if (!profileId) return;

      queryClient.setQueryData<string[]>(
        favoriteKeys.all(profileId),
        (current = []) =>
          current.includes(businessId) ? current : [...current, businessId],
      );
      queryClient.setQueryData(
        favoriteKeys.check(businessId, profileId),
        true,
      );
      toast.success("Adicionado aos favoritos");
    },
    onError: (error: { code?: string } | Error) => {
      logger.error("Error add favorito:", error);

      if ("code" in error && error.code === "23505") {
        toast.info("Ja esta nos favoritos");
      } else {
        toast.error("Erro ao adicionar favorito");
      }
    },
  });

  const { mutateAsync: removeFavoriteMutation } = useMutation({
    mutationFn: async (businessId: string) => {
      if (!activeProfile?.id) {
        throw new Error("Profile nao disponivel");
      }

      await removeBusinessFavorite(businessId, activeProfile.id);
    },
    onSuccess: (_, businessId) => {
      if (!profileId) return;

      queryClient.setQueryData<string[]>(
        favoriteKeys.all(profileId),
        (current = []) => current.filter((id) => id !== businessId),
      );
      queryClient.setQueryData(
        favoriteKeys.check(businessId, profileId),
        false,
      );
      toast.success("Removido dos favoritos");
    },
    onError: (error) => {
      logger.error("Error remove favorito:", error);
      toast.error("Erro ao remover favorito");
    },
  });

  const addFavorite = async (businessId: string) => {
    await addFavoriteMutation(businessId);
  };

  const removeFavorite = async (businessId: string) => {
    await removeFavoriteMutation(businessId);
  };

  const isFavorite = (businessId: string) => favorites.includes(businessId);

  const toggleFavorite = async (businessId: string) => {
    if (isFavorite(businessId)) {
      await removeFavorite(businessId);
      return;
    }

    await addFavorite(businessId);
  };

  return {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refetch,
  };
}
