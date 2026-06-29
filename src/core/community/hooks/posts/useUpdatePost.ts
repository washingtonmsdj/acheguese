/**
 * useUpdatePost Hook
 *
 * Mutation para atualizar post com optimistic update.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postService } from "@/core/posts/services/PostService";
import type { Post, UpdatePostData } from "@/core/posts/types";

interface UpdatePostVariables {
  postId: string;
  data: UpdatePostData;
}

interface UpdatePostContext {
  previousPost?: Post;
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, UpdatePostVariables, UpdatePostContext>({
    mutationFn: ({ postId, data }) => postService.updatePost(postId, data),

    onMutate: async ({ postId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      const previousPost = queryClient.getQueryData<Post>(["post", postId]);

      if (previousPost) {
        queryClient.setQueryData<Post>(["post", postId], {
          ...previousPost,
          ...data,
        });
      }

      return { previousPost };
    },

    onError: (_error, { postId }, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(["post", postId], context.previousPost);
      }
    },

    onSettled: (_result, _error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
