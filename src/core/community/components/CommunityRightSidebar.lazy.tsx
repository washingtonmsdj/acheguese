import React, { lazy, memo, Suspense } from "react";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";

const TrendingWidget = lazy(() =>
  import("./widgets/TrendingWidget").then((module) => ({
    default: module.TrendingWidget,
  })),
);

const SponsoredWidget = lazy(() =>
  import("./widgets/SponsoredWidget").then((module) => ({
    default: module.SponsoredWidget,
  })),
);

/**
 * Sidebar direita com lazy loading.
 */
export const CommunityRightSidebar = memo(() => {
  return (
    <div className="flex w-full flex-col gap-2">
      <WidgetErrorBoundary widgetName="TrendingWidget">
        <Suspense fallback={<WidgetSkeleton hasHeader itemCount={3} />}>
          <TrendingWidget />
        </Suspense>
      </WidgetErrorBoundary>

      <WidgetErrorBoundary widgetName="SponsoredWidget">
        <Suspense fallback={<WidgetSkeleton hasHeader={false} itemCount={1} />}>
          <SponsoredWidget />
        </Suspense>
      </WidgetErrorBoundary>
    </div>
  );
});

CommunityRightSidebar.displayName = "CommunityRightSidebar";
