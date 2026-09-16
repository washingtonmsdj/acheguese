import { assertPrivacyDataExportEnabled, isPrivacyDataExportEnabled } from "@/core/privacy/config/privacyRollout";
import { SessionService } from "@/core/session/services/SessionService";
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

export interface ConsentHistoryRecord extends UserConsentRecord {
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
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
  revoked_at?: string | null;
  revoke_reason?: string | null;
  created_at?: string;
}

interface ConsentUserQuery {
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
}

interface PrivacySettingsDbClient {
  from: (table: string) => {
    select: (_columns: string) => {
      eq: (column: string, value: string) => ConsentUserQuery;
    };
  };
}

type AccountDeletionMutation =
  | {
      kind: "request";
      accessToken: string;
      reason: string;
      promise: Promise<{ days_until_purge: number }>;
    }
  | {
      kind: "cancel";
      accessToken: string;
      promise: Promise<void>;
    };

const CONSENT_READ_TIMEOUT_MS = 6_000;
const CONSENT_READ_TIMEOUT_MESSAGE =
  "A verificação dos seus termos demorou mais que o esperado. Tente novamente.";

export class PrivacySettingsService {
  private static readonly db = supabase as unknown as PrivacySettingsDbClient;
  private static exportInFlight: {
    accessToken: string;
    promise: Promise<Blob>;
  } | null = null;
  private static accountDeletionMutationInFlight: AccountDeletionMutation | null = null;

  private static assertCurrentSessionAccessToken(accessToken: string): void {
    const currentAccessToken = SessionService.getAccessToken();
    if (!accessToken || !currentAccessToken || currentAccessToken !== accessToken) {
      throw new Error("Sessao alterada. Tente novamente.");
    }
  }

  private static async withConsentReadTimeout<T>(operation: Promise<T>): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(CONSENT_READ_TIMEOUT_MESSAGE));
      }, CONSENT_READ_TIMEOUT_MS);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }
  }

  static isUserDataExportAvailable(): boolean {
    return isPrivacyDataExportEnabled();
  }

  static async getUserConsents(userId: string): Promise<UserConsentRecord[]> {
    const result = await this.withConsentReadTimeout(
      this.db
        .from("user_consents")
        .select("*")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .order("consent_type", { ascending: true }),
    );
    const { data, error } = result;

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      consent_type: row.consent_type,
      granted: row.granted,
      granted_at: row.granted_at,
      terms_version: row.terms_version,
      privacy_policy_version: row.privacy_policy_version,
    }));
  }

  static async getConsentHistory(userId: string): Promise<ConsentHistoryRecord[]> {
    const result = await this.withConsentReadTimeout(
      this.db
        .from("user_consents")
        .select(
          "id,consent_type,granted,granted_at,revoked_at,revoke_reason,terms_version,privacy_policy_version,created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    );
    const { data, error } = result;

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      consent_type: row.consent_type,
      granted: row.granted,
      granted_at: row.granted_at,
      revoked_at: row.revoked_at ?? null,
      revoke_reason: row.revoke_reason ?? null,
      terms_version: row.terms_version,
      privacy_policy_version: row.privacy_policy_version,
      created_at: row.created_at ?? row.granted_at,
    }));
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
    const accessToken = SessionService.getAccessToken();
    if (!accessToken) throw new Error("Sessao nao encontrada");

    const activeMutation = this.accountDeletionMutationInFlight;
    if (activeMutation) {
      if (
        activeMutation.kind === "cancel" &&
        activeMutation.accessToken === accessToken
      ) {
        return activeMutation.promise;
      }
      throw new Error("Ja existe uma operacao de exclusao em andamento");
    }

    const operation = (async () => {
      const cancelled = await PrivacyRpcService.cancelAccountDeletion();
      if (!cancelled) {
        throw new Error("Nenhuma exclusao agendada pode ser cancelada");
      }
    })();

    this.accountDeletionMutationInFlight = {
      kind: "cancel",
      accessToken,
      promise: operation,
    };

    try {
      await operation;
    } finally {
      const currentMutation = this.accountDeletionMutationInFlight;
      if (currentMutation?.promise === operation) {
        this.accountDeletionMutationInFlight = null;
      }
    }
  }

  static async getAccessToken(): Promise<string> {
    const accessToken = SessionService.getAccessToken();
    if (!accessToken) throw new Error("Sessao nao encontrada");
    return accessToken;
  }

  static async exportUserData(accessToken: string): Promise<Blob> {
    assertPrivacyDataExportEnabled();
    this.assertCurrentSessionAccessToken(accessToken);

    const activeExport = this.exportInFlight;
    if (activeExport) {
      if (activeExport.accessToken === accessToken) {
        return activeExport.promise;
      }
      throw new Error("Ja existe uma exportacao de outra sessao em andamento");
    }

    const operation = (async () => {
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
    })();

    this.exportInFlight = { accessToken, promise: operation };

    try {
      return await operation;
    } finally {
      if (this.exportInFlight?.promise === operation) {
        this.exportInFlight = null;
      }
    }
  }

  static async requestAccountDeletion(input: {
    accessToken: string;
    reason: string;
  }): Promise<{ days_until_purge: number }> {
    this.assertCurrentSessionAccessToken(input.accessToken);

    const reason = input.reason.trim();
    const activeMutation = this.accountDeletionMutationInFlight;
    if (activeMutation) {
      if (
        activeMutation.kind === "request" &&
        activeMutation.accessToken === input.accessToken &&
        activeMutation.reason === reason
      ) {
        return activeMutation.promise;
      }
      throw new Error("Ja existe uma operacao de exclusao em andamento");
    }

    const operation = (async () => {
      const result = await PrivacyRpcService.requestAccountDeletion({
        reason,
        exportRequested: false,
      });

      return { days_until_purge: result.daysUntilPurge };
    })();

    this.accountDeletionMutationInFlight = {
      kind: "request",
      accessToken: input.accessToken,
      reason,
      promise: operation,
    };

    try {
      return await operation;
    } finally {
      const currentMutation = this.accountDeletionMutationInFlight;
      if (currentMutation?.promise === operation) {
        this.accountDeletionMutationInFlight = null;
      }
    }
  }
}
