import { useMutation, useQueryClient } from "@tanstack/react-query";
import { interactionService } from "@/core/interaction/services";
import type { Post } from "@/core/feed/types";
interface UseSavePostParams {
  postId: string;
  userId: string;
}

export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: UseSavePostParams) =>
      interactionService.savePost(postId, userId),

    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });
      await queryClient.cancelQueries({ queryKey: ["feed"] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData(["post", postId], {
          ...previousPost,
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
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
  });
}
