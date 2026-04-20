import { useMutation, useQueryClient } from "@tanstack/react-query";
import { interactionService } from "@/core/interaction/services";
import type { Post } from "@/core/feed/types";
import type { CreateCommentData } from "@/core/interaction/types";
interface UseAddCommentParams {
  postId: string;
  profileId: string;
  date: CreateCommentData;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, profileId, date }: UseAddCommentParams) =>
      interactionService.addComment(postId, profileId, date),

    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          comments_count: previousPost.comments_count + 1,
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
