import { supabase } from "@/integrations/supabase";
import { PrivacyRpcService } from "./PrivacyRpcService";

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
      .eq("user_id", userId)
      .is("revoked_at", null);

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
      await PrivacyRpcService.recordConsent({
        consentType: consent.consent_type,
        granted: consent.granted,
        userAgent: input.userAgent,
        termsVersion: "1.0",
        privacyVersion: "1.0",
      });
    }
  }
}

