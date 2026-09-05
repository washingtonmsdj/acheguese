import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import type { CommunityReportReason } from "@/core/moderation";
import { communityReportService } from "@/core/community/moderation";
import { communityFeedQueryKeys } from "@/core/feed";

interface ReportPostInput {
  postId: string;
  reason: CommunityReportReason;
  description?: string;
}

interface ReportCommentInput {
  commentId: string;
  postId: string;
  reason: CommunityReportReason;
  description?: string;
}

export function useModeration() {
  const { user, activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const reportPostMutation = useMutation({
    mutationFn: async ({ postId, reason, description }: ReportPostInput) => {
      if (!user || !activeProfile) throw new Error("Usuário não autenticado");
      return await communityReportService.report({
        targetType: "post",
        targetId: postId,
        reason,
        details: description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });
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
      return await communityReportService.report({
        targetType: "comment",
        targetId: commentId,
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
    reportPostAsync: reportPostMutation.mutateAsync,
    reportComment: reportCommentMutation.mutate,
    reportCommentAsync: reportCommentMutation.mutateAsync,
    isReportingPost: reportPostMutation.isPending,
    isReportingComment: reportCommentMutation.isPending,
  };
}
