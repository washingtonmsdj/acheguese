import { supabase } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { buildSupabaseFunctionUrl } from "@/shared/config/publicSupabase";
import { PrivacyRpcService } from "./PrivacyRpcService";

export interface UserConsentRecord {
  id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
  terms_version: string;
  privacy_policy_version: string;
}

export interface DeletionStatusRecord {
  status:
    | "scheduled"
    | "processing"
    | "completed"
    | "cancelled"
    | "failed"
    | null;
  scheduled_purge_at: string | null;
  days_remaining: number | null;
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface ConsentRow {
  id: string;
  consent_type: string;
  granted: boolean;
  granted_at: string;
  terms_version: string;
  privacy_policy_version: string;
}

interface PrivacySettingsDbClient {
  from: (table: string) => {
    select: (_columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        is: (
          column: string,
          value: null,
        ) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => Promise<QueryResult<ConsentRow[]>>;
        };
      };
    };
  };
}

export class PrivacySettingsService {
  private static readonly db = supabase as unknown as PrivacySettingsDbClient;

  static async getUserConsents(userId: string): Promise<UserConsentRecord[]> {
    const { data, error } = await this.db
      .from("user_consents")
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("consent_type", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  static async getDeletionStatus(
    _userId: string,
  ): Promise<DeletionStatusRecord | null> {
    const status = await PrivacyRpcService.getDeletionStatus();
    if (!status) return null;

    return {
      status: status.status,
      scheduled_purge_at: status.scheduledPurgeAt,
      days_remaining: status.daysRemaining,
    };
  }

  static async recordConsent(input: {
    userId: string;
    consentType: string;
    granted: boolean;
    userAgent: string;
    termsVersion?: string;
    privacyVersion?: string;
  }): Promise<void> {
    if (!input.userId) throw new Error("Sessao nao encontrada");
    await PrivacyRpcService.recordConsent({
      consentType: input.consentType,
      granted: input.granted,
      userAgent: input.userAgent,
      termsVersion: input.termsVersion ?? "1.0",
      privacyVersion: input.privacyVersion ?? "1.0",
    });
  }

  static async cancelAccountDeletion(): Promise<void> {
    const cancelled = await PrivacyRpcService.cancelAccountDeletion();
    if (!cancelled) {
      throw new Error("Nenhuma exclusao agendada pode ser cancelada");
    }
  }

  static async getAccessToken(): Promise<string> {
    const accessToken = SessionService.getAccessToken();
    if (!accessToken) throw new Error("Sessao nao encontrada");
    return accessToken;
  }

  static async exportUserData(accessToken: string): Promise<Blob> {
    const response = await fetch(buildSupabaseFunctionUrl("user-export-data"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Falha na exportacao");
    }

    return response.blob();
  }

  static async requestAccountDeletion(input: {
    accessToken: string;
    reason: string;
  }): Promise<{ days_until_purge: number }> {
    if (!input.accessToken) throw new Error("Sessao nao encontrada");

    const result = await PrivacyRpcService.requestAccountDeletion({
      reason: input.reason,
      exportRequested: false,
    });

    return { days_until_purge: result.daysUntilPurge };
  }
}
