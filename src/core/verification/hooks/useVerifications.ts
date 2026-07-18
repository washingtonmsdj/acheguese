import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { VerificationAdminService } from "@/core/verification/services/VerificationAdminService";
import { logger } from "@/shared/utils/logger";

const QUERY_ROOT = ["profile-verifications"] as const;
const queryKey = (status: string) => [...QUERY_ROOT, status] as const;

const RELATED_QUERY_KEYS = [
  ["resident-verification"],
  ["profile-hub"],
  ["profile"],
  ["profiles"],
  ["user-territory-resolved"],
] as const;

export function useVerifications() {
  const queryClient = useQueryClient();
  const invalidateVerificationReads = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_ROOT });
    RELATED_QUERY_KEYS.forEach((key) => {
      void queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: queryKey("pending"),
    queryFn: () => VerificationAdminService.list("pending"),
  });
  const { data: approved = [], isLoading: loadingApproved } = useQuery({
    queryKey: queryKey("approved"),
    queryFn: () => VerificationAdminService.list("approved"),
  });
  const { data: rejected = [], isLoading: loadingRejected } = useQuery({
    queryKey: queryKey("rejected"),
    queryFn: () => VerificationAdminService.list("rejected"),
  });
  const { data: revoked = [], isLoading: loadingRevoked } = useQuery({
    queryKey: queryKey("revoked"),
    queryFn: () => VerificationAdminService.list("revoked"),
  });
  const { data: stats } = useQuery({
    queryKey: queryKey("stats"),
    queryFn: () => VerificationAdminService.getStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (verificationId: string) =>
      VerificationAdminService.review(verificationId, "approve"),
    onSuccess: async () => {
      await invalidateVerificationReads();
      toast.success("Verificacao aprovada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar verificacao");
      logger.error(error instanceof Error ? error.message : String(error));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      verificationId,
      reason,
    }: {
      verificationId: string;
      reason: string;
    }) => VerificationAdminService.review(verificationId, "reject", reason),
    onSuccess: async () => {
      await invalidateVerificationReads();
      toast.success("Verificacao rejeitada");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar verificacao");
      logger.error(error instanceof Error ? error.message : String(error));
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({
      verificationId,
      reason,
    }: {
      verificationId: string;
      reason: string;
    }) => VerificationAdminService.review(verificationId, "revoke", reason),
    onSuccess: async () => {
      await invalidateVerificationReads();
      toast.success("Verificacao revogada");
    },
    onError: (error) => {
      toast.error("Erro ao revogar verificacao");
      logger.error(error instanceof Error ? error.message : String(error));
    },
  });

  return {
    pending,
    approved,
    rejected,
    revoked,
    stats,
    loadingPending,
    loadingApproved,
    loadingRejected,
    loadingRevoked,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isRevoking: revokeMutation.isPending,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    revoke: revokeMutation.mutate,
  };
}
