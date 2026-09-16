import type { TurnstileVerificationResult } from "./turnstile.ts";

const REQUEST_KEYS = new Set([
  "requesterName",
  "requesterEmail",
  "requestType",
  "subject",
  "message",
  "honeypot",
  "turnstileToken",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DpoRequestType = "access" | "correction" | "anonymization" | "portability" | "deletion" | "information" | "consent_revocation" | "automated_decision" | "violation_report" | "other";

export interface PrivacySubjectRequestRow {
  user_id: string | null;
  requester_name: string;
  requester_email: string;
  request_type: DpoRequestType;
  subject: string;
  message: string;
  status: "received";
  turnstile_verified: true;
}

interface ParsedDpoRequest {
  row: Omit<PrivacySubjectRequestRow, "user_id" | "status" | "turnstile_verified">;
  turnstileToken: string | null;
}

export type DpoRequestIntakeOutcome =
  | { status: "registered" }
  | { status: "turnstile_failed" }
  | { status: "invalid_payload" }
  | { status: "verification_unavailable" }
  | { status: "configuration_unavailable" }
  | { status: "database_failed" };

type InsertResult = { error: { code?: string | null } | null };

function isRequestType(value: unknown): value is DpoRequestType {
  return [
    "access", "correction", "anonymization", "portability", "deletion",
    "information", "consent_revocation", "automated_decision", "violation_report", "other",
  ].includes(String(value));
}

function requiredString(payload: object, key: string, minimum: number, maximum: number): string | null {
  const value = Reflect.get(payload, key);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= minimum && normalized.length <= maximum ? normalized : null;
}

function optionalString(payload: object, key: string, maximum: number): string | null | undefined {
  const value = Reflect.get(payload, key);
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.length <= maximum ? normalized : undefined;
}

function hasPopulatedHoneypot(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const value = Reflect.get(payload, "honeypot");
  return typeof value === "string" && value.length <= 200 && value.trim().length > 0;
}

function parseDpoRequest(payload: unknown): ParsedDpoRequest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) return null;
  if (Object.keys(payload).length !== REQUEST_KEYS.size) return null;

  const requesterName = requiredString(payload, "requesterName", 2, 120);
  const requesterEmail = requiredString(payload, "requesterEmail", 3, 255)?.toLowerCase() ?? null;
  const requestType = Reflect.get(payload, "requestType");
  const subject = requiredString(payload, "subject", 3, 200);
  const message = requiredString(payload, "message", 10, 5000);
  const honeypot = Reflect.get(payload, "honeypot");
  const turnstileToken = optionalString(payload, "turnstileToken", 2048);

  if (!requesterName || !requesterEmail || !EMAIL_PATTERN.test(requesterEmail)) return null;
  if (!isRequestType(requestType) || !subject || !message) return null;
  if (typeof honeypot !== "string" || honeypot.length > 200 || turnstileToken === undefined) return null;

  return {
    row: {
      requester_name: requesterName,
      requester_email: requesterEmail,
      request_type: requestType,
      subject,
      message,
    },
    turnstileToken,
  };
}

export async function executeDpoRequestIntake(
  payload: unknown,
  dependencies: {
    authenticatedUserId: string | null;
    verifyTurnstile(token: string): Promise<TurnstileVerificationResult | { ok: false; reason: "configuration" }>;
    insertRequest(row: PrivacySubjectRequestRow): Promise<InsertResult>;
  },
): Promise<DpoRequestIntakeOutcome> {
  if (hasPopulatedHoneypot(payload)) return { status: "turnstile_failed" };
  const parsed = parseDpoRequest(payload);
  if (!parsed) return { status: "invalid_payload" };
  if (!parsed.turnstileToken) return { status: "turnstile_failed" };

  const verification = await dependencies.verifyTurnstile(parsed.turnstileToken);
  if (!verification.ok) {
    if (verification.reason === "configuration") return { status: "configuration_unavailable" };
    if (verification.reason === "unavailable") return { status: "verification_unavailable" };
    return { status: "turnstile_failed" };
  }

  const result = await dependencies.insertRequest({
    ...parsed.row,
    user_id: dependencies.authenticatedUserId,
    status: "received",
    turnstile_verified: true,
  });

  if (result.error) return { status: "database_failed" };
  return { status: "registered" };
}
