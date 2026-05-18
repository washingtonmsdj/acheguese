/**
 * usePost Hook
 *
 * Hook for search post específico
 */

import { useQuery } from "@tanstack/react-query";
import { postService } from "@/core/posts/services/PostService";
type Post = Record<string, unknown>;
export function usePost(postId: string | undefined) {
  return useQuery<Post | null, Error>({
    queryKey: ["post", postId],
    queryFn: () =>
      postService.getPostById(postId!) as unknown as Promise<Post | null>,
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
