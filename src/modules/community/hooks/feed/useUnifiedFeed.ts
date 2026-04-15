import { useMemo } from "react";
import { PostAdapter } from "@/core/posts/adapters/PostAdapter";
import type { UnifiedPost } from "@/shared/types/posts";

interface UseUnifiedFeedProps {
  posts?: any[];
  civicReports?: any[];
  communityPosts?: any[];
  feedPosts?: any[];
  sortCriteria?: "recent" | "popular" | "nearby";
  filterType?:
    | "all"
    | "civic_report"
    | "discussao"
    | "alerta"
    | "recomendacao"
    | "enquete";
  userLocation?: { neighborhood?: string; city?: string };
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
      ...civicReports.map((report) => PostAdapter.fromCivicReport(report)),
      ...PostAdapter.convertArray(communityPosts),
      ...feedPosts.map((post) => PostAdapter.fromFeedPost(post)),
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
        : PostAdapter.filterByType(unifiedPosts, filterType as any),
    [unifiedPosts, filterType],
  );

  const sortedPosts = useMemo(
    () => PostAdapter.sortPosts(filteredPosts, sortCriteria, userLocation),
    [filteredPosts, sortCriteria, userLocation],
  );

  return { sortedPosts };
}
