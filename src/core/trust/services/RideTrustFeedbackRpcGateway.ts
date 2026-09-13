import { supabase } from "@/integrations/supabase";

export type RideTrustFeedbackRpcSubjectRole =
  | "counterparty"
  | "customer"
  | "merchant"
  | "driver"
  | "courier";

export interface SubmitRideTrustFeedbackRpcArgs {
  p_ride_id: string;
  p_subject_role: RideTrustFeedbackRpcSubjectRole;
  p_rating: number;
  p_reason_code: string;
  p_description: string | null;
}

type RpcError = {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
} | null;

type RideTrustFeedbackRpcResult = PromiseLike<{
  data: unknown;
  error: RpcError;
}>;

type RideTrustFeedbackRpcClient = {
  rpc(
    functionName: "submit_ride_trust_feedback",
    args: SubmitRideTrustFeedbackRpcArgs,
  ): RideTrustFeedbackRpcResult;
};

/**
 * Narrow integration boundary for the G73 ride-feedback RPC.
 *
 * The database contract is source-owned by
 * `20260911152000_redact_driver_history_and_derive_feedback_targets_g73.sql`.
 * Supabase type generation is currently provider-gated, so this adapter keeps
 * the domain on the migrated semantic-role contract without modifying the
 * generated file or reintroducing the retired subject Profile UUID argument.
 * Once official generated types converge, only this integration cast can be
 * removed; callers keep the same contract.
 */
const rideTrustFeedbackRpcClient =
  supabase as unknown as RideTrustFeedbackRpcClient;

export async function submitRideTrustFeedbackRpc(
  args: SubmitRideTrustFeedbackRpcArgs,
): Promise<{ data: unknown; error: RpcError }> {
  return rideTrustFeedbackRpcClient.rpc("submit_ride_trust_feedback", args);
}
