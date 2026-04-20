import { supabase } from "@/integrations/supabase/supabase";

export interface ConsentPreferenceInput {
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

export class ConsentService {
  static async getExistingConsents(userId?: string): Promise<Array<{ consent_type: string; granted: boolean }> | null> {
    const localConsent = localStorage.getItem("lgpd-consent");
    if (localConsent) {
      return JSON.parse(localConsent) as Array<{ consent_type: string; granted: boolean }>;
    }

    if (!userId) return null;

    const { data, error } = await supabase
      .from("user_consents")
      .select("consent_type, granted")
      .eq("user_id", userId);

    if (error) throw error;

    if (data && data.length > 0) {
      localStorage.setItem("lgpd-consent", JSON.stringify(data));
    }

    return data as Array<{ consent_type: string; granted: boolean }>;
  }

  static async saveConsentPreferences(input: {
    userId?: string;
    preferences: ConsentPreferenceInput;
    userAgent: string;
  }): Promise<void> {
    const consentsArray = [
      { consent_type: "cookies", granted: true },
      { consent_type: "analytics", granted: input.preferences.analytics },
      { consent_type: "marketing", granted: input.preferences.marketing },
      { consent_type: "geolocation", granted: input.preferences.geolocation },
      { consent_type: "privacy_policy", granted: true },
    ];

    localStorage.setItem("lgpd-consent", JSON.stringify(consentsArray));

    if (!input.userId) return;

    for (const consent of consentsArray) {
      const { error } = await supabase.rpc("record_consent", {
        p_user_id: input.userId,
        p_consent_type: consent.consent_type,
        p_granted: consent.granted,
        p_ip_address: null,
        p_user_agent: input.userAgent,
        p_terms_version: "1.0",
        p_privacy_version: "1.0",
      });

      if (error) throw error;
    }
  }
}

