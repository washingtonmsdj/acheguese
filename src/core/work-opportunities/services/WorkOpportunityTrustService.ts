import {
  OperationalTrustCommandService,
  type WorkOpportunityFeedbackAnswer,
} from "@/core/trust";
import { supabase } from "@/integrations/supabase";

export type OpportunityFeedbackAnswer = WorkOpportunityFeedbackAnswer;

export interface SubmitOpportunityFeedbackInput {
  answer: OpportunityFeedbackAnswer;
  opportunityId: string;
  comment?: string;
}

export interface ProfessionalReputationSnapshot {
  professional_id: string;
  total_feedback: number;
  avg_rating: number;
  positive_feedback: number;
  neutral_feedback: number;
  negative_feedback: number;
}

function asReputation(value: unknown): ProfessionalReputationSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Reputacao profissional indisponivel.");
  }
  return value as ProfessionalReputationSnapshot;
}

class WorkOpportunityTrustServiceClass {
  async submitFeedback(input: SubmitOpportunityFeedbackInput): Promise<void> {
    await OperationalTrustCommandService.submitWorkOpportunityFeedback({
      opportunityId: input.opportunityId,
      answer: input.answer,
      description: input.comment,
    });
  }

  async getProfessionalReputation(
    professionalId: string,
  ): Promise<ProfessionalReputationSnapshot> {
    const { data, error } = await supabase.rpc(
      "get_professional_trust_reputation",
      { p_professional_id: professionalId },
    );

    if (error) throw error;
    return asReputation(data);
  }
}

export const workOpportunityTrustService =
  new WorkOpportunityTrustServiceClass();
export { workOpportunityTrustService as WorkOpportunityTrustService };
