import { supabase } from "@/integrations/supabase";

export type RideTrustFeedbackSubjectRole =
  | "counterparty"
  | "customer"
  | "merchant"
  | "driver"
  | "courier";

type RideTrustFeedbackRpcArgs = {
  p_ride_id: string;
  p_subject_role: RideTrustFeedbackSubjectRole;
  p_rating: number;
  p_reason_code: string;
  p_description: string | null;
};

type RideTrustFeedbackRpcError = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
} | null;

type RideTrustFeedbackRpcClient = {
  rpc(
    functionName: "submit_ride_trust_feedback",
    args: RideTrustFeedbackRpcArgs,
  ): PromiseLike<{
    data: unknown;
    error: RideTrustFeedbackRpcError;
  }>;
};

/**
 * Narrow integration typing for the G73 ride-feedback RPC.
 *
 * The generated Supabase types are provider-gated and still expose the
 * retired subject Profile UUID argument. Keep the semantic-role contract
 * local to the canonical command owner until official generation converges;
 * never edit the generated types or reintroduce the retired argument.
 */
const rideTrustFeedbackRpcClient = supabase as unknown as RideTrustFeedbackRpcClient;

export interface OperationalTrustFeedbackInput {
  subjectProfileId: string;
  rating: number;
  reasonCode: string;
  description?: string | null;
}

export interface OperationalRideTrustFeedbackInput {
  subjectRole: RideTrustFeedbackSubjectRole;
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
    input: OperationalRideTrustFeedbackInput,
  ): Promise<TrustCommandResult> {
    const { data, error } = await rideTrustFeedbackRpcClient.rpc(
      "submit_ride_trust_feedback",
      {
        p_ride_id: rideId,
        p_subject_role: input.subjectRole,
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