import type { TurnstileVerificationResult } from "./turnstile.ts";

const REQUEST_KEYS = new Set([
  "communityId",
  "communitySlug",
  "territoryPath",
  "fullName",
  "email",
  "phone",
  "role",
  "message",
  "wantsUpdates",
  "source",
  "honeypot",
  "turnstileToken",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s.]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CommunityInterestRole =
  | "morador"
  | "comerciante"
  | "prestador"
  | "visitante"
  | "outro";

export interface CommunityInterestRegistrationRow {
  community_id: string | null;
  community_slug: string | null;
  territory_path: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: CommunityInterestRole;
  message: string | null;
  wants_updates: boolean;
  source: string;
  user_agent: string | null;
  turnstile_verified: true;
  user_id: null;
}

interface ParsedCommunityInterestRequest {
  row: Omit<CommunityInterestRegistrationRow, "user_agent" | "turnstile_verified" | "user_id">;
  turnstileToken: string | null;
}

export type CommunityInterestRegistrationOutcome =
  | { status: "registered" }
  | { status: "already_registered" }
  | { status: "turnstile_failed" }
  | { status: "invalid_payload" }
  | { status: "verification_unavailable" }
  | { status: "configuration_unavailable" }
  | { status: "database_failed" };

type InsertResult = { error: { code?: string | null } | null };

function isRole(value: unknown): value is CommunityInterestRole {
  return (
    value === "morador" ||
    value === "comerciante" ||
    value === "prestador" ||
    value === "visitante" ||
    value === "outro"
  );
}

function isLowercaseLetterOrDigit(character: string): boolean {
  const code = character.charCodeAt(0);
  return (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
}

function isSlug(value: string): boolean {
  if (!value || value.startsWith("-") || value.endsWith("-") || value.includes("--")) {
    return false;
  }
  return Array.from(value).every(
    (character) => character === "-" || isLowercaseLetterOrDigit(character),
  );
}

function isTerritoryPath(value: string): boolean {
  if (!value.startsWith("/") || value.endsWith("/") || value.includes("//")) return false;
  return value.slice(1).split("/").every(isSlug);
}

function isSource(value: string): boolean {
  if (!value.startsWith("/")) return isSlug(value);
  if (value.includes("//") || value.includes("..")) return false;
  return Array.from(value.slice(1)).every(
    (character) =>
      character === "/" ||
      character === "_" ||
      character === "-" ||
      isLowercaseLetterOrDigit(character),
  );
}

function requiredString(
  payload: object,
  key: string,
  minimum: number,
  maximum: number,
): string | null {
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
  const honeypot = Reflect.get(payload, "honeypot");
  return typeof honeypot === "string" && honeypot.length <= 200 && honeypot.trim().length > 0;
}

function parseCommunityInterestRequest(payload: unknown): ParsedCommunityInterestRequest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) return null;
  if (Object.keys(payload).length !== REQUEST_KEYS.size) return null;

  const communityId = optionalString(payload, "communityId", 36);
  const communitySlug = optionalString(payload, "communitySlug", 120);
  const territoryPath = optionalString(payload, "territoryPath", 300);
  const fullName = requiredString(payload, "fullName", 2, 120);
  const email = requiredString(payload, "email", 3, 255)?.toLowerCase() ?? null;
  const phone = optionalString(payload, "phone", 30);
  const role = Reflect.get(payload, "role");
  const message = optionalString(payload, "message", 1_000);
  const wantsUpdates = Reflect.get(payload, "wantsUpdates");
  const source = requiredString(payload, "source", 1, 300);
  const honeypotValue = Reflect.get(payload, "honeypot");
  const turnstileToken = optionalString(payload, "turnstileToken", 2_048);

  if (communityId === undefined || (communityId !== null && !UUID_PATTERN.test(communityId))) return null;
  if (communitySlug === undefined || (communitySlug !== null && !isSlug(communitySlug))) return null;
  if (territoryPath === undefined || (territoryPath !== null && !isTerritoryPath(territoryPath))) return null;
  if (!fullName || !email || !EMAIL_PATTERN.test(email)) return null;
  if (phone === undefined || (phone !== null && !PHONE_PATTERN.test(phone))) return null;
  if (
    !isRole(role) ||
    message === undefined ||
    typeof wantsUpdates !== "boolean" ||
    !source ||
    !isSource(source)
  ) return null;
  if (typeof honeypotValue !== "string" || honeypotValue.length > 200 || turnstileToken === undefined) return null;

  return {
    row: {
      community_id: communityId,
      community_slug: communitySlug,
      territory_path: territoryPath,
      full_name: fullName,
      email,
      phone,
      role,
      message,
      wants_updates: wantsUpdates,
      source,
    },
    turnstileToken,
  };
}

export async function executeCommunityInterestRegistration(
  payload: unknown,
  dependencies: {
    userAgent: string | null;
    verifyTurnstile(token: string): Promise<TurnstileVerificationResult | { ok: false; reason: "configuration" }>;
    insertRegistration(row: CommunityInterestRegistrationRow): Promise<InsertResult>;
  },
): Promise<CommunityInterestRegistrationOutcome> {
  if (hasPopulatedHoneypot(payload)) return { status: "turnstile_failed" };
  const parsed = parseCommunityInterestRequest(payload);
  if (!parsed) return { status: "invalid_payload" };
  if (!parsed.turnstileToken) return { status: "turnstile_failed" };

  const verification = await dependencies.verifyTurnstile(parsed.turnstileToken);
  if (!verification.ok) {
    if (verification.reason === "configuration") return { status: "configuration_unavailable" };
    if (verification.reason === "unavailable") return { status: "verification_unavailable" };
    return { status: "turnstile_failed" };
  }

  const result = await dependencies.insertRegistration({
    ...parsed.row,
    user_agent: dependencies.userAgent,
    turnstile_verified: true,
    user_id: null,
  });

  if (result.error?.code === "23505") return { status: "already_registered" };
  if (result.error) return { status: "database_failed" };
  return { status: "registered" };
}
