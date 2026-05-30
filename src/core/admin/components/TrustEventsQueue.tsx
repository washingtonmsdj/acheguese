import { useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { useSessionContext } from "@/core/session";
import {
  TRUST_ADMIN_ACTION_TYPES,
  TRUST_EVENT_STATUSES,
  TrustEventService,
  TrustPolicyService,
  type TrustEvent,
  type TrustEventStatus,
} from "@/core/trust";
import { logger } from "@/shared/utils/logger";
import { type TrustContextFilter } from "./TrustEventsQueue.constants";
import { TrustEventQueueCard } from "./TrustEventQueueCard";
import { TrustEventsQueueBulkActions } from "./TrustEventsQueueBulkActions";
import { TrustEventsQueueFilters } from "./TrustEventsQueueFilters";
import { TrustEventsQueueSummary } from "./TrustEventsQueueSummary";
import { getRecordValue } from "@/shared/utils/recordLookup";

export interface TrustEventsQueueProps {
  initialContextFilter?: TrustContextFilter;
  lockContextFilter?: boolean;
  initialOnlyOpenEvents?: boolean;
  lockOnlyOpenEvents?: boolean;
  initialOnlyClassifiedCommentReports?: boolean;
  lockOnlyClassifiedCommentReports?: boolean;
  hideScoreSummary?: boolean;
}

function readResolutionNote(notes: Record<string, string>, eventId: string): string | null {
  return getRecordValue(notes, eventId)?.trim() || null;
}

export function TrustEventsQueue({
  initialContextFilter = "all",
  lockContextFilter = false,
  initialOnlyOpenEvents = true,
  lockOnlyOpenEvents = false,
  initialOnlyClassifiedCommentReports = false,
  lockOnlyClassifiedCommentReports = false,
  hideScoreSummary = false,
}: TrustEventsQueueProps = {}) {
  const { activeProfile } = useSessionContext();
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [contextFilter, setContextFilter] = useState<TrustContextFilter>(initialContextFilter);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [onlyOpenEvents, setOnlyOpenEvents] = useState(initialOnlyOpenEvents);
  const [onlyClassifiedCommentReports, setOnlyClassifiedCommentReports] = useState(
    initialOnlyClassifiedCommentReports,
  );
  const [bulkConfirmAction, setBulkConfirmAction] = useState<
    | null
    | {
        title: string;
        description: string;
        confirmLabel: string;
        run: () => Promise<void>;
      }
  >(null);

  const contextCounts = useMemo(() => {
    const counts: Record<TrustContextFilter, number> = {
      all: events.length,
      order: 0,
      ride: 0,
      delivery: 0,
      classified: 0,
      service: 0,
      community: 0,
    };
    for (const event of events) {
      switch (event.context_type) {
        case "order":
          counts.order += 1;
          break;
        case "ride":
          counts.ride += 1;
          break;
        case "delivery":
          counts.delivery += 1;
          break;
        case "classified":
          counts.classified += 1;
          break;
        case "service":
          counts.service += 1;
          break;
        case "community":
          counts.community += 1;
          break;
        default:
          break;
      }
    }
    return counts;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const byContext =
      contextFilter === "all"
        ? events
        : events.filter((event) => event.context_type === contextFilter);

    const byStatus = !onlyOpenEvents
      ? byContext
      : byContext.filter(
          (event) =>
            event.status === TRUST_EVENT_STATUSES.ACTIVE ||
            event.status === TRUST_EVENT_STATUSES.UNDER_REVIEW,
        );

    if (!onlyClassifiedCommentReports) return byStatus;
    return byStatus.filter(
      (event) =>
        event.context_type === "classified" &&
        event.reason_code.startsWith("classified_comment_"),
    );
  }, [events, contextFilter, onlyOpenEvents, onlyClassifiedCommentReports]);
  const selectedSet = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);
  const selectedEvents = useMemo(
    () => filteredEvents.filter((event) => selectedSet.has(event.id)),
    [filteredEvents, selectedSet],
  );
  const selectedClassifiedEvents = useMemo(
    () => selectedEvents.filter((event) => event.context_type === "classified"),
    [selectedEvents],
  );

  const decisions = useMemo(
    () => TrustPolicyService.buildProfileDecisions(filteredEvents),
    [filteredEvents],
  );
  const attentionQueue = decisions
    .filter((decision) => decision.risk_level !== "trusted")
    .slice(0, 8);

  const criticalClassifiedEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.context_type === "classified" &&
          (event.severity === "high" || event.severity === "critical") &&
          event.status !== TRUST_EVENT_STATUSES.DISMISSED,
      ).length,
    [events],
  );

  const openClassifiedCommentReports = useMemo(
    () =>
      events.filter(
        (event) =>
          event.context_type === "classified" &&
          event.reason_code.startsWith("classified_comment_") &&
          (event.status === TRUST_EVENT_STATUSES.ACTIVE ||
            event.status === TRUST_EVENT_STATUSES.UNDER_REVIEW),
      ).length,
    [events],
  );

  async function loadEvents() {
    setLoading(true);
    try {
      const result = await TrustEventService.listEvents({ limit: 120 });
      if (result.error) {
        toast.error(result.error);
        setEvents([]);
      } else {
        setEvents(result.data);
      }
    } catch (error) {
      logger.error("[TrustEventsQueue] loadEvents", error as Error);
      toast.error("Erro ao carregar eventos de confianca.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);
  useEffect(() => {
    if (lockContextFilter) {
      setContextFilter(initialContextFilter);
    }
  }, [lockContextFilter, initialContextFilter]);
  useEffect(() => {
    if (lockOnlyOpenEvents) {
      setOnlyOpenEvents(initialOnlyOpenEvents);
    }
  }, [lockOnlyOpenEvents, initialOnlyOpenEvents]);
  useEffect(() => {
    if (lockOnlyClassifiedCommentReports) {
      setOnlyClassifiedCommentReports(initialOnlyClassifiedCommentReports);
    }
  }, [lockOnlyClassifiedCommentReports, initialOnlyClassifiedCommentReports]);
  useEffect(() => {
    setSelectedEventIds([]);
  }, [contextFilter, onlyOpenEvents, onlyClassifiedCommentReports]);

  async function review(eventId: string, status: TrustEventStatus) {
    if (!activeProfile?.id) {
      toast.error("Perfil admin ativo obrigatorio.");
      return;
    }

    setReviewingId(eventId);
    const result = await TrustEventService.reviewEvent(eventId, {
      status,
      reviewed_by_profile_id: activeProfile.id,
      resolution_notes: readResolutionNote(resolutionNotes, eventId),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Evento atualizado.");
      await loadEvents();
    }

    setReviewingId(null);
  }

  async function applyAction(
    event: TrustEvent,
    actionType: (typeof TRUST_ADMIN_ACTION_TYPES)[keyof typeof TRUST_ADMIN_ACTION_TYPES],
    durationDays?: number,
  ) {
    if (!activeProfile?.id) {
      toast.error("Perfil admin ativo obrigatorio.");
      return;
    }

    const note = readResolutionNote(resolutionNotes, event.id);
    const reason = note || `Acao administrativa por evento ${event.event_type}`;

    setReviewingId(event.id);
    const result = await TrustEventService.applyAdminAction({
      trust_event_id: event.id,
      subject_profile_id: event.subject_profile_id,
      subject_role: event.subject_role,
      applied_by_profile_id: activeProfile.id,
      action_type: actionType,
      reason,
      notes: note || null,
      duration_days: durationDays,
      metadata: {
        event_type: event.event_type,
        severity: event.severity,
        context_type: event.context_type,
        context_id: event.context_id,
      },
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Acao administrativa aplicada.");
      await loadEvents();
    }

    setReviewingId(null);
  }

  function toggleSelection(eventId: string) {
    setSelectedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    );
  }

  function toggleSelectAllFiltered() {
    const ids = filteredEvents.map((event) => event.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedSet.has(id));
    setSelectedEventIds(allSelected ? [] : ids);
  }

  async function applyBulkReview(status: TrustEventStatus) {
    if (!activeProfile?.id || selectedEvents.length === 0) return;
    setReviewingId("bulk");
    const notes = "Atualizacao em lote de moderacao.";
    await Promise.all(
      selectedEvents.map((event) =>
        TrustEventService.reviewEvent(event.id, {
          status,
          reviewed_by_profile_id: activeProfile.id!,
          resolution_notes: readResolutionNote(resolutionNotes, event.id) || notes,
        }),
      ),
    );
    setSelectedEventIds([]);
    await loadEvents();
    setReviewingId(null);
    toast.success("Atualizacao em lote concluida.");
  }

  async function applyBulkAdminAction(
    actionType: (typeof TRUST_ADMIN_ACTION_TYPES)[keyof typeof TRUST_ADMIN_ACTION_TYPES],
    durationDays?: number,
  ) {
    if (!activeProfile?.id || selectedEvents.length === 0) return;
    setReviewingId("bulk");

    await Promise.all(
      selectedEvents.map((event) =>
        TrustEventService.applyAdminAction({
          trust_event_id: event.id,
          subject_profile_id: event.subject_profile_id,
          subject_role: event.subject_role,
          applied_by_profile_id: activeProfile.id!,
          action_type: actionType,
          reason:
            readResolutionNote(resolutionNotes, event.id) ||
            `Acao administrativa em lote (${actionType})`,
          notes: readResolutionNote(resolutionNotes, event.id),
          duration_days: durationDays,
          metadata: {
            batch: true,
            event_type: event.event_type,
            severity: event.severity,
            context_type: event.context_type,
            context_id: event.context_id,
          },
        }),
      ),
    );

    setSelectedEventIds([]);
    await loadEvents();
    setReviewingId(null);
    toast.success("Acao administrativa em lote concluida.");
  }

  function confirmBulkAction(input: {
    title: string;
    description: string;
    confirmLabel: string;
    run: () => Promise<void>;
  }) {
    setBulkConfirmAction(input);
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando eventos...</div>;
  }

  return (
    <div className="space-y-6">
      {!hideScoreSummary && (
        <TrustEventsQueueSummary
          decisionsCount={decisions.length}
          attentionQueue={attentionQueue}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Fila de confianca operacional ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length > 0 && (
            <TrustEventsQueueBulkActions
              selectedEventsCount={selectedEvents.length}
              selectedClassifiedEventsCount={selectedClassifiedEvents.length}
              reviewingId={reviewingId}
              onBulkReview={applyBulkReview}
              onBulkAdminAction={applyBulkAdminAction}
              onConfirmBulkAction={confirmBulkAction}
            />
          )}

          <TrustEventsQueueFilters
            contextCounts={contextCounts}
            contextFilter={contextFilter}
            lockContextFilter={lockContextFilter}
            onlyOpenEvents={onlyOpenEvents}
            lockOnlyOpenEvents={lockOnlyOpenEvents}
            onlyClassifiedCommentReports={onlyClassifiedCommentReports}
            lockOnlyClassifiedCommentReports={lockOnlyClassifiedCommentReports}
            criticalClassifiedEvents={criticalClassifiedEvents}
            openClassifiedCommentReports={openClassifiedCommentReports}
            selectedEventsCount={selectedEvents.length}
            filteredEventsCount={filteredEvents.length}
            onContextFilterChange={setContextFilter}
            onOnlyOpenEventsChange={setOnlyOpenEvents}
            onOnlyClassifiedCommentReportsChange={setOnlyClassifiedCommentReports}
            onToggleSelectAllFiltered={toggleSelectAllFiltered}
          />

          {filteredEvents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum evento de confianca para o filtro selecionado.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <TrustEventQueueCard
                  key={event.id}
                  event={event}
                  selected={selectedSet.has(event.id)}
                  resolutionNote={getRecordValue(resolutionNotes, event.id) ?? ""}
                  disabled={reviewingId === event.id}
                  onToggleSelection={toggleSelection}
                  onResolutionNoteChange={(eventId, value) =>
                    setResolutionNotes((current) => ({
                      ...current,
                      [eventId]: value,
                    }))
                  }
                  onReview={review}
                  onApplyAction={applyAction}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={Boolean(bulkConfirmAction)}
        onOpenChange={(open) => {
          if (!open && reviewingId !== "bulk") setBulkConfirmAction(null);
        }}
        title={bulkConfirmAction?.title ?? "Confirmar acao"}
        description={bulkConfirmAction?.description ?? "Deseja continuar?"}
        confirmLabel={bulkConfirmAction?.confirmLabel ?? "Confirmar"}
        onConfirm={() => {
          if (!bulkConfirmAction) return;
          void bulkConfirmAction.run().finally(() => {
            setBulkConfirmAction(null);
          });
        }}
        disabled={reviewingId === "bulk"}
      />
    </div>
  );
}
