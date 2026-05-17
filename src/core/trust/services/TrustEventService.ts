import { supabase } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { NotificationService } from "@/core/notifications/services/NotificationService";
import { logger } from "@/shared/utils/logger";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import {
  TRUST_ADMIN_ACTION_TYPES,
  TRUST_EVENT_STATUSES,
  TRUST_VISIBILITIES,
  type ApplyTrustAdminActionInput,
  type CreateTrustEventInput,
  type TrustAdminAction,
  type TrustActorRole,
  type TrustEvent,
  type TrustEventFilters,
  type TrustPolicyDecision,
  type TrustScoreSummary,
} from "../domain";
import { TrustPolicyService } from "./TrustPolicyService";

const TRUST_EVENTS_TABLE = "trust_events";
const TRUST_ADMIN_ACTIONS_TABLE = "trust_admin_actions";

type TrustEventRow = Record<string, unknown>;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro inesperado no SSOT de confianca operacional.";
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function mapTrustEvent(row: TrustEventRow): TrustEvent {
  return {
    id: String(row.id),
    actor_profile_id: (row.actor_profile_id as string | null) ?? null,
    actor_role: row.actor_role as TrustEvent["actor_role"],
    subject_profile_id: String(row.subject_profile_id),
    subject_role: row.subject_role as TrustEvent["subject_role"],
    context_type: row.context_type as TrustEvent["context_type"],
    context_id: String(row.context_id),
    event_type: row.event_type as TrustEvent["event_type"],
    rating:
      row.rating === null || row.rating === undefined
        ? null
        : Number(row.rating),
    reason_code: String(row.reason_code),
    severity: row.severity as TrustEvent["severity"],
    visibility: row.visibility as TrustEvent["visibility"],
    description: (row.description as string | null) ?? null,
    evidence: asRecord(row.evidence),
    status: row.status as TrustEvent["status"],
    reviewed_by_profile_id: (row.reviewed_by_profile_id as string | null) ?? null,
    reviewed_at: (row.reviewed_at as string | null) ?? null,
    resolution_notes: (row.resolution_notes as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapTrustAdminAction(row: TrustEventRow): TrustAdminAction {
  return {
    id: String(row.id),
    trust_event_id: (row.trust_event_id as string | null) ?? null,
    subject_profile_id: String(row.subject_profile_id),
    subject_role: row.subject_role as TrustAdminAction["subject_role"],
    action_type: row.action_type as TrustAdminAction["action_type"],
    applied_by_profile_id: String(row.applied_by_profile_id),
    reason: String(row.reason),
    notes: (row.notes as string | null) ?? null,
    starts_at: String(row.starts_at),
    ends_at: (row.ends_at as string | null) ?? null,
    metadata: asRecord(row.metadata),
    created_at: String(row.created_at),
  };
}

function assertRating(rating?: number | null): void {
  if (rating === null || rating === undefined) return;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Avaliacao deve ser um numero inteiro entre 1 e 5.");
  }
}

function trustContextActionUrl(event: Pick<TrustEvent, "context_type" | "context_id">): string {
  if (event.context_type === "order") {
    return businessManagementRoutes.gastronomyPedidoPublico(event.context_id);
  }
  if (event.context_type === "delivery" || event.context_type === "ride") {
    return mobilityRoutes.motoboy.entregas;
  }
  if (event.context_type === "classified") {
    return `/classificados/${event.context_id}`;
  }
  if (event.context_type === "service") {
    return "/central/profissional";
  }
  if (event.context_type === "community") {
    return "/comunidade";
  }
  return "/admin/moderacao";
}

export class TrustEventService {
  private static async getTrustEventById(eventId: string): Promise<TrustEvent | null> {
    try {
      const { data, error } = await supabase
        .from(TRUST_EVENTS_TABLE)
        .select("*")
        .eq("id", eventId)
        .maybeSingle<TrustEventRow>();
      if (error || !data) return null;
      return mapTrustEvent(data);
    } catch {
      return null;
    }
  }

  private static async getUserIdForProfile(profileId?: string | null): Promise<string | null> {
    if (!profileId) return null;
    try {
      const profile = await profileService.getProfileById(profileId);
      return typeof profile?.user_id === "string" ? profile.user_id : null;
    } catch {
      return null;
    }
  }

  private static async notifyTrustEventCreated(event: TrustEvent): Promise<void> {
    const [subjectUserId, actorUserId] = await Promise.all([
      this.getUserIdForProfile(event.subject_profile_id),
      this.getUserIdForProfile(event.actor_profile_id),
    ]);

    const baseMetadata = {
      source: "trust_event",
      trust_event_id: event.id,
      context_type: event.context_type,
      context_id: event.context_id,
      event_type: event.event_type,
      reason_code: event.reason_code,
      severity: event.severity,
      status: event.status,
    };

    const tasks: Promise<unknown>[] = [];

    if (subjectUserId) {
      tasks.push(NotificationService.createNotification({
        user_id: subjectUserId,
        type: event.severity === "critical" || event.severity === "high" ? "warning" : "info",
        category: "transactional",
        title: "Evento de confianca registrado",
        message:
          "Um evento operacional foi registrado no seu perfil e pode impactar prioridade de chamados.",
        action_url: trustContextActionUrl(event),
        action_label: "Ver contexto",
        metadata: { ...baseMetadata, audience: "subject" },
      }));
    }

    if (actorUserId && actorUserId !== subjectUserId) {
      tasks.push(NotificationService.createNotification({
        user_id: actorUserId,
        type: "info",
        category: "transactional",
        title: "Feedback registrado",
        message: "Seu feedback operacional foi recebido para analise administrativa.",
        action_url: trustContextActionUrl(event),
        action_label: "Ver contexto",
        metadata: { ...baseMetadata, audience: "actor" },
      }));
    }

    if (tasks.length === 0) return;
    const results = await Promise.allSettled(tasks);
    const failedCount = results.filter((result) => result.status === "rejected").length;
    if (failedCount > 0) {
      logger.warn("[TrustEventService] notifyTrustEventCreated.partial_failure", {
        trust_event_id: event.id,
        failed_count: failedCount,
        total: tasks.length,
      });
    }
  }

  private static async notifyTrustAdminAction(action: TrustAdminAction): Promise<void> {
    const [subjectUserId, adminUserId] = await Promise.all([
      this.getUserIdForProfile(action.subject_profile_id),
      this.getUserIdForProfile(action.applied_by_profile_id),
    ]);

    const linkedEvent = action.trust_event_id
      ? await this.getTrustEventById(action.trust_event_id)
      : null;
    const subjectActionUrl = linkedEvent ? trustContextActionUrl(linkedEvent) : "/conta";
    const adminActionUrl = "/admin/moderacao";
    const metadata = {
      source: "trust_admin_action",
      trust_admin_action_id: action.id,
      trust_event_id: action.trust_event_id,
      subject_profile_id: action.subject_profile_id,
      subject_role: action.subject_role,
      action_type: action.action_type,
    };

    const tasks: Promise<unknown>[] = [];

    if (subjectUserId) {
      tasks.push(NotificationService.createNotification({
        user_id: subjectUserId,
        type: action.action_type === TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION ? "success" : "warning",
        category: "transactional",
        title: "Atualizacao administrativa de confianca",
        message:
          action.action_type === TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION
            ? "Sua restricao operacional foi removida."
            : "Uma acao administrativa foi aplicada no seu perfil.",
        action_url: subjectActionUrl,
        action_label: "Ver contexto",
        metadata: { ...metadata, audience: "subject" },
      }));
    }

    if (adminUserId && adminUserId !== subjectUserId) {
      tasks.push(NotificationService.createNotification({
        user_id: adminUserId,
        type: "success",
        category: "transactional",
        title: "Acao administrativa aplicada",
        message: "A acao de confianca foi registrada com sucesso no SSOT.",
        action_url: adminActionUrl,
        action_label: "Ver fila",
        metadata: { ...metadata, audience: "admin" },
      }));
    }

    if (tasks.length === 0) return;
    const results = await Promise.allSettled(tasks);
    const failedCount = results.filter((result) => result.status === "rejected").length;
    if (failedCount > 0) {
      logger.warn("[TrustEventService] notifyTrustAdminAction.partial_failure", {
        trust_admin_action_id: action.id,
        failed_count: failedCount,
        total: tasks.length,
      });
    }
  }

  static async createEvent(input: CreateTrustEventInput): Promise<{
    data: TrustEvent | null;
    error: string | null;
  }> {
    try {
      assertRating(input.rating);

      const payload = {
        actor_profile_id: input.actor_profile_id ?? null,
        actor_role: input.actor_role,
        subject_profile_id: input.subject_profile_id,
        subject_role: input.subject_role,
        context_type: input.context_type,
        context_id: input.context_id,
        event_type: input.event_type,
        rating: input.rating ?? null,
        reason_code: input.reason_code,
        severity: input.severity ?? "low",
        visibility: input.visibility ?? TRUST_VISIBILITIES.PRIVATE,
        description: input.description ?? null,
        evidence: input.evidence ?? {},
        status: input.status ?? TRUST_EVENT_STATUSES.ACTIVE,
      };

      const { data, error } = await supabase
        .from(TRUST_EVENTS_TABLE)
        .insert(payload)
        .select("*")
        .single<TrustEventRow>();

      if (error) return { data: null, error: error.message };
      const createdEvent = mapTrustEvent(data);
      await this.notifyTrustEventCreated(createdEvent).catch((notifyError) => {
        logger.warn("[TrustEventService] notifyTrustEventCreated", {
          trust_event_id: createdEvent.id,
          error:
            notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      });
      return { data: createdEvent, error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] createEvent", error as Error, input);
      return { data: null, error: message };
    }
  }

  static async upsertOperationalFeedback(input: CreateTrustEventInput): Promise<{
    data: TrustEvent | null;
    error: string | null;
  }> {
    try {
      assertRating(input.rating);

      const payload = {
        actor_profile_id: input.actor_profile_id ?? null,
        actor_role: input.actor_role,
        subject_profile_id: input.subject_profile_id,
        subject_role: input.subject_role,
        context_type: input.context_type,
        context_id: input.context_id,
        event_type: input.event_type,
        rating: input.rating ?? null,
        reason_code: input.reason_code,
        severity: input.severity ?? "low",
        visibility: input.visibility ?? TRUST_VISIBILITIES.PRIVATE,
        description: input.description ?? null,
        evidence: input.evidence ?? {},
        status: input.status ?? TRUST_EVENT_STATUSES.ACTIVE,
      };

      const { data: existing, error: existingError } = await supabase
        .from(TRUST_EVENTS_TABLE)
        .select("id")
        .eq("actor_profile_id", payload.actor_profile_id)
        .eq("subject_profile_id", payload.subject_profile_id)
        .eq("actor_role", payload.actor_role)
        .eq("subject_role", payload.subject_role)
        .eq("context_type", payload.context_type)
        .eq("context_id", payload.context_id)
        .eq("event_type", payload.event_type)
        .maybeSingle<{ id: string }>();

      if (existingError) {
        return { data: null, error: existingError.message };
      }

      const mutation = existing?.id
        ? supabase
            .from(TRUST_EVENTS_TABLE)
            .update(payload)
            .eq("id", existing.id)
            .select("*")
            .single<TrustEventRow>()
        : supabase
            .from(TRUST_EVENTS_TABLE)
            .insert(payload)
            .select("*")
            .single<TrustEventRow>();

      const { data, error } = await mutation;

      if (error) return { data: null, error: error.message };
      const mapped = mapTrustEvent(data);
      await this.notifyTrustEventCreated(mapped).catch((notifyError) => {
        logger.warn("[TrustEventService] notifyTrustEventCreated", {
          trust_event_id: mapped.id,
          error:
            notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      });
      return { data: mapped, error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] upsertOperationalFeedback", error as Error, input);
      return { data: null, error: message };
    }
  }

  static async listEvents(filters: TrustEventFilters = {}): Promise<{
    data: TrustEvent[];
    error: string | null;
  }> {
    try {
      let query = supabase
        .from(TRUST_EVENTS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 50);

      if (filters.subject_profile_id) {
        query = query.eq("subject_profile_id", filters.subject_profile_id);
      }
      if (filters.actor_profile_id) {
        query = query.eq("actor_profile_id", filters.actor_profile_id);
      }
      if (filters.context_type) {
        query = query.eq("context_type", filters.context_type);
      }
      if (filters.context_id) {
        query = query.eq("context_id", filters.context_id);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []).map(mapTrustEvent), error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] listEvents", error as Error, filters);
      return { data: [], error: message };
    }
  }

  static async getScoreSummary(
    profileId: string,
    role: TrustActorRole,
  ): Promise<{ data: TrustScoreSummary | null; error: string | null }> {
    const result = await this.listEvents({
      subject_profile_id: profileId,
      limit: 500,
    });

    if (result.error) return { data: null, error: result.error };

    return {
      data: TrustPolicyService.buildScoreSummary(profileId, role, result.data),
      error: null,
    };
  }

  static async getPolicyDecision(
    profileId: string,
    role: TrustActorRole,
  ): Promise<{ data: TrustPolicyDecision | null; error: string | null }> {
    const result = await this.listEvents({
      subject_profile_id: profileId,
      limit: 500,
    });

    if (result.error) return { data: null, error: result.error };

    return {
      data: TrustPolicyService.evaluateProfile(profileId, role, result.data),
      error: null,
    };
  }

  static async canReceiveOperationalCall(
    profileId: string,
    role: TrustActorRole,
  ): Promise<{
    allowed: boolean;
    decision: TrustPolicyDecision | null;
    reason: string | null;
  }> {
    const result = await this.getPolicyDecision(profileId, role);
    if (result.error) {
      return {
        allowed: false,
        decision: null,
        reason: result.error,
      };
    }

    const decision = result.data;
    if (!decision) {
      return {
        allowed: false,
        decision: null,
        reason: "Politica de confianca indisponivel.",
      };
    }

    if (decision.dispatch_policy === "block_until_admin_review") {
      return {
        allowed: false,
        decision,
        reason: `Perfil bloqueado para novos chamados ate revisao admin: ${decision.reasons.join(", ")}`,
      };
    }

    return { allowed: true, decision, reason: null };
  }

  static async reviewEvent(
    eventId: string,
    input: {
      status: TrustEvent["status"];
      reviewed_by_profile_id: string;
      resolution_notes?: string | null;
    },
  ): Promise<{ data: TrustEvent | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from(TRUST_EVENTS_TABLE)
        .update({
          status: input.status,
          reviewed_by_profile_id: input.reviewed_by_profile_id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: input.resolution_notes ?? null,
        })
        .eq("id", eventId)
        .select("*")
        .single<TrustEventRow>();

      if (error) return { data: null, error: error.message };
      return { data: mapTrustEvent(data), error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] reviewEvent", error as Error, {
        eventId,
        input,
      });
      return { data: null, error: message };
    }
  }

  static async applyAdminAction(input: ApplyTrustAdminActionInput): Promise<{
    data: TrustAdminAction | null;
    error: string | null;
  }> {
    try {
      if (!input.reason.trim()) {
        throw new Error("Motivo da acao administrativa e obrigatorio.");
      }

      const now = new Date();
      const endsAt =
        input.action_type === TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION
          ? new Date(
              now.getTime() + Math.max(1, input.duration_days ?? 7) * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null;

      const payload = {
        trust_event_id: input.trust_event_id ?? null,
        subject_profile_id: input.subject_profile_id,
        subject_role: input.subject_role,
        action_type: input.action_type,
        applied_by_profile_id: input.applied_by_profile_id,
        reason: input.reason.trim(),
        notes: input.notes?.trim() || null,
        starts_at: now.toISOString(),
        ends_at: endsAt,
        metadata: input.metadata ?? {},
      };

      const { data, error } = await supabase
        .from(TRUST_ADMIN_ACTIONS_TABLE)
        .insert(payload)
        .select("*")
        .single<TrustEventRow>();

      if (error) return { data: null, error: error.message };

      if (input.action_type === TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION) {
        await profileService.updateProfile(input.subject_profile_id, {
          is_suspended: true,
          suspended: true,
          suspended_at: now.toISOString(),
          suspended_until: endsAt,
          suspension_reason: input.reason.trim(),
        });
      }

      if (input.action_type === TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION) {
        await profileService.updateProfile(input.subject_profile_id, {
          is_suspended: false,
          suspended: false,
          suspended_until: null,
          suspension_reason: null,
        });
      }

      if (input.trust_event_id) {
        const status =
          input.action_type === TRUST_ADMIN_ACTION_TYPES.TEMPORARY_RESTRICTION
            ? TRUST_EVENT_STATUSES.PENALIZED
            : input.action_type === TRUST_ADMIN_ACTION_TYPES.CLEAR_RESTRICTION
              ? TRUST_EVENT_STATUSES.DISMISSED
              : TRUST_EVENT_STATUSES.CONFIRMED;

        await this.reviewEvent(input.trust_event_id, {
          status,
          reviewed_by_profile_id: input.applied_by_profile_id,
          resolution_notes: input.notes || input.reason,
        });
      }

      const adminAction = mapTrustAdminAction(data);
      await this.notifyTrustAdminAction(adminAction).catch((notifyError) => {
        logger.warn("[TrustEventService] notifyTrustAdminAction", {
          trust_admin_action_id: adminAction.id,
          error:
            notifyError instanceof Error ? notifyError.message : String(notifyError),
        });
      });
      return { data: adminAction, error: null };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] applyAdminAction", error as Error, input);
      return { data: null, error: message };
    }
  }

  static async listAdminActions(limit = 100): Promise<{
    data: TrustAdminAction[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from(TRUST_ADMIN_ACTIONS_TABLE)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return { data: [], error: error.message };
      return {
        data: ((data as TrustEventRow[] | null) ?? []).map(mapTrustAdminAction),
        error: null,
      };
    } catch (error) {
      const message = toErrorMessage(error);
      logger.error("[TrustEventService] listAdminActions", error as Error, { limit });
      return { data: [], error: message };
    }
  }
}
