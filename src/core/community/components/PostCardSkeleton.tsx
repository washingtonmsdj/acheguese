import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  getCardClasses,
  getCardBackground,
} from "./styles/communityDesignSystem";
/**
 * Skeleton loader para PostCard
 * Mostra um placeholder animado enquanto os posts carregam
 */

export function PostCardSkeleton() {
  return (
    <Card
      className={getCardClasses("default")}
      style={getCardBackground("alt")}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Nome skeleton */}
            <div className="h-4 bg-gray-700 rounded w-32 mb-2 animate-pulse" />
            {/* Localização skeleton */}
            <div className="h-3 bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Conteúdo skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-700 rounded w-5/6 animate-pulse" />
          <div className="h-3 bg-gray-700 rounded w-4/6 animate-pulse" />
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-700 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gray-700 rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-gray-700 rounded-full w-14 animate-pulse" />
        </div>

        {/* Métricas skeleton */}
        <div
          className="flex items-center gap-4 pt-3 border-t"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
