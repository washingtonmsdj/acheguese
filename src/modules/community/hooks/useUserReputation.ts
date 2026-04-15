import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services"; // ✅ SSOT
import { postService } from "@/core/posts/services"; // ✅ SSOT
/**
 * Hook for sistema de reputação
 *
 * Requirements:
 * - Requirement 8: Sistema de Reputação
 *
 * Funcionalidades:
 * - Buscar reputação de um usuário
 * - Atualizar reputação baseado em ações:
 *   - Post liked: +2 pontos
 *   - Comment liked: +1 ponto
 *   - Alert confirmed: +5 pontos (já implementado em useAlertConfirmations)
 */

export type ReputationAction =
  | "post_liked"
  | "comment_liked"
  | "alert_confirmed";

const REPUTATION_POINTS: Record<ReputationAction, number> = {
  post_liked: 2,
  comment_liked: 1,
  alert_confirmed: 5,
};

interface UpdateReputationParams {
  userId: string;
  action: ReputationAction;
}

export function useUserReputation(userId?: string) {
  const queryClient = useQueryClient();

  // Buscar reputação do usuário
  const { data: reputation, isLoading } = useQuery({
    queryKey: ["user-reputation", userId],
    queryFn: async () => {
      if (!userId) return 0;

      // ✅ MIGRADO - Buscar reputação usando ProfileService
      const profile = await profileService.getProfileById(userId);
      return profile?.reputation || 0;
    },
    enabled: !!userId,
  });

  // Atualizar reputação
  const updateReputationMutation = useMutation({
    mutationFn: async ({ userId, action }: UpdateReputationParams) => {
      const points = REPUTATION_POINTS[action];

      // ✅ SSOT — PostService gerencia incremento de reputação (inclui fallback RPC)
      await postService.incrementUserReputation(userId, points);

      return points;
    },
    onSuccess: (points, variables) => {
      // Invalidate cache de reputação
      queryClient.invalidateQueries({
        queryKey: ["user-reputation", variables.userId],
      });
    },
    onError: (error: Error) => {
      logger.error("Error update reputação:", error);
    },
  });

  return {
    reputation: reputation || 0,
    isLoading,
    updateReputation: updateReputationMutation.mutate,
    isUpdating: updateReputationMutation.isPending,
  };
}
