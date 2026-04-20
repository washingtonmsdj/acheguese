import React from "react";
import { lazy, Suspense, memo } from "react";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
// Lazy load dos widgets para code splitting
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
 * Sidebar direita com lazy loading
 * Otimiza bundle inicial carregando widgets sob demanda
 * Inclui error boundaries para resiliência
 */
export const CommunityRightSidebar = memo(() => {
  return (
    <div className="flex flex-col gap-2 w-full">
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
