import React, { memo } from "react";
import { UserProfileWidget } from "./widgets/UserProfileWidget";
import { RankingWidget } from "./widgets/RankingWidget";
import { ActivityWidget } from "./widgets/ActivityWidget";
import { SuggestionsWidgetSSOT } from "./widgets/SuggestionsWidgetSSOT";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

/**
 * Sidebar esquerda da comunidade.
 *
 * SSOT: composicao canonica dos widgets da coluna lateral.
 */
export const CommunityLeftSidebar = memo(() => {
  return (
    <div className="w-full space-y-3">
      <WidgetErrorBoundary widgetName="UserProfileWidget">
        <UserProfileWidget />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary widgetName="RankingWidget">
        <RankingWidget />
      </WidgetErrorBoundary>

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
