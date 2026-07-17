import { supabase } from "@/integrations/supabase";

export interface OperationalTrustFeedbackInput {
  subjectProfileId: string;
  rating: number;
  reasonCode: string;
  description?: string | null;
}

export interface TrustCommandResult {
  eventId: string;
  status: string;
}

export type WorkOpportunityFeedbackAnswer =
  | "helped"
  | "found_someone"
  | "service_done"
  | "no_help";

function normalizeCommandResult(value: unknown): TrustCommandResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta invalida do comando de confianca.");
  }

  const record = value as Record<string, unknown>;
  if (typeof record.eventId !== "string" || typeof record.status !== "string") {
    throw new Error("Resposta incompleta do comando de confianca.");
  }

  return { eventId: record.eventId, status: record.status };
}

export class OperationalTrustCommandService {
  static async submitClassifiedFeedback(
    classifiedId: string,
    input: OperationalTrustFeedbackInput,
  ): Promise<TrustCommandResult> {
    const { data, error } = await supabase.rpc(
      "submit_classified_trust_feedback",
      {
        p_classified_id: classifiedId,
        p_subject_profile_id: input.subjectProfileId,
        p_rating: input.rating,
        p_reason_code: input.reasonCode,
        p_description: input.description?.trim() || null,
      },
    );
    if (error) throw error;
    return normalizeCommandResult(data);
  }

  static async submitOrderFeedback(
    orderId: string,
    input: OperationalTrustFeedbackInput,
  ): Promise<TrustCommandResult> {
    const { data, error } = await supabase.rpc(
      "submit_order_trust_feedback",
      {
        p_order_id: orderId,
        p_subject_profile_id: input.subjectProfileId,
        p_rating: input.rating,
        p_reason_code: input.reasonCode,
        p_description: input.description?.trim() || null,
      },
    );
    if (error) throw error;
    return normalizeCommandResult(data);
  }

  static async submitRideFeedback(
    rideId: string,
    input: OperationalTrustFeedbackInput,
  ): Promise<TrustCommandResult> {
    const { data, error } = await supabase.rpc(
      "submit_ride_trust_feedback",
      {
        p_ride_id: rideId,
        p_subject_profile_id: input.subjectProfileId,
        p_rating: input.rating,
        p_reason_code: input.reasonCode,
        p_description: input.description?.trim() || null,
      },
    );
    if (error) throw error;
    return normalizeCommandResult(data);
  }

  static async submitWorkOpportunityFeedback(input: {
    opportunityId: string;
    answer: WorkOpportunityFeedbackAnswer;
    description?: string | null;
  }): Promise<TrustCommandResult> {
    const { data, error } = await supabase.rpc(
      "submit_work_opportunity_feedback",
      {
        p_opportunity_id: input.opportunityId,
        p_answer: input.answer,
        p_description: input.description?.trim() || null,
      },
    );

    if (error) throw error;
    return normalizeCommandResult(data);
  }
}
