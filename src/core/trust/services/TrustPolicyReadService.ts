import { supabase } from "@/integrations/supabase";
import type {
  TrustActorRole,
  TrustDispatchPolicy,
  TrustPolicyDecision,
  TrustRiskLevel,
} from "../domain";

export interface RideCounterpartyTrustDecision {
  rideId: string;
  subjectProfileId: string;
  riskLevel: TrustRiskLevel;
  dispatchPolicy: TrustDispatchPolicy;
}

function asPolicyDecision(value: unknown): TrustPolicyDecision {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Politica de confianca indisponivel.");
  }

  return value as TrustPolicyDecision;
}

export class TrustPolicyReadService {
  static async getCurrentDecision(
    role: TrustActorRole,
  ): Promise<TrustPolicyDecision> {
    const { data, error } = await supabase.rpc(
      "get_current_trust_policy_decision",
      { p_role: role },
    );

    if (error) throw error;
    return asPolicyDecision(data);
  }

  static async canCurrentReceiveOperationalCall(role: TrustActorRole): Promise<{
    allowed: boolean;
    decision: TrustPolicyDecision;
    reason: string | null;
  }> {
    const decision = await this.getCurrentDecision(role);
    const blocked = decision.dispatch_policy === "block_until_admin_review";
    return {
      allowed: !blocked,
      decision,
      reason: blocked
        ? `Perfil bloqueado para novos chamados ate revisao admin: ${decision.reasons.join(", ")}`
        : null,
    };
  }

  static async getRideCounterpartyDecisions(
    rideIds: string[],
  ): Promise<Map<string, RideCounterpartyTrustDecision>> {
    const uniqueRideIds = [...new Set(rideIds)].slice(0, 50);
    if (uniqueRideIds.length === 0) return new Map();

    const { data, error } = await supabase.rpc(
      "get_ride_offer_trust_decisions",
      { p_ride_ids: uniqueRideIds },
    );

    if (error) throw error;

    const decisions = new Map<string, RideCounterpartyTrustDecision>();
    for (const row of data ?? []) {
      decisions.set(row.ride_id, {
        rideId: row.ride_id,
        subjectProfileId: row.subject_profile_id,
        riskLevel: row.risk_level as TrustRiskLevel,
        dispatchPolicy: row.dispatch_policy as TrustDispatchPolicy,
      });
    }
    return decisions;
  }
}
