/**
 * Owner-facing API for the canonical profile-verification aggregate.
 * Administrative reads and decisions belong to VerificationAdminService.
 */
import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import type {
  Verification,
  VerificationRequestResult,
  VerificationType,
} from "@/core/verification/types";

export interface CreateVerificationParams {
  profile_id: string;
  verification_type: VerificationType;
  document_url?: string;
  document_type?: string;
  notes?: string;
}

function reportFailure(action: string, error: unknown, metadata?: Record<string, unknown>): void {
  trackError(error instanceof Error ? error : new Error(String(error)), {
    component: "VerificationService",
    action,
    metadata,
  });
}

export class VerificationService {
  static async getProfileVerifications(profileId: string): Promise<Verification[]> {
    const { data, error } = await supabase
      .from("verification")
      .select(
        "id, profile_id, verification_type, status, document_url, document_type, notes, review_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
      )
      .eq("profile_id", profileId)
      .order("submitted_at", { ascending: false });

    if (error) {
      reportFailure("getProfileVerifications", error, { profileId });
      throw error;
    }

    return (data ?? []) as Verification[];
  }

  static async getVerification(
    profileId: string,
    verificationType: VerificationType,
  ): Promise<Verification | null> {
    const { data, error } = await supabase
      .from("verification")
      .select(
        "id, profile_id, verification_type, status, document_url, document_type, notes, review_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
      )
      .eq("profile_id", profileId)
      .eq("verification_type", verificationType)
      .maybeSingle();

    if (error) {
      reportFailure("getVerification", error, { profileId, verificationType });
      throw error;
    }

    return data as Verification | null;
  }

  static async isVerified(
    profileId: string,
    verificationType: VerificationType,
  ): Promise<boolean> {
    const verification = await this.getVerification(profileId, verificationType);
    return verification?.status === "approved";
  }

  static async createVerificationRequest(
    params: CreateVerificationParams,
  ): Promise<VerificationRequestResult> {
    const { data, error } = await supabase.rpc("request_profile_verification", {
      p_profile_id: params.profile_id,
      p_verification_type: params.verification_type,
      p_document_url: params.document_url ?? null,
      p_document_type: params.document_type ?? null,
      p_notes: params.notes ?? null,
    });

    if (error) {
      reportFailure("createVerificationRequest", error, {
        profileId: params.profile_id,
        verificationType: params.verification_type,
      });
      throw error;
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Invalid profile verification response");
    }

    return data as unknown as VerificationRequestResult;
  }
}

export const verificationService = VerificationService;
