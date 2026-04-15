import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { SocialInteractionsService } from "@/core/social/services/SocialInteractionsService"; // ✅ SSOT

/**
 * Hook for sistema de seguir usuários
 *
 * Funcionalidades:
 * - followUser / unfollowUser: Seguir/deixar de seguir
 * - isFollowing: Verificar se está seguindo
 * - followedUsers: Lista de IDs seguidos (para boost no feed)
 */
export function useFollowUser(targetUserId?: string) {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const { data: isFollowing, isLoading } = useQuery({
    queryKey: ["is-following", targetUserId],
    queryFn: () =>
      SocialInteractionsService.isFollowingUser(
        activeProfile!.id,
        targetUserId!,
      ),
    enabled: !!user && !!activeProfile && !!targetUserId,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user || !activeProfile) throw new Error("Usuário não autenticado");
      if (activeProfile.id === userId)
        throw new Error("Você não pode seguir a si mesmo");

      const result = await SocialInteractionsService.toggleFollowUser(
        activeProfile.id,
        userId,
      );
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result, userId) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", userId] });
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success(
        result.action === "follow"
          ? "Você está seguindo este usuário"
          : "Você deixou de seguir este usuário",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const { data: followedUsers } = useQuery({
    queryKey: ["followed-users", activeProfile?.id],
    queryFn: () =>
      SocialInteractionsService.getFollowedUserIds(activeProfile!.id),
    enabled: !!user && !!activeProfile,
  });

  return {
    isFollowing: isFollowing || false,
    isLoading,
    followUser: toggleFollowMutation.mutate,
    unfollowUser: toggleFollowMutation.mutate,
    isToggling: toggleFollowMutation.isPending,
    followedUsers: followedUsers || [],
  };
}
