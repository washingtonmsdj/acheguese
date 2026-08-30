import { supabase } from "@/integrations/supabase";
import { ProfessionalNotificationBrokerService } from "@/core/notifications/services/ProfessionalNotificationBrokerService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { SessionService } from "@/core/session/services/SessionService";
import { logger } from "@/shared/utils/logger";
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeString,
} from "@/shared/utils/sanitization";
import type {
  CreateProfessionalLeadInput,
  CreateProfessionalLeadQuoteInput,
  ProfessionalLeadDetails,
  ProfessionalLeadMessageRecord,
  ProfessionalLeadQuoteRecord,
  ProfessionalLeadRecord,
  ProfessionalLeadStatus,
  ProfessionalServiceEngagementRecord,
  SendProfessionalLeadMessageInput,
  SubmitProfessionalEngagementReviewInput,
  UpdateProfessionalLeadQuoteStatusInput,
  UpdateProfessionalLeadStatusInput,
  UpdateProfessionalServiceEngagementStatusInput,
} from "../types";
import type { Review } from "@/core/reviews/types";

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  upsert: (
    values: unknown | unknown[],
    options?: { onConflict?: string },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfessionalLeadDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

interface ProfessionalOwnerRecord {
  id: string;
  profile_id: string;
  professional_name: string | null;
  service_category: string | null;
  profiles: { user_id: string } | { user_id: string }[] | null;
}

interface ProfessionalLeadWithOwner extends ProfessionalLeadRecord {
  professional_data?: ProfessionalOwnerRecord | ProfessionalOwnerRecord[] | null;
}

interface ProfessionalServiceEngagementWithProfessional
  extends ProfessionalServiceEngagementRecord {
  professional_data?: { profile_id: string } | { profile_id: string }[] | null;
}

type ProfessionalLeadDetailsRelation = NonNullable<ProfessionalLeadDetails["professional"]>;

interface ProfessionalLeadDetailsRow extends ProfessionalLeadRecord {
  professional?: ProfessionalLeadDetailsRelation | ProfessionalLeadDetailsRelation[] | null;
}

interface ProfessionalLeadEventInsert {
  lead_id: string;
  event_type: string;
  actor_user_id: string | null;
  payload: Record<string, unknown>;
}

interface ProfessionalStatsContactsRow {
  contacts_count: number | null;
}

const professionalLeadDb = supabase as unknown as ProfessionalLeadDbClient;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function firstProfileUserId(profiles: ProfessionalOwnerRecord["profiles"]): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) {
    return profiles[0]?.user_id ?? null;
  }
  return profiles.user_id ?? null;
}

function normalizeLeadInput(input: CreateProfessionalLeadInput) {
  const requesterName = sanitizeString(input.requesterName).slice(0, 150);
  const serviceNeeded = sanitizeString(input.serviceNeeded).slice(0, 160);
  const description = sanitizeString(input.description).slice(0, 1000);
  const requesterPhone = sanitizePhone(input.requesterPhone);
  const requesterEmail = sanitizeEmail(input.requesterEmail);

  if (!input.professionalId) {
    throw new Error("Profissional invalido");
  }

  if (!requesterName || requesterName.length < 2) {
    throw new Error("Informe seu nome");
  }

  if (!serviceNeeded || serviceNeeded.length < 3) {
    throw new Error("Informe o servico desejado");
  }

  if (!description || description.length < 10) {
    throw new Error("Descreva melhor o que precisa");
  }

  if (!requesterPhone && !requesterEmail) {
    throw new Error("Informe telefone ou email para retorno");
  }

  return {
    professional_id: input.professionalId,
    requester_name: requesterName,
    requester_phone: requesterPhone ?? null,
    requester_email: requesterEmail ?? null,
    service_needed: serviceNeeded,
    description,
    preferred_date: input.preferredDate || null,
    preferred_time_window: sanitizeString(input.preferredTimeWindow).slice(0, 80) || null,
    neighborhood: sanitizeString(input.neighborhood).slice(0, 120) || null,
    location_id: input.locationId || null,
    source_channel: sanitizeString(input.sourceChannel || "public_profile").slice(0, 50),
    priority: input.priority || "normal",
    metadata: input.metadata || {},
  };
}

function getJoinedProfessional(
  lead: ProfessionalLeadWithOwner,
): ProfessionalOwnerRecord | null {
  return firstRelation(lead.professional_data);
}

