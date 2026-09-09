import { supabase } from "@/integrations/supabase";
import type {
  TrustActorRole,
  TrustPolicyDecision,
} from "../domain";

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

}
