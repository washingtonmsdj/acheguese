/**
 * ProblemasPage — Página dedicada a problemas urbanos
 * Rota: /comunidade/problemas
 */

import { useState } from "react";
import { Wrench } from "lucide-react";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { useSessionContext } from "@/core/session";
import { IssueCard } from "../components/IssueCard";
import { IssueCardSkeleton } from "../components/IssueCardSkeleton";
import { CreateIssueModal } from "../components/CreateIssueModal";
import { useIssues } from "../hooks/useIssues";
import { Button } from "@/shared/components/ui/button";
import type { IssueCategory, IssueStatus } from "../domain/types";
import { ISSUE_CATEGORY_LABELS, ISSUE_STATUS_LABELS } from "../config/issueConfig";

export default function ProblemasPage() {
  const { activeProfile: profile } = useSessionContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<IssueCategory | undefined>();
  const [filterStatus, setFilterStatus] = useState<IssueStatus | undefined>("aberto");

  const { data: issues = [], isLoading } = useIssues({
    city: profile?.city ?? "",
    neighborhood: profile?.neighborhood,
    category: filterCategory,
    status: filterStatus,
    limit: 30,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" aria-hidden />
              <h1 className="text-lg font-semibold text-foreground">Problemas urbanos</h1>
            </div>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              disabled={!profile}
              aria-label="Reportar novo problema"
            >
              Reportar
            </Button>
          </div>

          {/* Filtros de status */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por status">
            {([undefined, "aberto", "em_analise", "em_andamento", "resolvido"] as const).map((s) => (
              <button
                key={s ?? "todos"}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterStatus === s
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-border text-muted-foreground hover:border-amber-400"
                }`}
                aria-pressed={filterStatus === s}
              >
                {s ? ISSUE_STATUS_LABELS[s] : "Todos"}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="space-y-4" role="feed" aria-label="Lista de problemas urbanos">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <IssueCardSkeleton key={i} />)
            ) : issues.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum problema encontrado nesta região.</p>
              </div>
            ) : (
              issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  profileId={profile?.id}
                />
              ))
            )}
          </div>
        </div>

        <CreateIssueModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          city={profile?.city ?? ""}
          neighborhood={profile?.neighborhood}
        />
      </div>
    </TooltipProvider>
  );
}
