import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Hash } from "lucide-react";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { postService } from "@/core/posts/services";
import type { TerritoryFilter } from "@/core/location";

interface PopularTagsWidgetProps {
  onTagClick?: (tag: string) => void;
  territoryFilter?: TerritoryFilter;
}

export function PopularTagsWidget({ onTagClick, territoryFilter }: PopularTagsWidgetProps) {
  const fallbackTerritoryFilter = useTerritoryFilter();
  const activeTerritoryFilter = territoryFilter ?? fallbackTerritoryFilter;

  const locationIds = useMemo(() => {
    if (activeTerritoryFilter.scope === "location") return [activeTerritoryFilter.location_id];
    if (activeTerritoryFilter.scope === "group") return activeTerritoryFilter.location_ids;
    return [];
  }, [activeTerritoryFilter]);

  const { data: popularTags, isLoading } = useQuery({
    queryKey: ["popular-tags", locationIds],
    queryFn: async () => {
      const tagMap = new Map<string, number>();
      const batches = await Promise.all(locationIds.map((locationId) => postService.getPopularTags(locationId, 10)));

      for (const batch of batches) {
        for (const entry of batch) {
          tagMap.set(entry.tag, (tagMap.get(entry.tag) ?? 0) + entry.count);
        }
      }

      return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
    enabled: locationIds.length > 0,
  });

  if (isLoading || !popularTags || popularTags.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Tags Populares
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(({ tag, count }) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onTagClick?.(tag)}
            >
              #{tag} ({count})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
