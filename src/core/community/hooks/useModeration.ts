import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
type ReportReason = string;
import { ModerationService } from "@/core/moderation";

interface ReportPostInput {
  postId: string;
  reason: ReportReason;
  description?: string;
}

interface ReportCommentInput {
  commentId: string;
  postId: string;
  reason: ReportReason;
  description?: string;
}

export function useModeration() {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason, description }: ReportPostInput) => {
      if (!user || !activeProfile) throw new Error("Usuário não autenticado");
      return await ModerationService.reportContent({
        targetType: "post",
        targetId: postId,
        reporterId: activeProfile.id,
        reason,
        details: description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      toast.success("Denúncia enviada. Nossa equipe irá revisar o conteúdo.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reportCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      _postId,
      reason,
      description,
    }: ReportCommentInput & { _postId?: string }) => {
      if (!user || !activeProfile) throw new Error("Usuário não autenticado");
      return await ModerationService.reportContent({
        targetType: "comment",
        targetId: commentId,
        reporterId: activeProfile.id,
        reason,
        details: description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Denúncia enviada. Nossa equipe irá revisar o conteúdo.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    reportPost: reportPostMutation.mutate,
    reportComment: reportCommentMutation.mutate,
    isReportingPost: reportPostMutation.isPending,
    isReportingComment: reportCommentMutation.isPending,
  };
}
