import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

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
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DELETION_STATUSES = new Set<AccountDeletionStatus>([
  "scheduled",
  "cancelled",
  "processing",
  "completed",
  "failed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseDeletionStatus(
  value: unknown,
): AccountDeletionStatusBrokerData {
  if (!isRecord(value)) {
    throw new Error("Privacy broker returned invalid deletion status");
  }

  const status = value.status;
  if (
    typeof value.requestId !== "string" ||
    !UUID_PATTERN.test(value.requestId) ||
    typeof status !== "string" ||
    !DELETION_STATUSES.has(status as AccountDeletionStatus) ||
    !isIsoTimestamp(value.requestedAt) ||
    !isIsoTimestamp(value.scheduledPurgeAt) ||
    !isNonNegativeInteger(value.daysRemaining) ||
    typeof value.exportRequested !== "boolean"
  ) {
    throw new Error("Privacy broker returned invalid deletion status");
  }

  return {
    requestId: value.requestId,
    status: status as AccountDeletionStatus,
    requestedAt: value.requestedAt,
    scheduledPurgeAt: value.scheduledPurgeAt,
    daysRemaining: value.daysRemaining,
    exportRequested: value.exportRequested,
  };
}

function parseDeletionRequest(
  value: unknown,
): RequestAccountDeletionBrokerData {
  const base = parseDeletionStatus(value);
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.daysUntilPurge) ||
    !isIsoTimestamp(value.recoveryPossibleUntil) ||
    value.daysUntilPurge !== base.daysRemaining ||
    value.recoveryPossibleUntil !== base.scheduledPurgeAt
  ) {
    throw new Error("Privacy broker returned invalid deletion request");
  }

  return {
    ...base,
    daysUntilPurge: value.daysUntilPurge,
    recoveryPossibleUntil: value.recoveryPossibleUntil,
  };
}

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
    const result = await this.invoke<unknown>("recordConsent", {
      consentType: input.consentType,
      granted: input.granted,
      userAgent: input.userAgent,
      termsVersion: input.termsVersion,
      privacyVersion: input.privacyVersion,
    });

    if (
      !isRecord(result) ||
      typeof result.consentId !== "string" ||
      !UUID_PATTERN.test(result.consentId)
    ) {
      throw new Error("Privacy broker returned invalid consent receipt");
    }

    return result.consentId;
  }

  static async getDeletionStatus(): Promise<AccountDeletionStatusBrokerData | null> {
    const result = await this.invoke<unknown>("getDeletionStatus");
    if (result === null) return null;
    return parseDeletionStatus(result);
  }

  static async requestAccountDeletion(
    input: RequestAccountDeletionInput,
  ): Promise<RequestAccountDeletionBrokerData> {
    const result = await this.invoke<unknown>("requestAccountDeletion", {
      reason: input.reason ?? null,
      exportRequested: input.exportRequested ?? false,
    });
    return parseDeletionRequest(result);
  }

  static async cancelAccountDeletion(): Promise<boolean> {
    const result = await this.invoke<unknown>("cancelAccountDeletion");
    if (!isRecord(result) || typeof result.cancelled !== "boolean") {
      throw new Error("Privacy broker returned invalid cancellation receipt");
    }
    return result.cancelled;
  }
}
