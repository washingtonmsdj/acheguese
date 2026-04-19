import React from "react";
import { memo } from "react";

interface WidgetSkeletonProps {
  hasHeader?: boolean;
  itemCount?: number;
  variant?: "default" | "profile" | "activity";
}

/**
 * Skeleton loader melhorado para widgets da sidebar
 * Melhora percepção de performance durante carregamento
 * 
 * Variantes:
 * - default: Para widgets padrão (ranking, grupos)
 * - profile: Para widget de perfil do usuário
 * - activity: Para widget de atividades
 */
export const WidgetSkeleton = memo(
  ({ hasHeader = true, itemCount = 3, variant = "default" }: WidgetSkeletonProps) => {
    if (variant === "profile") {
      return (
        <div className="bg-card rounded-lg p-4 border border-border animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-3/4" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="h-3 bg-secondary rounded w-full" />
            <div className="h-1.5 bg-secondary rounded w-full" />
          </div>
        </div>
      );
    }

    if (variant === "activity") {
      return (
        <div className="bg-card rounded-lg p-4 border border-border animate-pulse">
          {hasHeader && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary" />
              <div className="h-4 bg-secondary rounded w-1/3" />
            </div>
          )}
          <div className="space-y-3">
            {Array.from({ length: itemCount }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-secondary rounded w-full" />
                  <div className="h-2 bg-secondary rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default variant
    return (
      <div className="bg-card rounded-lg p-4 border border-border animate-pulse">
        {hasHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-secondary" />
            <div className="h-4 bg-secondary rounded w-1/3" />
          </div>
        )}

        <div className="space-y-2">
          {Array.from({ length: itemCount }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-secondary rounded w-full" />
                <div className="h-3 bg-secondary rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

WidgetSkeleton.displayName = "WidgetSkeleton";
