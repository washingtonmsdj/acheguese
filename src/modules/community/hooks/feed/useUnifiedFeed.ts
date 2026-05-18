import { useMemo } from "react";
import { PostAdapter } from "@/core/posts/adapters/PostAdapter";
import type { UnifiedPost } from "@/shared/types/posts";

type AdapterItem = Parameters<typeof PostAdapter.convertArray>[0][number];

interface UseUnifiedFeedProps {
  posts?: AdapterItem[];
  civicReports?: AdapterItem[];
  communityPosts?: AdapterItem[];
  feedPosts?: AdapterItem[];
  sortCriteria?: "recent" | "popular" | "nearby";
  filterType?:
    | "all"
    | "civic_report"
    | "discussao"
    | "alerta"
    | "recomendacao"
    | "enquete";
  userLocation?: { neighborhood?: string; city?: string; location_id?: string };
}

export function useUnifiedFeed({
  posts = [],
  civicReports = [],
  communityPosts = [],
  feedPosts = [],
  sortCriteria = "recent",
  filterType = "all",
  userLocation,
}: UseUnifiedFeedProps) {
  const unifiedPosts: UnifiedPost[] = useMemo(() => {
    // Convert all data sources, using convertArray which auto-detects the format
    const allItems = [
      ...PostAdapter.convertArray(posts),
      ...PostAdapter.convertArray(civicReports),
      ...PostAdapter.convertArray(communityPosts),
      ...PostAdapter.convertArray(feedPosts),
    ];

    // Deduplicate by id
    const seen = new Set<string>();
    return allItems.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [posts, civicReports, communityPosts, feedPosts]);

  const filteredPosts = useMemo(
    () =>
      filterType === "all"
        ? unifiedPosts
        : PostAdapter.filterByType(unifiedPosts, filterType),
    [unifiedPosts, filterType],
  );

  const sortedPosts = useMemo(
    () => PostAdapter.sortPosts(filteredPosts, sortCriteria, userLocation),
    [filteredPosts, sortCriteria, userLocation],
  );

  return { sortedPosts };
}
