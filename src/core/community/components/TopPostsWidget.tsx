import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { postService } from "@/core/posts/services";

export function TopPostsWidget() {
  const territoryFilter = useTerritoryFilter();

  const locationIds = useMemo(() => {
    if (territoryFilter.scope === "location") return [territoryFilter.location_id];
    if (territoryFilter.scope === "group") return territoryFilter.location_ids;
    return [];
  }, [territoryFilter]);

  const { data: topPosts, isLoading } = useQuery({
    queryKey: ["top-posts", locationIds],
    queryFn: async () => {
      const batches = await Promise.all(locationIds.map((locationId) => postService.getTopPosts(locationId, 5)));
      const merged = batches.flat();
      const deduped = new Map<string, (typeof merged)[number]>();

      for (const post of merged) {
        const existing = deduped.get(post.id);
        if (!existing || post.engagement > existing.engagement) {
          deduped.set(post.id, post);
        }
      }

      return Array.from(deduped.values())
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
    enabled: locationIds.length > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Posts em Alta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!topPosts || topPosts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Posts em Alta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topPosts.map((post) => (
          <div
            key={post.id}
            className="space-y-1 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
          >
            <p className="text-xs line-clamp-2">{post.content}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{post.author_name}</span>
              <span>{post.engagement} interacoes</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
