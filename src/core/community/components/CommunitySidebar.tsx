import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { TopPostsWidget } from "./TopPostsWidget";
import { TopUsersWidget } from "./TopUsersWidget";
import { PopularTagsWidget } from "./PopularTagsWidget";
import { CommunityRulesWidget } from "./CommunityRulesWidget";
import { EventsWidget } from "./EventsWidget";
import { GamificationWidget } from "./GamificationWidget";
import type { TerritoryFilter } from "@/core/location";
/**
 * Sidebar da comunidade com widgets de conteúdo destacado
 *
 * Requirements:
 * - Requirement 11: Sidebar de Conteúdo Destacado
 * - Requirement 20: Responsividade Mobile
 *
 * Funcionalidades:
 * - Container para widgets (300px width)
 * - Sticky positioning
 * - Widgets: Top Posts, Alertas Ativos, Top Users, Tags Populares, Regras
 */

interface CommunitySidebarProps {
  onTagClick?: (tag: string) => void;
  territoryFilter?: TerritoryFilter;
}

export function CommunitySidebar({ onTagClick, territoryFilter }: CommunitySidebarProps) {
  return (
    <div className="sticky top-20 space-y-4">
      <GamificationWidget />
      <EventsWidget />
      <TopPostsWidget territoryFilter={territoryFilter} />
      <TopUsersWidget />
      <PopularTagsWidget onTagClick={onTagClick} territoryFilter={territoryFilter} />
      <CommunityRulesWidget />
    </div>
  );
}
