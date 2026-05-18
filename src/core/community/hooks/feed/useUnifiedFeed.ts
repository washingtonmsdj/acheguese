import { useMemo } from "react";
import { PostAdapter } from "@/core/posts/adapters/PostAdapter";
import type { UnifiedPost } from "@/shared/types/posts";
import { filterByTerritorialChannel, rebalanceTerritorialMix, type TerritorialFeedChannel } from "./territorialFeedEngine";

type AdapterItem = Parameters<typeof PostAdapter.convertArray>[0][number];

interface UseUnifiedFeedProps {
  posts?: AdapterItem[];
  civicReports?: AdapterItem[];
  communityPosts?: AdapterItem[];
  feedPosts?: AdapterItem[];
  sortCriteria?: "recent" | "popular" | "nearby" | "most_commented";
  filterType?:
    | "all"
    | "civic_report"
    | "discussao"
    | "alerta"
    | "recomendacao"
    | "enquete"
    | TerritorialFeedChannel;
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
      ...civicReports.map((report) => PostAdapter.fromCivicReport(report as any)),
      ...PostAdapter.convertArray(communityPosts),
      ...feedPosts.map((post) => PostAdapter.fromFeedPost(post as any)),
    ];

    // Deduplicate by id
    const seen = new Set<string>();
    return allItems.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [posts, civicReports, communityPosts, feedPosts]);

  const filteredPosts = useMemo(() => {
    if (filterType === "all") return unifiedPosts;

    const territorialChannels: TerritorialFeedChannel[] = [
      "todos",
      "para_voce",
      "empresas",
      "eventos",
      "alertas",
      "oportunidades",
      "vagas",
      "moradores",
      "classificados",
    ];

    if (territorialChannels.includes(filterType as TerritorialFeedChannel)) {
      return filterByTerritorialChannel(
        unifiedPosts,
        filterType as TerritorialFeedChannel,
        { location_id: userLocation?.location_id },
      );
    }

    return PostAdapter.filterByType(unifiedPosts, filterType);
  }, [unifiedPosts, filterType, userLocation?.location_id]);

  const sortedPosts = useMemo(() => {
    if (sortCriteria === "most_commented") {
      const sorted = [...filteredPosts].sort(
        (a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0),
      );
      return rebalanceTerritorialMix(sorted);
    }
    return rebalanceTerritorialMix(PostAdapter.sortPosts(filteredPosts, sortCriteria, userLocation));
  }, [filteredPosts, sortCriteria, userLocation]);

  return { sortedPosts };
}
