import { supabase } from "@/integrations/supabase/supabase";

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

export class PrivacySettingsService {
  static async getUserConsents(userId: string): Promise<UserConsentRecord[]> {
    const { data, error } = await supabase
      .from("user_consents")
      .select("*")
      .eq("user_id", userId)
      .order("consent_type", { ascending: true });

    if (error) throw error;
    return (data || []) as UserConsentRecord[];
  }

  static async getDeletionStatus(userId: string): Promise<DeletionStatusRecord | null> {
    const { data, error } = await supabase
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
    const { error } = await supabase.rpc("record_consent", {
      p_user_id: input.userId,
      p_consent_type: input.consentType,
      p_granted: input.granted,
      p_ip_address: null,
      p_user_agent: input.userAgent,
      p_terms_version: "1.0",
      p_privacy_version: "1.0",
    });
    if (error) throw error;
  }

  static async cancelAccountDeletion(userId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_account_deletion", {
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

  static async exportUserData(supabaseUrl: string, accessToken: string): Promise<Blob> {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-export-data`, {
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
    supabaseUrl: string;
    accessToken: string;
    reason: string;
  }): Promise<{ days_until_purge: number }> {
    const response = await fetch(`${input.supabaseUrl}/functions/v1/user-delete-account`, {
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

