/**
 * AlertCard — Card visual próprio para alertas comunitários
 * Visual distinto de posts comuns: borda vermelha, badge de categoria, countdown
 */

import { useState } from "react";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { AlertTriangle, Clock, Eye, ThumbsDown, Flag, Info } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { AlertReportDialog } from "./AlertReportDialog";
import { ALERT_CATEGORY_LABELS } from "../config/alertConfig";
import type { CommunityAlertPublic } from "../domain/types";

interface AlertCardProps {
  alert: CommunityAlertPublic;
  onSeeGuidelines?: (alertId: string) => void;
}

export function AlertCard({ alert, onSeeGuidelines }: AlertCardProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [notProceedCount, setNotProceedCount] = useState(0);

  const minutesLeft = differenceInMinutes(new Date(alert.expires_at), new Date());
  const isExpiringSoon = minutesLeft <= 15 && minutesLeft > 0;
  const categoryLabel = getRecordValue(ALERT_CATEGORY_LABELS, alert.category) ?? alert.category;
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article
      className={cn(
        "rounded-xl border-2 bg-card p-4 space-y-3 shadow-sm",
        "border-red-400 dark:border-red-600",
        isExpiringSoon && "border-orange-400 dark:border-orange-500"
      )}
      aria-label={`Alerta: ${categoryLabel}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" aria-hidden />
          <Badge variant="destructive" className="text-xs font-semibold">
            {categoryLabel}
          </Badge>
          <StatusBadge status={alert.status} />
        </div>
        <ExpiryCountdown minutesLeft={minutesLeft} />
      </div>

      {/* Localização */}
      <p className="text-xs text-muted-foreground font-medium">
        {alert.neighborhood_display}, {alert.city}
      </p>

      {/* Descrição */}
      <p className="text-sm leading-relaxed">{alert.description}</p>

      {/* Badges informativos */}
      <div className="flex flex-wrap gap-2">
        {!alert.seen_personally && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            Relato indireto
          </span>
        )}
        {!alert.still_risky && (
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full text-amber-700 dark:text-amber-300">
            Situação pode ter se encerrado
          </span>
        )}
        {alert.edit_count > 0 && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
            Atualizado {alert.edit_count}×
          </span>
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" aria-hidden />
        {timeAgo}
      </p>

      {/* Ações */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setSeenCount((c) => c + 1)}
          aria-label="Vi isso também"
        >
          <Eye className="h-3 w-3" />
          Vi isso {seenCount > 0 && `(${seenCount})`}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setNotProceedCount((c) => c + 1)}
          aria-label="Não procede"
        >
          <ThumbsDown className="h-3 w-3" />
          Não procede {notProceedCount > 0 && `(${notProceedCount})`}
        </Button>

        {onSeeGuidelines && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => onSeeGuidelines(alert.id)}
            aria-label="Ver orientações"
          >
            <Info className="h-3 w-3" />
            Orientações
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground ml-auto"
          onClick={() => setReportOpen(true)}
          aria-label="Reportar abuso"
        >
          <Flag className="h-3 w-3" />
          Reportar
        </Button>
      </div>

      <AlertReportDialog
        alertId={alert.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </article>
  );
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

function StatusBadge({ status }: { status: CommunityAlertPublic["status"] }) {
  const config = {
    ativo:     { label: "ATIVO",     className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    encerrado: { label: "ENCERRADO", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
    expirado:  { label: "EXPIRADO",  className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
    removido:  { label: "REMOVIDO",  className: "bg-gray-100 text-gray-400" },
  };

  const { label, className } = getRecordValue(config, status) ?? config.ativo;

  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", className)}>
      {label}
    </span>
  );
}

function ExpiryCountdown({ minutesLeft }: { minutesLeft: number }) {
  if (minutesLeft <= 0) return null;

  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <span
      className={cn(
        "text-xs font-mono px-2 py-0.5 rounded-full shrink-0",
        minutesLeft <= 15
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
          : "bg-muted text-muted-foreground"
      )}
      title="Tempo restante até expiração"
    >
      {label}
    </span>
  );
}
