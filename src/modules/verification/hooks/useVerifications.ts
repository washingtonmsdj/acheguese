/**
 * useVerifications - Hook para gerenciar verificações
 * 
 * Integra com VerificationService (SSOT)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VerificationService } from "../services/VerificationService";

const QUERY_KEYS = {
  pending: ["verifications", "pending"] as const,
  verified: ["verifications", "verified"] as const,
  stats: ["verifications", "stats"] as const,
};

export function useVerifications() {
  const queryClient = useQueryClient();

  // Query: pending verifications
  const {
    data: pending = [],
    isLoading: loadingPending,
    refetch: refetchPending,
  } = useQuery({
    queryKey: QUERY_KEYS.pending,
    queryFn: () => VerificationService.getPendingVerifications(),
  });

  // Query: verified profiles
  const {
    data: verified = [],
    isLoading: loadingVerified,
  } = useQuery({
    queryKey: QUERY_KEYS.verified,
    queryFn: () => VerificationService.getVerifiedProfiles(),
  });

  // Query: stats
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: () => VerificationService.getVerificationStats(),
  });

  // Mutation: approve
  const approveMutation = useMutation({
    mutationFn: (profileId: string) => VerificationService.approveVerification(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verified });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificação aprovada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar verificação");
      console.error(error);
    },
  });

  // Mutation: reject
  const rejectMutation = useMutation({
    mutationFn: ({ profileId, reason }: { profileId: string; reason?: string }) =>
      VerificationService.rejectVerification(profileId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificação rejeitada");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar verificação");
      console.error(error);
    },
  });

  // Mutation: revoke
  const revokeMutation = useMutation({
    mutationFn: (profileId: string) => VerificationService.revokeVerification(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.verified });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      toast.success("Verificação revogada");
    },
    onError: (error) => {
      toast.error("Erro ao revogar verificação");
      console.error(error);
    },
  });

  return {
    // Data
    pending,
    verified,
    stats,

    // Loading states
    loadingPending,
    loadingVerified,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRevoking: revokeMutation.isPending,

    // Actions
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    revoke: revokeMutation.mutate,
    refetchPending,
  };
}
