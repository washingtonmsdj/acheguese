import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Filter,
  CheckCircle2,
  Eye,
  CheckSquare,
  Square,
  ShieldAlert,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
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
import {
  ACTION_LABELS,
  asRecord,
  asString,
  CONTEXT_LABELS,
  getRiskVariant,
  getSeverityVariant,
  renderProfileShortId,
  RISK_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  type TrustContextFilter,
} from "./TrustEventsQueue.constants";

export interface TrustEventsQueueProps {
  initialContextFilter?: TrustContextFilter;
  lockContextFilter?: boolean;
  initialOnlyOpenEvents?: boolean;
  lockOnlyOpenEvents?: boolean;
  initialOnlyClassifiedCommentReports?: boolean;
  lockOnlyClassifiedCommentReports?: boolean;
  hideScoreSummary?: boolean;
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
      counts[event.context_type] += 1;
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
      resolution_notes: resolutionNotes[eventId]?.trim() || null,
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

    const note = resolutionNotes[event.id]?.trim();
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
          resolution_notes: resolutionNotes[event.id]?.trim() || notes,
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
            resolutionNotes[event.id]?.trim() ||
            `Acao administrativa em lote (${actionType})`,
          notes: resolutionNotes[event.id]?.trim() || null,
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              Score e reincidencia operacional ({decisions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attentionQueue.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                Nenhum perfil com risco operacional relevante nos eventos carregados.
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {attentionQueue.map((decision) => (
                  <div
                    key={`${decision.profile_id}:${decision.role}`}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getRiskVariant(decision.risk_level)}>
                            {RISK_LABELS[decision.risk_level]}
                          </Badge>
                          <Badge variant="outline">{decision.role}</Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium">
                          Perfil #{renderProfileShortId(decision.profile_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Politica de despacho: {decision.dispatch_policy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold">
                          {decision.summary.reliability_score}
                        </p>
                        <p className="text-xs text-muted-foreground">score</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold">{decision.recurrence_30d}</p>
                        <p className="text-muted-foreground">30 dias</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold">{decision.recurrence_90d}</p>
                        <p className="text-muted-foreground">90 dias</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <p className="font-semibold">
                          {decision.summary.average_rating?.toFixed(1) ?? "-"}
                        </p>
                        <p className="text-muted-foreground">media</p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm">
                      Acao recomendada:{" "}
                      <span className="font-medium">
                        {ACTION_LABELS[decision.recommended_action]}
                      </span>
                    </p>
                    {decision.reasons.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Motivos: {decision.reasons.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
            <div className="sticky top-3 z-20 mb-4 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {selectedEvents.length} selecionados
                  {selectedClassifiedEvents.length > 0
                    ? ` (${selectedClassifiedEvents.length} classificados)`
                    : ""}
                </p>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === "bulk"}
                    onClick={() => applyBulkReview(TRUST_EVENT_STATUSES.UNDER_REVIEW)}
                  >
                    Em analise
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === "bulk"}
                    onClick={() => applyBulkReview(TRUST_EVENT_STATUSES.CONFIRMED)}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewingId === "bulk"}
                    onClick={() =>
                      confirmBulkAction({
                        title: "Penalizar eventos em lote?",
                        description:
                          "Esta acao altera o status dos eventos selecionados para penalizado.",
                        confirmLabel: "Penalizar em lote",
                        run: () => applyBulkReview(TRUST_EVENT_STATUSES.PENALIZED),
                      })
                    }
                  >
                    Penalizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === "bulk"}
                    onClick={() => applyBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.WARNING)}
                  >
                    Aviso
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewingId === "bulk"}
                    onClick={() =>
                      confirmBulkAction({
                        title: "Aplicar restricao de 7 dias?",
                        description:
                          "Todos os perfis selecionados receberao restricao temporaria de 7 dias.",
                        confirmLabel: "Restringir 7 dias",
                        run: () =>
                          applyBulkAdminAction(
                            TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION,
                            7,
                          ),
                      })
                    }
                  >
                    Restr. 7d
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={reviewingId === "bulk"}
                    onClick={() =>
                      confirmBulkAction({
                        title: "Aplicar restricao de 30 dias?",
                        description:
                          "Todos os perfis selecionados receberao restricao temporaria de 30 dias.",
                        confirmLabel: "Restringir 30 dias",
                        run: () =>
                          applyBulkAdminAction(
                            TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION,
                            30,
                          ),
                      })
                    }
                  >
                    Restr. 30d
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === "bulk"}
                    onClick={() =>
                      confirmBulkAction({
                        title: "Remover restricoes em lote?",
                        description:
                          "Esta acao remove restricoes ativas dos perfis selecionados.",
                        confirmLabel: "Desbloquear em lote",
                        run: () =>
                          applyBulkAdminAction(TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION),
                      })
                    }
                  >
                    Desbloquear
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant={criticalClassifiedEvents > 0 ? "destructive" : "outline"}>
              Classificados graves: {criticalClassifiedEvents}
            </Badge>
            <Badge variant={openClassifiedCommentReports > 0 ? "secondary" : "outline"}>
              Denuncias de comentarios abertas: {openClassifiedCommentReports}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtrar contexto
            </div>
            {!lockContextFilter &&
              Object.keys(CONTEXT_LABELS).map((key) => {
                const filter = key as TrustContextFilter;
                return (
                  <Button
                    key={filter}
                    type="button"
                    size="sm"
                    variant={contextFilter === filter ? "default" : "outline"}
                    onClick={() => setContextFilter(filter)}
                    className="h-8"
                  >
                    {CONTEXT_LABELS[filter]} ({contextCounts[filter]})
                  </Button>
                );
              })}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleSelectAllFiltered}
              className="h-8"
            >
              {selectedEvents.length === filteredEvents.length && filteredEvents.length > 0 ? (
                <CheckSquare className="mr-1 h-3.5 w-3.5" />
              ) : (
                <Square className="mr-1 h-3.5 w-3.5" />
              )}
              Selecionar todos ({selectedEvents.length})
            </Button>
            {!lockOnlyOpenEvents && (
              <div className="ml-auto flex items-center gap-2 rounded-md border px-2 py-1">
                <Switch
                  id="trust-queue-only-open"
                  checked={onlyOpenEvents}
                  onCheckedChange={setOnlyOpenEvents}
                />
                <Label htmlFor="trust-queue-only-open" className="text-xs text-muted-foreground">
                  Apenas pendentes
                </Label>
              </div>
            )}
            {!lockOnlyClassifiedCommentReports && (
              <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                <Switch
                  id="trust-queue-only-classified-comment-reports"
                  checked={onlyClassifiedCommentReports}
                  onCheckedChange={setOnlyClassifiedCommentReports}
                />
                <Label
                  htmlFor="trust-queue-only-classified-comment-reports"
                  className="text-xs text-muted-foreground"
                >
                  Apenas denuncias de comentario
                </Label>
              </div>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum evento de confianca para o filtro selecionado.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
                  {/** contexto extra para moderacao de comentarios de classificados */}
                  {(() => {
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
                        <p className="font-medium">
                          Comentario denunciado: #{commentId.slice(0, 8)}
                        </p>
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
                  })()}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedSet.has(event.id)}
                          onCheckedChange={() => toggleSelection(event.id)}
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
                        value={resolutionNotes[event.id] ?? ""}
                        onChange={(input) =>
                          setResolutionNotes((current) => ({
                            ...current,
                            [event.id]: input.target.value,
                          }))
                        }
                        placeholder="Nota admin: aviso aplicado, sem acao, reincidencia..."
                        disabled={reviewingId === event.id}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === event.id}
                          onClick={() => review(event.id, TRUST_EVENT_STATUSES.UNDER_REVIEW)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Analisar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === event.id}
                          onClick={() => review(event.id, TRUST_EVENT_STATUSES.CONFIRMED)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === event.id}
                          onClick={() => review(event.id, TRUST_EVENT_STATUSES.DISMISSED)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Descartar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reviewingId === event.id}
                          onClick={() => review(event.id, TRUST_EVENT_STATUSES.PENALIZED)}
                        >
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                          Penalizar
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === event.id}
                          onClick={() =>
                            applyAction(event, TRUST_ADMIN_ACTION_TYPES.WARNING)
                          }
                        >
                          Avisar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewingId === event.id}
                          onClick={() =>
                            applyAction(event, TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION)
                          }
                        >
                          Desbloquear
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reviewingId === event.id}
                          onClick={() =>
                            applyAction(
                              event,
                              TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION,
                              7,
                            )
                          }
                        >
                          Restringir 7d
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reviewingId === event.id}
                          onClick={() =>
                            applyAction(
                              event,
                              TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION,
                              30,
                            )
                          }
                        >
                          Restringir 30d
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
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
