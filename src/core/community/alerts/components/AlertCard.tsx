/**
 * AlertCard — Card visual próprio para alertas comunitários.
 * Usa tokens semânticos territoriais para manter o estado visual separado da
 * lógica de domínio e consistente com o SSOT global.
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
        "space-y-3 rounded-2xl border-2 bg-territory-surface p-4 text-territory-ink shadow-sm",
        "border-territory-error/45",
        isExpiringSoon && "border-territory-warning/60",
      )}
      aria-label={`Alerta: ${categoryLabel}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-territory-error"
            aria-hidden="true"
          />
          <Badge
            variant="destructive"
            className="bg-territory-error text-xs font-semibold text-territory-on-image hover:bg-territory-error/90"
          >
            {categoryLabel}
          </Badge>
          <StatusBadge status={alert.status} />
        </div>
        <ExpiryCountdown minutesLeft={minutesLeft} />
      </div>

      <p className="text-xs font-medium text-territory-muted">
        {alert.neighborhood_display}, {alert.city}
      </p>

      <p className="text-sm leading-relaxed text-territory-ink">
        {alert.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {!alert.seen_personally ? (
          <span className="rounded-full bg-territory-raised px-2 py-0.5 text-xs text-territory-muted">
            Relato indireto
          </span>
        ) : null}
        {!alert.still_risky ? (
          <span className="rounded-full bg-territory-warning/12 px-2 py-0.5 text-xs text-territory-warning">
            Situação pode ter se encerrado
          </span>
        ) : null}
        {alert.edit_count > 0 ? (
          <span className="rounded-full bg-territory-raised px-2 py-0.5 text-xs text-territory-muted">
            Atualizado {alert.edit_count}×
          </span>
        ) : null}
      </div>

      <p className="flex items-center gap-1 text-xs text-territory-muted">
        <Clock className="h-3 w-3" aria-hidden="true" />
        {timeAgo}
      </p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-territory-border bg-territory-surface text-xs text-territory-ink hover:bg-territory-raised"
          onClick={() => setSeenCount((count) => count + 1)}
          aria-label="Vi isso também"
        >
          <Eye className="h-3 w-3" aria-hidden="true" />
          Vi isso {seenCount > 0 && `(${seenCount})`}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-territory-border bg-territory-surface text-xs text-territory-ink hover:bg-territory-raised"
          onClick={() => setNotProceedCount((count) => count + 1)}
          aria-label="Não procede"
        >
          <ThumbsDown className="h-3 w-3" aria-hidden="true" />
          Não procede {notProceedCount > 0 && `(${notProceedCount})`}
        </Button>

        {onSeeGuidelines ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-territory-brand hover:bg-territory-raised hover:text-territory-brand"
            onClick={() => onSeeGuidelines(alert.id)}
            aria-label="Ver orientações"
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            Orientações
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-1 text-xs text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
          onClick={() => setReportOpen(true)}
          aria-label="Reportar abuso"
        >
          <Flag className="h-3 w-3" aria-hidden="true" />
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

function StatusBadge({ status }: { status: CommunityAlertPublic["status"] }) {
  const config = {
    ativo: {
      label: "ATIVO",
      className: "bg-territory-error/12 text-territory-error",
    },
    encerrado: {
      label: "ENCERRADO",
      className: "bg-territory-success/12 text-territory-success",
    },
    expirado: {
      label: "EXPIRADO",
      className: "bg-territory-raised text-territory-muted",
    },
    removido: {
      label: "REMOVIDO",
      className: "bg-territory-raised text-territory-muted/80",
    },
  };

  const { label, className } = getRecordValue(config, status) ?? config.ativo;

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", className)}>
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
        "shrink-0 rounded-full px-2 py-0.5 font-mono text-xs",
        minutesLeft <= 15
          ? "bg-territory-warning/12 text-territory-warning"
          : "bg-territory-raised text-territory-muted",
      )}
      title="Tempo restante até expiração"
    >
      {label}
    </span>
  );
}
