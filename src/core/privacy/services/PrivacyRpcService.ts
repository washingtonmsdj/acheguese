import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type PrivacyRpcAction = "recordConsent" | "cancelAccountDeletion";

interface RecordConsentBrokerData {
  consentId: string;
}

interface CancelAccountDeletionBrokerData {
  cancelled: boolean;
}

export interface RecordConsentInput {
  consentType: string;
  granted: boolean;
  userAgent?: string | null;
  termsVersion?: string;
  privacyVersion?: string;
}

const FUNCTION_NAME = "privacy-rpc";
const SERVICE_NAME = "PrivacyRpcService";

export class PrivacyRpcService {
  private static async invoke<T>(
    action: PrivacyRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, PrivacyRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Privacy broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async recordConsent(input: RecordConsentInput): Promise<string> {
    const result = await this.invoke<RecordConsentBrokerData>("recordConsent", {
      consentType: input.consentType,
      granted: input.granted,
      userAgent: input.userAgent,
      termsVersion: input.termsVersion,
      privacyVersion: input.privacyVersion,
    });
    return result.consentId;
  }

  static async cancelAccountDeletion(): Promise<boolean> {
    const result = await this.invoke<CancelAccountDeletionBrokerData>(
      "cancelAccountDeletion",
    );
    return result.cancelled;
  }
}
