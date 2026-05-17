import { TrustEventService } from "@/core/trust";
import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TRUST_EVENT_TYPES,
  TRUST_VISIBILITIES,
  type TrustEvent,
} from "@/core/trust/domain";
import { supabase } from "@/integrations/supabase";

export type OpportunityFeedbackAnswer = "helped" | "found_someone" | "service_done" | "no_help";

export interface SubmitOpportunityFeedbackInput {
  answer: OpportunityFeedbackAnswer;
  opportunityId: string;
  professionalId: string;
  subjectProfileId: string;
  actorProfileId?: string | null;
  comment?: string;
}

export interface ProfessionalReputationSnapshot {
  professional_id: string;
  total_feedback: number;
  avg_rating: number;
  positive_feedback: number;
  neutral_feedback: number;
  negative_feedback: number;
  recent_events: TrustEvent[];
}

function feedbackToRating(answer: OpportunityFeedbackAnswer): number {
  if (answer === "service_done") return 5;
  if (answer === "found_someone") return 4;
  if (answer === "helped") return 4;
  return 2;
}

function feedbackToSeverity(answer: OpportunityFeedbackAnswer): "low" | "medium" | "high" | "critical" {
  if (answer === "no_help") return "medium";
  return "low";
}

class WorkOpportunityTrustServiceClass {
  async submitFeedback(input: SubmitOpportunityFeedbackInput): Promise<{ ok: boolean; error?: string }> {
    const rating = feedbackToRating(input.answer);
    const severity = feedbackToSeverity(input.answer);

    const result = await TrustEventService.upsertOperationalFeedback({
      actor_profile_id: input.actorProfileId ?? null,
      actor_role: TRUST_ACTOR_ROLES.CUSTOMER,
      subject_profile_id: input.subjectProfileId,
      subject_role: TRUST_ACTOR_ROLES.CUSTOMER,
      context_type: TRUST_CONTEXT_TYPES.SERVICE,
      context_id: input.professionalId,
      event_type: TRUST_EVENT_TYPES.OPERATIONAL_FEEDBACK,
      rating,
      reason_code: `work_opportunity_${input.answer}`,
      severity,
      visibility: TRUST_VISIBILITIES.PRIVATE,
      description: input.comment?.trim() || null,
      evidence: {
        opportunity_id: input.opportunityId,
        professional_id: input.professionalId,
        answer: input.answer,
      },
    });

    if (result.error) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  }

  async getProfessionalReputation(professionalId: string): Promise<ProfessionalReputationSnapshot> {
    const { data, error } = await (supabase as any)
      .from("trust_events")
      .select("*")
      .eq("context_type", TRUST_CONTEXT_TYPES.SERVICE)
      .eq("context_id", professionalId)
      .eq("event_type", TRUST_EVENT_TYPES.OPERATIONAL_FEEDBACK)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error || !data) {
      return {
        professional_id: professionalId,
        total_feedback: 0,
        avg_rating: 0,
        positive_feedback: 0,
        neutral_feedback: 0,
        negative_feedback: 0,
        recent_events: [],
      };
    }

    const rows = data as TrustEvent[];
    const ratings = rows.map((row) => row.rating ?? 0).filter((rating) => rating > 0);
    const total = ratings.length;
    const avg = total > 0 ? ratings.reduce((sum, value) => sum + value, 0) / total : 0;

    const positive = rows.filter((row) => (row.rating ?? 0) >= 4).length;
    const neutral = rows.filter((row) => (row.rating ?? 0) === 3).length;
    const negative = rows.filter((row) => (row.rating ?? 0) <= 2 && (row.rating ?? 0) > 0).length;

    return {
      professional_id: professionalId,
      total_feedback: total,
      avg_rating: Number(avg.toFixed(2)),
      positive_feedback: positive,
      neutral_feedback: neutral,
      negative_feedback: negative,
      recent_events: rows.slice(0, 10),
    };
  }
}

export const workOpportunityTrustService = new WorkOpportunityTrustServiceClass();
export { workOpportunityTrustService as WorkOpportunityTrustService };
