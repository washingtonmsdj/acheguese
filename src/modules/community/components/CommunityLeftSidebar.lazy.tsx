import React from "react";
import { lazy, Suspense, memo } from "react";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
// Lazy load dos widgets para code splitting
const RankingWidget = lazy(() =>
  import("./widgets/RankingWidget").then((module) => ({
    default: module.RankingWidget,
  })),
);

/**
 * Sidebar esquerda com lazy loading
 * Otimiza bundle inicial carregando widgets sob demanda
 * Inclui error boundaries para resiliência
 */
export const CommunityLeftSidebar = memo(() => {
  return (
    <div className="space-y-2 w-full">
      <WidgetErrorBoundary widgetName="RankingWidget">
        <Suspense fallback={<WidgetSkeleton hasHeader itemCount={3} />}>
          <RankingWidget />
        </Suspense>
      </WidgetErrorBoundary>

    </div>
  );
});

CommunityLeftSidebar.displayName = "CommunityLeftSidebar";
