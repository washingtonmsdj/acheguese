import { useMutation, useQueryClient } from "@tanstack/react-query";
import { interactionService } from "@/core/interaction/services";
import type { Post } from "@/core/feed/types";
interface UseDeleteCommentParams {
  commentId: string;
  postId: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: UseDeleteCommentParams) =>
      interactionService.deleteComment(commentId),

    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          comments_count: Math.max(0, previousPost.comments_count - 1),
        });
      }

      return { previousPost };
    },

    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },

    onSettled: (date, error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}
