import React from "react";
import { useState } from "react";
import { usePendingPosts } from "@/core/moderation/hooks/usePendingPosts";
import { PendingPostCard } from "./PendingPostCard";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import { Filter, AlertTriangle } from "lucide-react";
import { ModerationFilters } from "@/core/moderation/types";
import { RIDE_STATUS } from "@/shared/types/constants";
export function PendingPostsQueue() {
  const [filters, setFilters] = useState<ModerationFilters>({});

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = usePendingPosts({ filters });

  const handlePriorityChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority:
        value === "all" ? undefined : (value as "high" | "medium" | "low"),
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? undefined : [value as any],
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">Error load posts pendentes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-muted-foreground" />

            <Select
              value={filters.priority || "all"}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="high">Alta prioridade</SelectItem>
                <SelectItem value="medium">Média prioridade</SelectItem>
                <SelectItem value="low">Baixa prioridade</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status?.[0] || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value={RIDE_STATUS.PENDING}>Pendente</SelectItem>
                <SelectItem value="under_review">Em revisão</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum post pendente</h3>
            <p className="text-sm text-muted-foreground">
              Não há posts aguardando moderação no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PendingPostCard key={post.id} post={post} />
            ))}
          </div>

          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            hasMore={!!hasNextPage}
            isLoading={isFetchingNextPage}
          />
        </>
      )}
    </div>
  );
}
