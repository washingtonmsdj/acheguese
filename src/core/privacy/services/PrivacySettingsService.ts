import { supabase } from "@/integrations/supabase";
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
  status: "scheduled" | "processing" | "completed" | "cancelled" | null;
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

interface DeletionStatusRow {
  status: DeletionStatusRecord["status"];
  scheduled_purge_at: string | null;
}

interface PrivacySettingsDbClient {
  from: (table: string) => {
    select: (_columns: string) => {
      eq: (column: string, value: string) => {
        is: (
          column: string,
          value: null,
        ) => {
          order: (
            column: string,
            options: { ascending: boolean },
          ) => Promise<QueryResult<ConsentRow[]>>;
        };
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<QueryResult<ConsentRow[]>>;
        single: () => Promise<QueryResult<DeletionStatusRow>>;
      };
    };
  };
  rpc: (
    fn: string,
    params: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
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

  static async getDeletionStatus(userId: string): Promise<DeletionStatusRecord | null> {
    const { data, error } = await this.db
      .from("user_deletion_schedule")
      .select("status, scheduled_purge_at")
      .eq("user_id", userId)
      .single();

    if (error) return null;

    const daysRemaining = data.scheduled_purge_at
      ? Math.ceil((new Date(data.scheduled_purge_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      status: data.status as DeletionStatusRecord["status"],
      scheduled_purge_at: data.scheduled_purge_at,
      days_remaining: daysRemaining && daysRemaining > 0 ? daysRemaining : 0,
    };
  }

  static async recordConsent(input: {
    userId: string;
    consentType: string;
    granted: boolean;
    userAgent: string;
  }): Promise<void> {
    if (!input.userId) throw new Error("Sessao nao encontrada");
    await PrivacyRpcService.recordConsent({
      consentType: input.consentType,
      granted: input.granted,
      userAgent: input.userAgent,
      termsVersion: "1.0",
      privacyVersion: "1.0",
    });
  }

  static async cancelAccountDeletion(userId: string): Promise<void> {
    const { error } = await this.db.rpc("cancel_account_deletion", {
      p_user_id: userId,
      p_reason: "Cancelado pelo usuario",
    });
    if (error) throw error;
  }

  static async getAccessToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
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
    const response = await fetch(buildSupabaseFunctionUrl("user-delete-account"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        confirmation: true,
        reason: input.reason,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Falha na solicitacao");
    }

    return payload.details as { days_until_purge: number };
  }
}

