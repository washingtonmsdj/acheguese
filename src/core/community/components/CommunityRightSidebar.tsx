import React from "react";
import { memo } from "react";
import { RankingWidget } from "./widgets/RankingWidget";
import { GroupsWidget } from "./widgets/GroupsWidget";
import { TrendingWidget } from "./widgets/TrendingWidget";
import { SponsoredWidget } from "./widgets/SponsoredWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
/**
 * Sidebar direita da Comunidade
 *
 * Contém:
 * - Widget de Ranking de Vizinhos
 * - Widget de Grupos Favoritos
 * - Widget de Tendências do Bairro
 * - Widget de Anúncio Patrocinado
 *
 * Design System:
 * - Tema escuro padrão: bg-white/5, border-white/10
 * - Tipografia: text-[0.65rem] (títulos), text-[0.55rem] (subtítulos)
 * - Espaçamento: p-2, gap-2, space-y-1
 * - Skeleton loaders durante carregamento
 * - Error boundaries para resiliência
 */

interface CommunityRightSidebarProps {
  showGroupsWidget?: boolean;
}

export const CommunityRightSidebar = memo(({ showGroupsWidget = true }: CommunityRightSidebarProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <WidgetErrorBoundary widgetName="SponsoredWidget">
        <SponsoredWidget />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary widgetName="RankingWidget">
        <RankingWidget />
      </WidgetErrorBoundary>

      {showGroupsWidget ? (
        <WidgetErrorBoundary widgetName="GroupsWidget">
          <GroupsWidget />
        </WidgetErrorBoundary>
      ) : null}

      <WidgetErrorBoundary widgetName="TrendingWidget">
        <TrendingWidget />
      </WidgetErrorBoundary>
    </div>
  );
});

CommunityRightSidebar.displayName = "CommunityRightSidebar";
