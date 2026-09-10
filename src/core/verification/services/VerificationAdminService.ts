import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCounter(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

async function invokeAdminVerification(
  body: Record<string, unknown>,
): Promise<AdminVerificationResponse> {
  const { data, error } = await supabase.functions.invoke("admin-verify-profile", {
    body,
  });

  if (error) {
    const message =
      (await resolveSupabaseFunctionErrorMessage(error)) ??
      "Profile verification request failed";
    throw new Error(message);
  }

  if (!isRecord(data)) {
    throw new Error("Invalid profile verification response");
  }

  if (typeof data.error === "string" && data.error.trim()) {
    throw new Error(data.error);
  }

  return data as AdminVerificationResponse;
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

    if (!Array.isArray(response.items)) {
      throw new Error("Invalid profile verification list response");
    }

    return response.items;
  }

  static async getStats(): Promise<VerificationStats> {
    const response = await invokeAdminVerification({ action: "stats" });
    const { pending, approved, rejected, revoked } = response;

    if (
      !isCounter(pending) ||
      !isCounter(approved) ||
      !isCounter(rejected) ||
      !isCounter(revoked)
    ) {
      throw new Error("Invalid profile verification stats response");
    }

    const calculatedTotal = pending + approved + rejected + revoked;
    const total = response.total;
    if (total !== undefined && !isCounter(total)) {
      throw new Error("Invalid profile verification stats response");
    }

    return {
      total: total ?? calculatedTotal,
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
    const response = await invokeAdminVerification({
      action: "review",
      verification_id: verificationId,
      decision,
      reason,
    });

    if (!Object.prototype.hasOwnProperty.call(response, "verification")) {
      throw new Error("Invalid profile verification review response");
    }
  }

  static async verifyProfile(profileId: string, reason?: string): Promise<void> {
    const response = await invokeAdminVerification({
      action: "verify_profile",
      profile_id: profileId,
      reason,
    });

    if (!Object.prototype.hasOwnProperty.call(response, "verification")) {
      throw new Error("Invalid profile verification command response");
    }
  }
}

export const verificationAdminService = VerificationAdminService;
