/**
 * useUpdatePost Hook
 *
 * Mutation para update post com optimistic update
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/core/posts/services";
import type { UpdatePostData, Post } from "@/core/feed/types";
interface UpdatePostVariables {
  postId: string;
  date: UpdatePostData;
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, UpdatePostVariables>({
    mutationFn: ({ postId, date }) => feedService.updatePost(postId, date),

    onMutate: async ({ postId, date }) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          ...date,
        });
      }

      return { previousPost };
    },

    onError: (err, { postId }, context: { previousPost?: Post } | undefined) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },

    onSettled: (date, error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
