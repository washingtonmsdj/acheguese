import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/core/posts/services";
import { ModerationService } from "@/core/moderation/services/ModerationService";
import { ModerationAction } from "@/core/moderation/types";
import { useToast } from "@/shared/hooks/use-toast";
import { AuthService } from "@/core/auth/services/AuthService";

interface ModerationActionParams {
  targetType: "post" | "comment" | "user";
  targetId: string;
  action: ModerationAction;
  reason: string;
  evidence?: string[];
}

export function useModeration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const executeModerationMutation = useMutation({
    mutationFn: async (params: ModerationActionParams) => {
      const { targetType, targetId, action, reason } = params;

      // ✅ FASE 2: Usar AuthService.getAdminUserId() para contexto administrativo
      const adminUserId = await AuthService.getAdminUserId();

      // Execute action
      switch (action) {
        case "approve":
          await handleApprove(targetType, targetId);
          break;
        case "remove":
          await handleRemove(targetType, targetId, reason);
          break;
        case "hide":
          await handleHide(targetType, targetId);
          break;
        case "ban_author":
          await handleBanAuthor(targetType, targetId, reason);
          break;
        case "warn_author":
          await handleWarnAuthor(targetType, targetId, reason);
          break;
        case "reject":
          await handleReject(targetType, targetId);
          break;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-posts"] });
      queryClient.invalidateQueries({ queryKey: ["pending-comments"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-logs"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });

      toast({
        title: "Ação executada",
        description: `Ação de moderação "${variables.action}" executada com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error executar ação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  async function handleApprove(targetType: string, targetId: string) {
    // ✅ SSOT - Usar ModerationService
    const adminUserId = await AuthService.getAdminUserId();
    await ModerationService.updateReportStatus(
      targetType as "post" | "comment",
      targetId,
      "approved",
      adminUserId,
    );
  }

  async function handleRemove(
    targetType: string,
    targetId: string,
    reason: string,
  ) {
    // ✅ SSOT - Usar ModerationService e PostService
    const moderatorProfileId = await AuthService.getAdminUserId();

    if (targetType === "post") {
      await postService.removePost(targetId, reason, moderatorProfileId);
    } else if (targetType === "comment") {
      await ModerationService.removeComment(targetId);
    }

    await ModerationService.updateReportStatus(
      targetType as "post" | "comment",
      targetId,
      "removed",
      moderatorProfileId,
    );
  }

  async function handleHide(targetType: string, targetId: string) {
    // ✅ SSOT - Usar PostService e ModerationService
    const adminUserId = await AuthService.getAdminUserId();

    if (targetType === "post") {
      await postService.hidePost(targetId);
    }

    await ModerationService.updateReportStatus(
      targetType as "post" | "comment",
      targetId,
      "approved",
      adminUserId,
    );
  }

  async function handleBanAuthor(
    targetType: string,
    targetId: string,
    reason: string,
  ) {
    let authorProfileId: string | null = null;

    if (targetType === "post") {
      authorProfileId = await postService.getPostAuthorId(targetId);
    } else if (targetType === "comment") {
      // ✅ SSOT - Usar ModerationService
      authorProfileId = await ModerationService.getCommentAuthorId(targetId);
    }

    if (!authorProfileId) throw new Error("Autor não encontrado");

    const moderatorProfileId = await AuthService.getAdminUserId();

    // ✅ SSOT - Usar ModerationService.banUser
    await ModerationService.banUser(
      authorProfileId,
      moderatorProfileId,
      reason,
      true,
    );

    await handleRemove(targetType, targetId, reason);
  }

  async function handleWarnAuthor(
    targetType: string,
    targetId: string,
    reason: string,
  ) {
    let authorProfileId: string | null = null;

    if (targetType === "post") {
      authorProfileId = await postService.getPostAuthorId(targetId);
    } else if (targetType === "comment") {
      // ✅ SSOT - Usar ModerationService
      authorProfileId = await ModerationService.getCommentAuthorId(targetId);
    }

    if (!authorProfileId) throw new Error("Autor não encontrado");

    const moderatorProfileId = await AuthService.getAdminUserId();

    // ✅ SSOT - Usar ModerationService.warnUser
    await ModerationService.warnUser(
      authorProfileId,
      moderatorProfileId,
      reason,
      "medium",
    );

    await ModerationService.updateReportStatus(
      targetType as "post" | "comment",
      targetId,
      "approved",
      moderatorProfileId,
    );
  }

  async function handleReject(targetType: string, targetId: string) {
    // ✅ SSOT - Usar ModerationService
    const adminUserId = await AuthService.getAdminUserId();
    await ModerationService.updateReportStatus(
      targetType as "post" | "comment",
      targetId,
      "rejected",
      adminUserId,
    );
  }

  return {
    executeAction: executeModerationMutation.mutate,
    isExecuting: executeModerationMutation.isPending,
  };
}
