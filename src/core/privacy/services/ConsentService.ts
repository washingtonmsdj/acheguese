export interface ConsentPreferenceInput {
  analytics: boolean;
  marketing: boolean;
  geolocation: boolean;
}

export interface ConsentRecord {
  consent_type: string;
  granted: boolean;
}

export const LOCAL_CONSENT_STORAGE_KEY = "lgpd-consent";
export const CONSENT_PREFERENCES_CHANGED_EVENT =
  "acheguese:consent-preferences-changed";

function readLocalConsentRecords(): ConsentRecord[] | null {
  if (typeof window === "undefined") return null;

  try {
    const localConsent = window.localStorage.getItem(LOCAL_CONSENT_STORAGE_KEY);
    if (!localConsent) return null;

    const parsed = JSON.parse(localConsent) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed.filter(
      (record): record is ConsentRecord =>
        Boolean(record) &&
        typeof record === "object" &&
        typeof (record as ConsentRecord).consent_type === "string" &&
        typeof (record as ConsentRecord).granted === "boolean",
    );
  } catch {
    // Storage bloqueado ou payload invalido: nenhuma permissao opcional deve
    // ser inferida. O consumidor permanece em fail-closed.
    return null;
  }
}

function notifyLocalConsentChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_PREFERENCES_CHANGED_EVENT));
}

function writeLocalConsentRecords(records: ConsentRecord[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      LOCAL_CONSENT_STORAGE_KEY,
      JSON.stringify(records),
    );
    notifyLocalConsentChanged();
    return true;
  } catch {
    return false;
  }
}

export class ConsentService {
  static getLocalConsentRecords(): ConsentRecord[] | null {
    return readLocalConsentRecords();
  }

  static hasGrantedLocalConsent(consentType: string): boolean {
    return Boolean(
      readLocalConsentRecords()?.some(
        (consent) =>
          consent.consent_type === consentType && consent.granted === true,
      ),
    );
  }

  static subscribeToLocalConsent(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_CONSENT_STORAGE_KEY) listener();
    };
    const handleConsentChange = () => listener();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(
      CONSENT_PREFERENCES_CHANGED_EVENT,
      handleConsentChange,
    );

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        CONSENT_PREFERENCES_CHANGED_EVENT,
        handleConsentChange,
      );
    };
  }

  static async getExistingConsents(
    userId?: string,
  ): Promise<ConsentRecord[] | null> {
    const localConsent = readLocalConsentRecords();
    if (localConsent) return localConsent;

    // Visitante anonimo permanece 100% local: nao carregar Supabase apenas para
    // descobrir que ainda nao ha consentimento persistido no navegador.
    if (!userId) return null;

    const { supabase } = await import("@/integrations/supabase");
    const { data, error } = await supabase
      .from("user_consents")
      .select("consent_type, granted")
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (error) throw error;

    const consentRecords = (data ?? []) as ConsentRecord[];
    if (consentRecords.length > 0) {
      // Cache local e best-effort. Se o browser bloquear storage, a leitura do
      // backend continua valida, mas permissões opcionais permanecem desligadas
      // no gate local desta sessao.
      writeLocalConsentRecords(consentRecords);
    }

    return consentRecords;
  }

  static async saveConsentPreferences(input: {
    userId?: string;
    preferences: ConsentPreferenceInput;
    userAgent: string;
  }): Promise<void> {
    const consentsArray: ConsentRecord[] = [
      { consent_type: "cookies", granted: true },
      { consent_type: "analytics", granted: input.preferences.analytics },
      { consent_type: "marketing", granted: input.preferences.marketing },
      { consent_type: "geolocation", granted: input.preferences.geolocation },
      { consent_type: "privacy_policy", granted: true },
    ];

    if (!writeLocalConsentRecords(consentsArray)) {
      throw new Error("Consent storage unavailable");
    }

    // Para visitante anonimo, salvar localmente e suficiente. O RPC so entra no
    // bundle quando existe usuario autenticado que precisa persistir no backend.
    if (!input.userId) return;

    const { PrivacyRpcService } = await import("./PrivacyRpcService");
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
