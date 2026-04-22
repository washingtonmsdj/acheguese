/**
 * IssueFeedSection — Seção de problemas urbanos no feed da comunidade
 *
 * Exibida separadamente de posts e alertas.
 * Controlada por feature flag COMMUNITY_ISSUES_ENABLED.
 */

import { useState } from "react";
import { Wrench, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { IssueCard } from "./IssueCard";
import { IssueCardSkeleton } from "./IssueCardSkeleton";
import { CreateIssueModal } from "./CreateIssueModal";
import { useIssues } from "../hooks/useIssues";
import { COMMUNITY_ISSUES_ENABLED } from "../config/issueConfig";
import type { IssueFeedFilters } from "../domain/types";

interface IssueFeedSectionProps {
  city: string;
  neighborhood?: string;
  profileId?: string;
}

export function IssueFeedSection({ city, neighborhood, profileId }: IssueFeedSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const filters: IssueFeedFilters = { city, neighborhood, limit: 5 };
  const { data: issues = [], isLoading } = useIssues(filters);

  // Feature flag — seção inteira oculta se desativada
  if (!COMMUNITY_ISSUES_ENABLED) return null;

  return (
    <section aria-label="Problemas urbanos da comunidade" className="space-y-3">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <Wrench className="h-4 w-4" aria-hidden />
          Problemas urbanos
          {issues.length > 0 && (
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {issues.length}
            </span>
          )}
          {collapsed ? (
            <ChevronDown className="h-3 w-3" aria-hidden />
          ) : (
            <ChevronUp className="h-3 w-3" aria-hidden />
          )}
        </button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1 border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
          onClick={() => setModalOpen(true)}
          aria-label="Reportar novo problema"
        >
          <Plus className="h-3 w-3" />
          Reportar
        </Button>
      </div>

      {/* Lista de problemas */}
      {!collapsed && (
        <div className="space-y-3">
          {isLoading ? (
            <>
              <IssueCardSkeleton />
              <IssueCardSkeleton />
            </>
          ) : issues.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Nenhum problema registrado nesta região.
            </p>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                profileId={profileId}
              />
            ))
          )}
        </div>
      )}

      <CreateIssueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        city={city}
        neighborhood={neighborhood}
      />
    </section>
  );
}
