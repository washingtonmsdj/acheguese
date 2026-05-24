import React, { lazy, memo, Suspense } from "react";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";

const RankingWidget = lazy(() =>
  import("./widgets/RankingWidget").then((module) => ({
    default: module.RankingWidget,
  })),
);

/**
 * Sidebar esquerda com lazy loading.
 */
export const CommunityLeftSidebar = memo(() => {
  return (
    <div className="w-full space-y-2">
      <WidgetErrorBoundary widgetName="RankingWidget">
        <Suspense fallback={<WidgetSkeleton hasHeader itemCount={3} />}>
          <RankingWidget />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
});

CommunityLeftSidebar.displayName = "CommunityLeftSidebar";
