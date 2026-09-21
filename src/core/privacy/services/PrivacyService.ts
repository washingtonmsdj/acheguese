/**
 * Privacy service SSOT for privacy and LGPD operations.
 *
 * Centralizes DPO requests and user data export flows.
 * Sensitive operations run through Edge Functions/RPC brokers; browser code
 * never writes privacy ledgers directly.
 */

import { assertPrivacyDataExportEnabled } from "@/core/privacy/config/privacyRollout";
import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

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
  requesterName: string;
  requesterEmail: string;
  subject: string;
  requestType: DPORequestType;
  message: string;
  honeypot: string;
  turnstileToken: string | null;
}

export interface ExportDataResponse {
  /** JSON blob with all personal data for the authenticated user. */
  data: Record<string, unknown>;
  sizeBytes: number;
  tablesExported: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exportSectionCount(payload: Record<string, unknown>): number {
  const metadata = payload.export_metadata;
  if (isRecord(metadata) && Array.isArray(metadata.sections)) {
    return metadata.sections.filter((section) => typeof section === "string").length;
  }

  const sections = payload.data;
  return isRecord(sections) ? Object.keys(sections).length : 0;
}

function exportSizeBytes(payload: Record<string, unknown>): number {
  const serialized = JSON.stringify(payload, null, 2);
  return new TextEncoder().encode(serialized).length;
}

export class PrivacyService {
  /**
   * Registers a data-subject/DPO request through the public anti-abuse broker.
   * The broker derives authenticated identity server-side when a real session
   * exists and never trusts a user id supplied by browser code.
   */
  static async createDPORequest(params: CreateDPORequestParams): Promise<void> {
    const { data, error } = await supabase.functions.invoke("submit-dpo-request", {
      body: {
        requesterName: params.requesterName,
        requesterEmail: params.requesterEmail,
        requestType: params.requestType,
        subject: params.subject,
        message: params.message,
        honeypot: params.honeypot,
        turnstileToken: params.turnstileToken,
      },
    });

    if (error) {
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        "Não foi possível registrar sua solicitação de privacidade.";
      logger.error("[PrivacyService] Error registering DPO request", { message });
      throw new Error(message);
    }

    if (!isRecord(data) || typeof data.status !== "string") {
      throw new Error("Resposta inválida do canal de privacidade.");
    }

    if (data.status === "turnstile_failed") {
      throw new Error("Não foi possível validar a proteção anti-spam. Tente novamente.");
    }

    if (data.status !== "registered") {
      throw new Error("Não foi possível registrar sua solicitação de privacidade.");
    }

    logger.info("[PrivacyService] Solicitação DPO registrada", {
      requestType: params.requestType,
    });
  }

  /** Exports all personal data for the authenticated user. */
  static async exportUserData(): Promise<ExportDataResponse> {
    assertPrivacyDataExportEnabled();
    const { data, error } = await supabase.functions.invoke("user-export-data");

    if (error) {
      const message =
        (await resolveSupabaseFunctionErrorMessage(error)) ??
        "Failed to export user data";
      logger.error("[PrivacyService] Error exporting user data", { message });
      throw new Error(message);
    }

    if (!isRecord(data) || !isRecord(data.export_metadata) || !isRecord(data.data)) {
      throw new Error("Invalid user export response");
    }

    return {
      data,
      sizeBytes: exportSizeBytes(data),
      tablesExported: exportSectionCount(data),
    };
  }

}
