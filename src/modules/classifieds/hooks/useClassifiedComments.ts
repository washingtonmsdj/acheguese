import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { classifiedCommentService } from "@/core/classifieds/services/ClassifiedCommentService";

export function useClassifiedComments(classifiedId?: string) {
  return useQuery({
    queryKey: ["classified-comments", classifiedId],
    queryFn: () => classifiedCommentService.listByClassifiedId(classifiedId!),
    enabled: Boolean(classifiedId),
  });
}

export function useCreateClassifiedComment(classifiedId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { authorProfileId: string; content: string }) =>
      classifiedCommentService.create({
        classifiedId: classifiedId!,
        authorProfileId: input.authorProfileId,
        content: input.content,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["classified-comments", classifiedId],
      });
    },
  });
}

export function useDeleteClassifiedComment(classifiedId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { commentId: string; authorProfileId: string }) =>
      classifiedCommentService.remove(input.commentId, input.authorProfileId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["classified-comments", classifiedId],
      });
    },
  });
}
