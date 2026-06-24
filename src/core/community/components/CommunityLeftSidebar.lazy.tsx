import React, { lazy, memo, Suspense } from "react";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

const RankingWidget = lazy(() =>
  import("./widgets/RankingWidget").then((module) => ({
    default: module.RankingWidget,
  })),
);

/**
 * Sidebar esquerda com lazy loading.
 */
export const CommunityLeftSidebar = memo(() => {
  if (!isLaunchSurfaceEnabled("gamification")) return null;

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
