import { useMutation, useQueryClient } from "@tanstack/react-query";
import { interactionService } from "@/core/interaction/services";
import type { Post } from "@/core/feed/types";
interface UseLikePostParams {
  postId: string;
  profileId: string;
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, profileId }: UseLikePostParams) =>
      interactionService.likePost(postId, profileId),

    onMutate: async ({ postId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData(["post", postId], {
          ...previousPost,
          likes_count: previousPost.likes_count + 1,
        });
      }

      return { previousPost };
    },

    onError: (err, { postId }, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },

    onSettled: (date, error, { postId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
