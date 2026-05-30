/**
 * IssueCard — Card visual para problemas urbanos
 *
 * Visual distinto de posts e alertas:
 * borda amarela/laranja, badge de categoria, status operacional, contador de apoios.
 */

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { Wrench, MapPin, ThumbsUp, Flag, Clock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { ISSUE_CATEGORY_LABELS, ISSUE_STATUS_LABELS } from "../config/issueConfig";
import { useIssueSupport } from "../hooks/useIssueSupport";
import type { CommunityIssuePublic } from "../domain/types";

interface IssueCardProps {
  issue: CommunityIssuePublic;
  profileId?: string;
  onReport?: (issueId: string) => void;
}

export function IssueCard({ issue, profileId, onReport }: IssueCardProps) {
  const { isSupporting, toggleSupport, isPending } = useIssueSupport(issue.id, profileId);
  const categoryLabel = getRecordValue(ISSUE_CATEGORY_LABELS, issue.category) ?? issue.category;
  const statusLabel = getRecordValue(ISSUE_STATUS_LABELS, issue.status) ?? issue.status;

  const timeAgo = formatDistanceToNow(new Date(issue.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article
      className={cn(
        "rounded-xl border-2 bg-card p-4 space-y-3 shadow-sm",
        "border-amber-400 dark:border-amber-600"
      )}
      aria-label={`Problema urbano: ${issue.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Wrench className="h-4 w-4 text-amber-500 shrink-0" aria-hidden />
          <Badge
            variant="outline"
            className="text-xs font-semibold border-amber-400 text-amber-700 dark:text-amber-300"
          >
            {categoryLabel}
          </Badge>
          <StatusBadge status={issue.status} label={statusLabel} />
        </div>
      </div>

      {/* Título */}
      <p className="text-sm font-semibold leading-snug">{issue.title}</p>

      {/* Localização */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" aria-hidden />
        {issue.neighborhood_display}, {issue.city}
        {issue.address_reference && ` — ${issue.address_reference}`}
      </p>

      {/* Descrição */}
      <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {issue.description}
      </p>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" aria-hidden />
        {timeAgo}
      </p>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          variant={isSupporting ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1"
          onClick={() => toggleSupport()}
          disabled={!profileId || isPending}
          aria-label={isSupporting ? "Remover apoio" : "Apoiar este problema"}
          aria-pressed={isSupporting}
        >
          <ThumbsUp className="h-3 w-3" />
          {issue.support_count + (isSupporting ? 0 : 0)} apoios
        </Button>

        {onReport && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-muted-foreground ml-auto"
            onClick={() => onReport(issue.id)}
            aria-label="Reportar abuso"
          >
            <Flag className="h-3 w-3" />
            Reportar
          </Button>
        )}
      </div>
    </article>
  );
}

// ============================================================================
// SUB-COMPONENTE
// ============================================================================

function StatusBadge({ status, label }: { status: CommunityIssuePublic["status"]; label: string }) {
  const classMap: Record<string, string> = {
    aberto:       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    em_analise:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    em_andamento: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    resolvido:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejeitado:    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-full",
        getRecordValue(classMap, status) ?? classMap.aberto,
      )}
    >
      {label.toUpperCase()}
    </span>
  );
}
