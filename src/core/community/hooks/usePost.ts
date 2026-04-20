/**
 * usePost Hook
 *
 * Hook for search post específico
 */

import { useQuery } from "@tanstack/react-query";
import { feedService } from "@/core/posts/services";
import type { Post } from "@/core/feed/types";
export function usePost(postId: string | undefined) {
  return useQuery<Post | null, Error>({
    queryKey: ["post", postId],
    queryFn: () => feedService.getPostById(postId!),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
