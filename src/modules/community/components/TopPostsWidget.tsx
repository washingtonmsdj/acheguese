import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useCommunityFilters } from "../hooks/feed/useFeedFilters";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { postService } from "@/core/posts/services";

/**
 * Widget de posts mais populares
 *
 * Requirements:
 * - Requirement 11: Sidebar de Conteúdo Destacado
 *
 * Funcionalidades:
 * - Listar top 5 posts por engagement dos últimos 7 dias
 * - Filtrar por Geographic_Scope active
 */

export function TopPostsWidget() {
  const { filters } = useCommunityFilters();
  const { user } = useAuth();

  // ✅ SSOT: usa location_id do filtro ativo — sem campos legados
  const locationId = filters.location_id as string | undefined;

  const { data: topPosts, isLoading } = useQuery({
    queryKey: ["top-posts", locationId],
    queryFn: () => postService.getTopPosts(locationId!, 5),
    staleTime: 5 * 60 * 1000,
    enabled: !!locationId,
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
              <span>{post.engagement} interações</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
