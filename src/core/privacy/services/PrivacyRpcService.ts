import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

type PrivacyRpcAction =
  | "recordConsent"
  | "getDeletionStatus"
  | "requestAccountDeletion"
  | "cancelAccountDeletion";

interface RecordConsentBrokerData {
  consentId: string;
}

interface CancelAccountDeletionBrokerData {
  cancelled: boolean;
}

export type AccountDeletionStatus =
  | "scheduled"
  | "cancelled"
  | "processing"
  | "completed"
  | "failed";

export interface AccountDeletionStatusBrokerData {
  requestId: string;
  status: AccountDeletionStatus;
  requestedAt: string;
  scheduledPurgeAt: string;
  daysRemaining: number;
  exportRequested: boolean;
}

export interface RequestAccountDeletionBrokerData
  extends AccountDeletionStatusBrokerData {
  daysUntilPurge: number;
  recoveryPossibleUntil: string;
}

export interface RecordConsentInput {
  consentType: string;
  granted: boolean;
  userAgent?: string | null;
  termsVersion?: string;
  privacyVersion?: string;
}

export interface RequestAccountDeletionInput {
  reason?: string | null;
  exportRequested?: boolean;
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

  static async getDeletionStatus(): Promise<AccountDeletionStatusBrokerData | null> {
    return invokeNullableSupabaseBroker<
      AccountDeletionStatusBrokerData,
      PrivacyRpcAction
    >({
      action: "getDeletionStatus",
      functionName: FUNCTION_NAME,
      noDataMessage: "Privacy broker returned no deletion status",
      serviceName: SERVICE_NAME,
    });
  }

  static async requestAccountDeletion(
    input: RequestAccountDeletionInput,
  ): Promise<RequestAccountDeletionBrokerData> {
    return this.invoke<RequestAccountDeletionBrokerData>(
      "requestAccountDeletion",
      {
        reason: input.reason ?? null,
        exportRequested: input.exportRequested ?? false,
      },
    );
  }

  static async cancelAccountDeletion(): Promise<boolean> {
    const result = await this.invoke<CancelAccountDeletionBrokerData>(
      "cancelAccountDeletion",
    );
    return result.cancelled;
  }
}
