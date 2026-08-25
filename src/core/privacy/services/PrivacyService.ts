/**
 * Privacy service SSOT for privacy and LGPD operations.
 *
 * Centralizes DPO requests, user data export and account deletion flows.
 * Sensitive operations such as export and delete run through edge functions.
 * DPO request registration uses the Supabase client directly because it stores
 * authenticated user data protected by RLS.
 */

import { DPO_REQUEST_STATUS } from "@/core/privacy/constants/dpoRequestStatus";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { PrivacyRpcService } from "./PrivacyRpcService";

// Types

export type DPORequestType =
  | "access"
  | "correction"
  | "anonymization"
  | "portability"
  | "deletion"
  | "information"
  | "consent_revocation"
  | "automated_decision"
  | "violation_report"
  | "other";

export interface CreateDPORequestParams {
  userId: string | undefined;
  requesterName: string;
  requesterEmail: string;
  subject: string;
  requestType: DPORequestType;
  message: string;
}

export interface ExportDataResponse {
  /** JSON blob with all personal data for the authenticated user. */
  data: Record<string, unknown>;
  sizeBytes: number;
  tablesExported: number;
}

export interface DeleteAccountParams {
  reason?: string;
  /** Must be true as an explicit user confirmation. */
  confirmation: true;
  /** When true, requests an export before final purge. */
  exportFirst?: boolean;
}

export interface DeleteAccountResponse {
  scheduledPurgeAt: string;
  daysUntilPurge: number;
  recoveryPossibleUntil: string;
}

interface InsertResult {
  error: { message: string } | null;
}

interface PrivacyDbClient {
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => Promise<InsertResult>;
  };
}

// Service

export class PrivacyService {
  private static readonly db = supabase as unknown as PrivacyDbClient;

  /**
   * Registers a DPO request and persists it in `dpo_requests`.
   */
  static async createDPORequest(params: CreateDPORequestParams): Promise<void> {
    const { error: dbError } = await this.db.from("dpo_requests").insert({
      user_id: params.userId ?? null,
      requester_name: params.requesterName,
      requester_email: params.requesterEmail,
      subject: params.subject,
      request_type: params.requestType,
      message: params.message,
      status: DPO_REQUEST_STATUS.PENDING,
    });

    if (dbError) {
      logger.error("[PrivacyService] Error registering DPO request", dbError);
      throw new Error(dbError.message);
    }

    logger.info("[PrivacyService] Solicitacao DPO registrada", {
      requestType: params.requestType,
      hasUserId: Boolean(params.userId),
    });
  }

  /**
   * Exports all personal data for the authenticated user.
   */
  static async exportUserData(): Promise<ExportDataResponse> {
    const { data, error } = await supabase.functions.invoke("user-export-data");

    if (error) {
      logger.error("[PrivacyService] Error exporting user data", error);
      throw new Error(error.message || "Failed to export user data");
    }

    return {
      data: data as Record<string, unknown>,
      sizeBytes: Number(data?.export_metadata?.size_bytes ?? 0),
      tablesExported: Object.keys(data ?? {}).length,
    };
  }

  /**
   * Schedules account deletion for the authenticated user through the
   * authoritative privacy broker. This does not invoke the stale destructive
   * `user-delete-account` handler.
   */
  static async deleteAccount(params: DeleteAccountParams): Promise<DeleteAccountResponse> {
    if (!params.confirmation) {
      throw new Error("Confirmation required to delete account");
    }

    const result = await PrivacyRpcService.requestAccountDeletion({
      reason: params.reason ?? null,
      exportRequested: params.exportFirst ?? false,
    });

    return {
      scheduledPurgeAt: result.scheduledPurgeAt,
      daysUntilPurge: result.daysUntilPurge,
      recoveryPossibleUntil: result.recoveryPossibleUntil,
    };
  }
}