export class ProfessionalLeadService {
  static async createLead(
    input: CreateProfessionalLeadInput,
  ): Promise<ServiceResult<ProfessionalLeadRecord>> {
    try {
      const normalized = normalizeLeadInput(input);
      const user = await SessionService.getCurrentUser();
      const activeProfile = user
        ? await SessionService.getActiveProfile(user.id)
        : null;
      const insertPayload = {
        ...normalized,
        requester_user_id: user?.id ?? null,
        requester_profile_id: activeProfile?.id ?? null,
      };

      if (!user) {
        const { error } = await professionalLeadDb
          .from<ProfessionalLeadRecord>("professional_leads")
          .insert(insertPayload);

        if (error) throw error;

        await this.incrementContactsCount(normalized.professional_id);
        return { success: true };
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadRecord>("professional_leads")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error) throw error;

      await this.incrementContactsCount(data.professional_id);

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] createLead failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao solicitar orcamento",
      };
    }
  }

  static async listLeadsForProfessional(
    professionalId: string,
    status?: ProfessionalLeadStatus,
  ): Promise<ServiceResult<ProfessionalLeadRecord[]>> {
    try {
      let query = professionalLeadDb
        .from<ProfessionalLeadRecord>("professional_leads")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data: data ?? [] };
    } catch (error) {
      logger.error("[ProfessionalLeadService] listLeadsForProfessional failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar orcamentos",
      };
    }
  }

  static async getLeadDetails(
    leadId: string,
  ): Promise<ServiceResult<ProfessionalLeadDetails>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadDetailsRow>("professional_leads")
        .select(
          `
          *,
          professional:professional_data(
            id,
            profile_id,
            professional_name,
            service_category,
            service_subcategory
          )
        `,
        )
        .eq("id", leadId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          ...data,
          professional: firstRelation(data.professional),
        },
      };
    } catch (error) {
      logger.error("[ProfessionalLeadService] getLeadDetails failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar orcamento",
      };
    }
  }

  static async listMessages(
    leadId: string,
  ): Promise<ServiceResult<ProfessionalLeadMessageRecord[]>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadMessageRecord>("professional_lead_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return { success: true, data: data ?? [] };
    } catch (error) {
      logger.error("[ProfessionalLeadService] listMessages failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar mensagens",
      };
    }
  }

  static async listQuotes(
    leadId: string,
  ): Promise<ServiceResult<ProfessionalLeadQuoteRecord[]>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadQuoteRecord>("professional_lead_quotes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, data: data ?? [] };
    } catch (error) {
      logger.error("[ProfessionalLeadService] listQuotes failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar propostas",
      };
    }
  }

  static async getEngagementByLead(
    leadId: string,
  ): Promise<ServiceResult<ProfessionalServiceEngagementRecord | null>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalServiceEngagementRecord>("professional_service_engagements")
        .select("*")
        .eq("lead_id", leadId)
        .maybeSingle();

      if (error) throw error;

      return {
        success: true,
        data: data ?? null,
      };
    } catch (error) {
      logger.error("[ProfessionalLeadService] getEngagementByLead failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar atendimento",
      };
    }
  }

  static async listEngagementsForProfessional(
    professionalId: string,
  ): Promise<ServiceResult<ProfessionalServiceEngagementRecord[]>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalServiceEngagementRecord>("professional_service_engagements")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, data: data ?? [] };
    } catch (error) {
      logger.error("[ProfessionalLeadService] listEngagementsForProfessional failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar atendimentos",
      };
    }
  }

  static async sendMessage(
    input: SendProfessionalLeadMessageInput,
  ): Promise<ServiceResult<ProfessionalLeadMessageRecord>> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) {
        throw new Error("Faca login para responder o orcamento");
      }

      const message = sanitizeString(input.message).slice(0, 2000);
      if (!message) {
        throw new Error("Informe a mensagem");
      }

      const leadResult = await this.getLeadWithOwner(input.leadId);
      if (!leadResult.success || !leadResult.data) {
        throw new Error(leadResult.error || "Orcamento nao encontrado");
      }

      const lead = leadResult.data;
      const owner = getJoinedProfessional(lead);
      const ownerUserId = firstProfileUserId(owner?.profiles ?? null);
      const senderRole = ownerUserId === user.id ? "professional" : "requester";

      if (senderRole === "requester" && lead.requester_user_id !== user.id) {
        throw new Error("Voce nao participa deste orcamento");
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadMessageRecord>("professional_lead_messages")
        .insert({
          lead_id: input.leadId,
          sender_user_id: user.id,
          sender_role: senderRole,
          message,
        })
        .select("*")
        .single();

      if (error) throw error;

      await this.recordEvent({
        leadId: input.leadId,
        eventType: "message_sent",
        actorUserId: user.id,
        payload: { sender_role: senderRole },
      });

      await ProfessionalNotificationBrokerService.notifyLeadMessage(data.id);

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] sendMessage failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar mensagem",
      };
    }
  }

  static async createQuote(
    input: CreateProfessionalLeadQuoteInput,
  ): Promise<ServiceResult<ProfessionalLeadQuoteRecord>> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) {
        throw new Error("Faca login para enviar proposta");
      }

      const description = sanitizeString(input.description).slice(0, 2000);
      if (!description) {
        throw new Error("Descreva a proposta");
      }

      if (!Number.isFinite(input.amountCents) || input.amountCents < 0) {
        throw new Error("Valor da proposta invalido");
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadQuoteRecord>("professional_lead_quotes")
        .insert({
          lead_id: input.leadId,
          professional_user_id: user.id,
          amount_cents: Math.round(input.amountCents),
          description,
          estimated_start_date: input.estimatedStartDate || null,
          estimated_duration: sanitizeString(input.estimatedDuration).slice(0, 120) || null,
        })
        .select("*")
        .single();

      if (error) throw error;

      await this.updateLeadStatus({ leadId: input.leadId, status: "quoted" });
      await this.recordEvent({
        leadId: input.leadId,
        eventType: "quote_sent",
        actorUserId: user.id,
        payload: { amount_cents: Math.round(input.amountCents) },
      });

      await ProfessionalNotificationBrokerService.notifyLeadQuote(data.id);

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] createQuote failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao enviar proposta",
      };
    }
  }

  static async updateQuoteStatus(
    input: UpdateProfessionalLeadQuoteStatusInput,
  ): Promise<ServiceResult<ProfessionalLeadQuoteRecord>> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) {
        throw new Error("Faca login para atualizar a proposta");
      }

      const { data: currentQuote, error: quoteError } = await professionalLeadDb
        .from<ProfessionalLeadQuoteRecord>("professional_lead_quotes")
        .select("*")
        .eq("id", input.quoteId)
        .single();

      if (quoteError) throw quoteError;

      const leadResult = await this.getLeadWithOwner(currentQuote.lead_id);
      if (!leadResult.success || !leadResult.data) {
        throw new Error(leadResult.error || "Orcamento nao encontrado");
      }

      const owner = getJoinedProfessional(leadResult.data);
      const ownerUserId = firstProfileUserId(owner?.profiles ?? null);
      const isProfessional = ownerUserId === user.id;
      const isRequester = leadResult.data.requester_user_id === user.id;

      if (input.status === "cancelled" && !isProfessional) {
        throw new Error("Apenas o profissional pode cancelar a proposta");
      }

      if ((input.status === "accepted" || input.status === "declined") && !isRequester) {
        throw new Error("Apenas o cliente pode aceitar ou recusar a proposta");
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadQuoteRecord>("professional_lead_quotes")
        .update({ status: input.status })
        .eq("id", input.quoteId)
        .select("*")
        .single();

      if (error) throw error;

      await this.recordEvent({
        leadId: data.lead_id,
        eventType: "quote_status_updated",
        actorUserId: user.id,
        payload: { quote_id: data.id, status: data.status },
      });

      if (data.status === "accepted") {
        await this.updateLeadStatus({ leadId: data.lead_id, status: "scheduled" });
      }

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] updateQuoteStatus failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar proposta",
      };
    }
  }

  static async updateLeadStatus(
    input: UpdateProfessionalLeadStatusInput,
  ): Promise<ServiceResult<ProfessionalLeadRecord>> {
    try {
      const user = await SessionService.getCurrentUser();
      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadRecord>("professional_leads")
        .update({ status: input.status })
        .eq("id", input.leadId)
        .select("*")
        .single();

      if (error) throw error;

      await this.recordEvent({
        leadId: data.id,
        eventType: "status_updated",
        actorUserId: user?.id ?? null,
        payload: {
          status: input.status,
          note: sanitizeString(input.note),
        },
      });

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] updateLeadStatus failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar lead",
      };
    }
  }

  static async updateEngagementStatus(
    input: UpdateProfessionalServiceEngagementStatusInput,
  ): Promise<ServiceResult<ProfessionalServiceEngagementRecord>> {
    try {
      const user = await SessionService.getCurrentUser();
      const patch: Record<string, unknown> = { status: input.status };

      if (input.status === "completed") {
        patch.completed_at = new Date().toISOString();
      }

      if (input.status === "cancelled") {
        patch.cancelled_at = new Date().toISOString();
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalServiceEngagementRecord>("professional_service_engagements")
        .update(patch)
        .eq("id", input.engagementId)
        .select("*")
        .single();

      if (error) throw error;

      const leadStatus =
        input.status === "completed"
          ? "completed"
          : input.status === "cancelled"
            ? "cancelled"
            : "scheduled";

      await this.updateLeadStatus({
        leadId: data.lead_id,
        status: leadStatus,
        note: input.note,
      });
      await this.recordEvent({
        leadId: data.lead_id,
        eventType: "engagement_status_updated",
        actorUserId: user?.id ?? null,
        payload: {
          engagement_id: data.id,
          status: data.status,
          note: sanitizeString(input.note),
        },
      });

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] updateEngagementStatus failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao atualizar atendimento",
      };
    }
  }

  static async submitEngagementReview(
    input: SubmitProfessionalEngagementReviewInput,
  ): Promise<ServiceResult<Review>> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) {
        throw new Error("Faca login para avaliar o atendimento");
      }

      const rating = Math.round(input.rating);
      if (rating < 1 || rating > 5) {
        throw new Error("Nota invalida");
      }

      const { data, error } = await professionalLeadDb
        .from<ProfessionalServiceEngagementWithProfessional>("professional_service_engagements")
        .select(
          `
          *,
          professional_data(
            profile_id
          )
        `,
        )
        .eq("id", input.engagementId)
        .single();

      if (error) throw error;

      if (data.requester_user_id !== user.id) {
        throw new Error("Apenas o cliente do atendimento pode avaliar");
      }

      if (data.status !== "completed") {
        throw new Error("Avaliacao liberada apenas apos conclusao do atendimento");
      }

      if (!data.requester_profile_id) {
        throw new Error("Perfil do cliente nao encontrado para este atendimento");
      }

      const professional = firstRelation(data.professional_data);

      if (!professional?.profile_id) {
        throw new Error("Perfil profissional nao encontrado");
      }

      const { review } = await ReviewsService.upsertReview(
        {
          reviewed_profile_id: professional.profile_id,
          reviewer_profile_id: data.requester_profile_id,
          rating,
          comment: sanitizeString(input.comment).slice(0, 1000),
        },
        "professional",
      );

      await this.recordEvent({
        leadId: data.lead_id,
        eventType: "engagement_review_submitted",
        actorUserId: user.id,
        payload: {
          engagement_id: data.id,
          review_id: review.id,
          rating,
        },
      });

      return { success: true, data: review };
    } catch (error) {
      logger.error("[ProfessionalLeadService] submitEngagementReview failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao avaliar atendimento",
      };
    }
  }

  private static async recordEvent(input: {
    leadId: string;
    eventType: string;
    actorUserId: string | null;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await professionalLeadDb
      .from<ProfessionalLeadEventInsert>("professional_lead_events")
      .insert({
        lead_id: input.leadId,
        event_type: input.eventType,
        actor_user_id: input.actorUserId,
        payload: input.payload,
      });

    if (error) {
      logger.warn("[ProfessionalLeadService] lead event not recorded:", error);
    }
  }

  private static async getProfessionalOwner(
    professionalId: string,
  ): Promise<ProfessionalOwnerRecord | null> {
    const { data, error } = await professionalLeadDb
      .from<ProfessionalOwnerRecord>("professional_data")
      .select("id, profile_id, professional_name, service_category, profiles!inner(user_id)")
      .eq("id", professionalId)
      .maybeSingle();

    if (error) {
      logger.warn("[ProfessionalLeadService] owner lookup failed:", error);
      return null;
    }
    return data ?? null;
  }

  private static async getLeadWithOwner(
    leadId: string,
  ): Promise<ServiceResult<ProfessionalLeadWithOwner>> {
    try {
      const { data, error } = await professionalLeadDb
        .from<ProfessionalLeadWithOwner>("professional_leads")
        .select(
          `
          *,
          professional_data(
            id,
            profile_id,
            professional_name,
            service_category,
            profiles!inner(user_id)
          )
        `,
        )
        .eq("id", leadId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error("[ProfessionalLeadService] getLeadWithOwner failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao buscar orcamento",
      };
    }
  }

  private static async incrementContactsCount(professionalId: string): Promise<void> {
    const owner = await this.getProfessionalOwner(professionalId);
    if (!owner?.profile_id) return;

    const { data: current, error: currentError } = await professionalLeadDb
      .from<ProfessionalStatsContactsRow>("professional_stats")
      .select("contacts_count")
      .eq("profile_id", owner.profile_id)
      .maybeSingle();

    if (currentError) {
      logger.warn("[ProfessionalLeadService] contacts counter read failed:", currentError);
      return;
    }

    const contactsCount = Number(current?.contacts_count ?? 0) + 1;
    const { error } = await professionalLeadDb
      .from<ProfessionalStatsContactsRow>("professional_stats")
      .upsert(
        {
          profile_id: owner.profile_id,
          contacts_count: contactsCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
      );

    if (error) {
      logger.warn("[ProfessionalLeadService] contacts counter update failed:", error);
    }
  }

}