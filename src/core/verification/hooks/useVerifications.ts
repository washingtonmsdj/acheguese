/**
 * useVerifications - Hook canonic para moderacao de verificacoes.
 */
import { logger } from "@/shared/utils/logger";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileVerificationAdminService } from "@/core/profiles/services/ProfileVerificationAdminService";

const QUERY_KEYS = {
  pending: ["verifications", "pending"] as const,
  verified: ["verifications", "verified"] as const,
  stats: ["verifications", "stats"] as const,
};

export function useVerifications() {
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: QUERY_KEYS.pending,
    queryFn: () => ProfileVerificationAdminService.getPendingVerifications(),
  });

  const { data: verified = [], isLoading: loadingVerified } = useQuery({
    queryKey: QUERY_KEYS.verified,
    queryFn: () => ProfileVerificationAdminService.getVerifiedProfiles(),
  });

  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: () => ProfileVerificationAdminService.getVerificationStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) => ProfileVerificationAdminService.approveVerification(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verified });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificacao aprovada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar verificacao");
      logger.error(error);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ profileId, reason }: { profileId: string; reason?: string }) =>
      ProfileVerificationAdminService.rejectVerification(profileId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificacao rejeitada");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar verificacao");
      logger.error(error);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (profileId: string) => ProfileVerificationAdminService.revokeVerification(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verified });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificacao revogada");
    },
    onError: (error) => {
      toast.error("Erro ao revogar verificacao");
      logger.error(error);
    },
  });

  return {
    pending,
    verified,
    stats,
    loadingPending,
    loadingVerified,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRevoking: revokeMutation.isPending,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    revoke: revokeMutation.mutate,
  };
}

