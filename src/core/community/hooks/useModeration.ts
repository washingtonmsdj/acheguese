import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { ReportReason } from "@/core/community/types";
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
      if (!user || !activeProfile) throw new Error("UsuÃ¡rio nÃ£o autenticado");
      return await ModerationService.reportContent({
        targetType: "post",
        targetId: postId,
        reporterId: activeProfile.id,
        reason,
        details: description,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["community-feed"] });
      if (data.reportCount >= 5) {
        toast.success(
          "DenÃºncia enviada. O post foi ocultado automaticamente devido ao nÃºmero de denÃºncias.",
        );
      } else {
        toast.success("DenÃºncia enviada. Nossa equipe irÃ¡ revisar o conteÃºdo.");
      }
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
      if (!user || !activeProfile) throw new Error("UsuÃ¡rio nÃ£o autenticado");
      return await ModerationService.reportContent({
        targetType: "comment",
        targetId: commentId,
        reporterId: activeProfile.id,
        reason,
        details: description,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      if (data.reportCount >= 5) {
        toast.success(
          "DenÃºncia enviada. O comentÃ¡rio foi ocultado automaticamente.",
        );
      } else {
        toast.success("DenÃºncia enviada. Nossa equipe irÃ¡ revisar o conteÃºdo.");
      }
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

