import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Hash } from "lucide-react";
import { useCommunityFilters } from "../hooks/feed/useFeedFilters";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { postService } from "@/core/posts/services";

interface PopularTagsWidgetProps {
  onTagClick?: (tag: string) => void;
}

export function PopularTagsWidget({ onTagClick }: PopularTagsWidgetProps) {
  const { filters } = useCommunityFilters();
  const { user } = useAuth();

  // ✅ SSOT: usa location_id do filtro ativo — sem campos legados
  const locationId = filters.location_id as string | undefined;

  const { data: popularTags, isLoading } = useQuery({
    queryKey: ["popular-tags", locationId],
    queryFn: () => postService.getPopularTags(locationId!, 10),
    staleTime: 5 * 60 * 1000,
    enabled: !!locationId,
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
