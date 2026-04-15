import React from "react";
import { memo } from "react";
import { UserProfileWidget } from "./widgets/UserProfileWidget";
import { RankingWidget } from "./widgets/RankingWidget";
import { GroupsWidget } from "./widgets/GroupsWidget";
import { ActivityWidget } from "./widgets/ActivityWidget";
import { SuggestionsWidget } from "./widgets/SuggestionsWidget";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

/**
 * Sidebar esquerda da Comunidade - VERSÃO MELHORADA
 *
 * Contém:
 * - Widget de Perfil do Usuário (NOVO) - mostra avatar, nível, pontos e progresso
 * - Widget de Ranking de Vizinhos (MELHORADO) - top 5 com medalhas e destaque
 * - Widget de Grupos Favoritos (MELHORADO) - cards maiores com avatares e badges
 * - Widget de Atividade Recente (NOVO) - últimas interações e notificações
 * - Widget de Sugestões (NOVO) - grupos, eventos e pessoas sugeridas
 *
 * Melhorias de UX/UI:
 * - Tipografia legível (text-sm mínimo vs 0.55rem anterior)
 * - Espaçamento generoso (p-4, gap-3 vs p-2, gap-1.5)
 * - Avatares maiores e mais visíveis (h-10 vs h-5)
 * - Animações suaves e profissionais
 * - Feedback visual rico em todas interações
 * - CTAs claros e acessíveis
 * - Empty states informativos
 * - Loading states elegantes
 * - Melhor contraste e hierarquia visual
 */

export const CommunityLeftSidebar = memo(() => {
  return (
    <div className="space-y-3 w-full">
      {/* Widget de Perfil do Usuário */}
      <WidgetErrorBoundary widgetName="UserProfileWidget">
        <UserProfileWidget />
      </WidgetErrorBoundary>

      {/* Widget de Ranking */}
      <WidgetErrorBoundary widgetName="RankingWidget">
        <RankingWidget />
      </WidgetErrorBoundary>

      {/* Widget de Grupos */}
      <WidgetErrorBoundary widgetName="GroupsWidget">
        <GroupsWidget />
      </WidgetErrorBoundary>

      {/* Widget de Atividades */}
      <WidgetErrorBoundary widgetName="ActivityWidget">
        <ActivityWidget />
      </WidgetErrorBoundary>

      {/* Widget de Sugestões */}
      <WidgetErrorBoundary widgetName="SuggestionsWidget">
        <SuggestionsWidget />
      </WidgetErrorBoundary>
    </div>
  );
});

CommunityLeftSidebar.displayName = "CommunityLeftSidebar";
