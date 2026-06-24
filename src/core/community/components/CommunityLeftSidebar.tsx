import React, { lazy, memo, Suspense } from "react";
import { UserProfileWidget } from "./widgets/UserProfileWidget";
import { ActivityWidget } from "./widgets/ActivityWidget";
import { SuggestionsWidgetSSOT } from "./widgets/SuggestionsWidgetSSOT";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { WidgetSkeleton } from "./widgets/WidgetSkeleton";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

const RankingWidget = lazy(() =>
  import("./widgets/RankingWidget").then((module) => ({
    default: module.RankingWidget,
  })),
);

/**
 * Sidebar esquerda da comunidade.
 *
 * SSOT: composicao canonica dos widgets da coluna lateral.
 */
export const CommunityLeftSidebar = memo(() => {
  const showRanking = isLaunchSurfaceEnabled("gamification");

  return (
    <div className="w-full space-y-3">
      <WidgetErrorBoundary widgetName="UserProfileWidget">
        <UserProfileWidget />
      </WidgetErrorBoundary>

      {showRanking ? (
        <WidgetErrorBoundary widgetName="RankingWidget">
          <Suspense fallback={<WidgetSkeleton hasHeader itemCount={3} />}>
            <RankingWidget />
          </Suspense>
        </WidgetErrorBoundary>
      ) : null}

      <WidgetErrorBoundary widgetName="ActivityWidget">
        <ActivityWidget />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary widgetName="SuggestionsWidget">
        <SuggestionsWidgetSSOT />
      </WidgetErrorBoundary>
    </div>
  );
});

CommunityLeftSidebar.displayName = "CommunityLeftSidebar";
