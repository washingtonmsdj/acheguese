import { supabase } from "@/integrations/supabase";
import type {
  VerificationDecision,
  VerificationReviewItem,
  VerificationStats,
  VerificationStatus,
} from "@/core/verification/types";

interface AdminVerificationResponse {
  items?: VerificationReviewItem[];
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  revoked?: number;
  verification?: unknown;
  error?: string;
}

async function invokeAdminVerification(
  body: Record<string, unknown>,
): Promise<AdminVerificationResponse> {
  const { data, error } = await supabase.functions.invoke("admin-verify-profile", {
    body,
  });

  if (error) throw error;
  const response = data as AdminVerificationResponse | null;
  if (!response || response.error) {
    throw new Error(response?.error || "Invalid profile verification response");
  }
  return response;
}

export class VerificationAdminService {
  static async list(
    status: VerificationStatus,
    options: { limit?: number; offset?: number } = {},
  ): Promise<VerificationReviewItem[]> {
    const response = await invokeAdminVerification({
      action: "list",
      status,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
    return response.items ?? [];
  }

  static async getStats(): Promise<VerificationStats> {
    const response = await invokeAdminVerification({ action: "stats" });
    const pending = response.pending ?? 0;
    const approved = response.approved ?? 0;
    const rejected = response.rejected ?? 0;
    const revoked = response.revoked ?? 0;
    return {
      total: response.total ?? pending + approved + rejected + revoked,
      pending,
      approved,
      rejected,
      revoked,
    };
  }

  static async review(
    verificationId: string,
    decision: VerificationDecision,
    reason?: string,
  ): Promise<void> {
    await invokeAdminVerification({
      action: "review",
      verification_id: verificationId,
      decision,
      reason,
    });
  }

  static async verifyProfile(profileId: string, reason?: string): Promise<void> {
    await invokeAdminVerification({
      action: "verify_profile",
      profile_id: profileId,
      reason,
    });
  }
}

export const verificationAdminService = VerificationAdminService;
