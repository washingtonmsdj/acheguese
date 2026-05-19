import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  XCircle,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Textarea } from "@/shared/components/ui/textarea";
import type {
  TrustAdminActionType,
  TrustEvent,
  TrustEventStatus,
} from "@/core/trust";
import {
  TRUST_ADMIN_ACTION_TYPES,
  TRUST_EVENT_STATUSES,
} from "@/core/trust";
import {
  asRecord,
  asString,
  getSeverityVariant,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "./TrustEventsQueue.constants";

interface TrustEventQueueCardProps {
  event: TrustEvent;
  selected: boolean;
  resolutionNote: string;
  disabled: boolean;
  onToggleSelection: (eventId: string) => void;
  onResolutionNoteChange: (eventId: string, value: string) => void;
  onReview: (eventId: string, status: TrustEventStatus) => Promise<void>;
  onApplyAction: (
    event: TrustEvent,
    actionType: TrustAdminActionType,
    durationDays?: number,
  ) => Promise<void>;
}

function ClassifiedCommentEvidence({ event }: { event: TrustEvent }) {
  const evidence = asRecord(event.evidence);
  const commentId = asString(evidence.comment_id);
  const content = asString(evidence.comment_content);
  const authorName = asString(evidence.comment_author_name);
  const createdAt = asString(evidence.comment_created_at);

  if (
    event.context_type !== "classified" ||
    event.reason_code !== "classified_comment_report" ||
    !commentId
  ) {
    return null;
  }

  return (
    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
      <p className="font-medium">Comentario denunciado: #{commentId.slice(0, 8)}</p>
      {(authorName || createdAt) && (
        <p className="mt-1 text-[11px]">
          {authorName ? `Autor: ${authorName}` : "Autor: nao informado"}
          {createdAt ? ` - ${new Date(createdAt).toLocaleString("pt-BR")}` : ""}
        </p>
      )}
      {content && (
        <p className="mt-1 line-clamp-3 rounded bg-white/60 px-2 py-1 text-[11px] text-amber-950">
          {content}
        </p>
      )}
    </div>
  );
}

export function TrustEventQueueCard({
  event,
  selected,
  resolutionNote,
  disabled,
  onToggleSelection,
  onResolutionNoteChange,
  onReview,
  onApplyAction,
}: TrustEventQueueCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <ClassifiedCommentEvidence event={event} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelection(event.id)}
              aria-label={`Selecionar evento ${event.id}`}
            />
            <span className="text-xs text-muted-foreground">Selecionar</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getSeverityVariant(event.severity)}>
              {SEVERITY_LABELS[event.severity]}
            </Badge>
            <Badge variant="outline">{STATUS_LABELS[event.status]}</Badge>
            <Badge variant="secondary">{event.event_type}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          <div>
            <p className="font-medium">
              {event.actor_role} avaliou {event.subject_role}
              {event.rating ? ` com nota ${event.rating}/5` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Contexto: {event.context_type} #{event.context_id.slice(0, 8)} - Motivo:{" "}
              {event.reason_code}
            </p>
            {event.context_type === "classified" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={`/classificados/${event.context_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir anuncio
                  </a>
                </Button>
                {event.reason_code.startsWith("classified_comment_") && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/admin/classificados/denuncias" target="_blank" rel="noreferrer">
                      Abrir fila de denuncias
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p className="rounded-md bg-muted p-3 text-sm">{event.description}</p>
          )}
        </div>

        <div className="min-w-[240px] space-y-2">
          <Textarea
            value={resolutionNote}
            onChange={(input) => onResolutionNoteChange(event.id, input.target.value)}
            placeholder="Nota admin: aviso aplicado, sem acao, reincidencia..."
            disabled={disabled}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onReview(event.id, TRUST_EVENT_STATUSES.UNDER_REVIEW)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Analisar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onReview(event.id, TRUST_EVENT_STATUSES.CONFIRMED)}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onReview(event.id, TRUST_EVENT_STATUSES.DISMISSED)}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Descartar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled}
              onClick={() => onReview(event.id, TRUST_EVENT_STATUSES.PENALIZED)}
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Penalizar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onApplyAction(event, TRUST_ADMIN_ACTION_TYPES.WARNING)}
            >
              Avisar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onApplyAction(event, TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION)}
            >
              Desbloquear
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled}
              onClick={() =>
                onApplyAction(event, TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION, 7)
              }
            >
              Restringir 7d
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled}
              onClick={() =>
                onApplyAction(event, TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION, 30)
              }
            >
              Restringir 30d
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
