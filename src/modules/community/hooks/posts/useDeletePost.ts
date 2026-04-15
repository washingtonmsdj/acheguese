/**
 * useDeletePost Hook
 *
 * Mutation para delete post
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { feedService } from "@/core/posts/services";

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (postId: string) => feedService.deletePost(postId),

    onSuccess: (date, postId) => {
      queryClient.removeQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
