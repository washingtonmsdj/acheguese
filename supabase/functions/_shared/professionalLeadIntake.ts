import type { TurnstileVerificationResult } from "./turnstile.ts";

const REQUEST_KEYS = new Set([
  "professionalId",
  "requesterName",
  "requesterPhone",
  "requesterEmail",
  "serviceNeeded",
  "description",
  "preferredDate",
  "preferredTimeWindow",
  "neighborhood",
  "locationId",
  "sourceChannel",
  "honeypot",
  "turnstileToken",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s.]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOURCE_CHANNELS = new Set(["public_profile", "service_profile", "central"]);

export interface ProfessionalLeadIntakeRow {
  professional_id: string;
  requester_user_id: string | null;
  requester_profile_id: string | null;
  requester_name: string;
  requester_phone: string | null;
  requester_email: string | null;
  service_needed: string;
  description: string;
  preferred_date: string | null;
  preferred_time_window: string | null;
  neighborhood: string | null;
  location_id: string | null;
  source_channel: string;
  status: "new";
  priority: "normal";
  metadata: Record<string, never>;
}

interface ParsedProfessionalLeadRequest {
  professionalId: string;
  requesterName: string;
  requesterPhone: string | null;
  requesterEmail: string | null;
  serviceNeeded: string;
  description: string;
  preferredDate: string | null;
  preferredTimeWindow: string | null;
  neighborhood: string | null;
  locationId: string | null;
  sourceChannel: string;
  turnstileToken: string | null;
}

export type ProfessionalLeadIntakeOutcome<TLead> =
  | { status: "created"; lead: TLead }
  | { status: "already_submitted"; lead: TLead }
  | { status: "turnstile_failed" }
  | { status: "invalid_payload" }
  | { status: "professional_unavailable" }
  | { status: "verification_unavailable" }
  | { status: "configuration_unavailable" }
  | { status: "database_failed" };

function optionalString(
  payload: object,
  key: string,
  maximum: number,
): string | null | undefined {
  const value = Reflect.get(payload, key);
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.length <= maximum ? normalized : undefined;
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
  return normalized.length >= minimum && normalized.length <= maximum
    ? normalized
    : null;
}

function hasPopulatedHoneypot(payload: unknown): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  const honeypot = Reflect.get(payload, "honeypot");
  return typeof honeypot === "string" && honeypot.trim().length > 0;
}

function parseRequest(payload: unknown): ParsedProfessionalLeadRequest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (Object.keys(payload).some((key) => !REQUEST_KEYS.has(key))) return null;
  if (Object.keys(payload).length !== REQUEST_KEYS.size) return null;

  const professionalId = requiredString(payload, "professionalId", 36, 36);
  const requesterName = requiredString(payload, "requesterName", 2, 150);
  const requesterPhone = optionalString(payload, "requesterPhone", 40);
  const requesterEmailRaw = optionalString(payload, "requesterEmail", 254);
  const requesterEmail = requesterEmailRaw?.toLowerCase() ?? requesterEmailRaw;
  const serviceNeeded = requiredString(payload, "serviceNeeded", 3, 160);
  const description = requiredString(payload, "description", 10, 1_000);
  const preferredDate = optionalString(payload, "preferredDate", 10);
  const preferredTimeWindow = optionalString(payload, "preferredTimeWindow", 80);
  const neighborhood = optionalString(payload, "neighborhood", 120);
  const locationId = optionalString(payload, "locationId", 36);
  const sourceChannel = requiredString(payload, "sourceChannel", 1, 50);
  const honeypot = Reflect.get(payload, "honeypot");
  const turnstileToken = optionalString(payload, "turnstileToken", 2_048);

  if (!professionalId || !UUID_PATTERN.test(professionalId)) return null;
  if (!requesterName || !serviceNeeded || !description || !sourceChannel) return null;
  if (!SOURCE_CHANNELS.has(sourceChannel)) return null;
  if (requesterPhone === undefined || requesterEmail === undefined) return null;
  if (!requesterPhone && !requesterEmail) return null;
  if (requesterPhone && !PHONE_PATTERN.test(requesterPhone)) return null;
  if (requesterEmail && !EMAIL_PATTERN.test(requesterEmail)) return null;
  if (preferredDate === undefined || (preferredDate && !DATE_PATTERN.test(preferredDate))) return null;
  if (preferredTimeWindow === undefined || neighborhood === undefined) return null;
  if (locationId === undefined || (locationId && !UUID_PATTERN.test(locationId))) return null;
  if (typeof honeypot !== "string" || honeypot.length > 200) return null;
  if (turnstileToken === undefined) return null;

  return {
    professionalId,
    requesterName,
    requesterPhone,
    requesterEmail,
    serviceNeeded,
    description,
    preferredDate,
    preferredTimeWindow,
    neighborhood,
    locationId,
    sourceChannel,
    turnstileToken,
  };
}

export async function executeProfessionalLeadIntake<TLead>(
  payload: unknown,
  dependencies: {
    requesterUserId: string | null;
    requesterProfileId: string | null;
    verifyTurnstile(token: string): Promise<
      TurnstileVerificationResult | { ok: false; reason: "configuration" }
    >;
    isProfessionalAvailable(professionalId: string): Promise<boolean>;
    findRecentDuplicate(input: {
      professionalId: string;
      requesterUserId: string | null;
      requesterEmail: string | null;
      requesterPhone: string | null;
      serviceNeeded: string;
    }): Promise<TLead | null>;
    insertLead(row: ProfessionalLeadIntakeRow): Promise<{
      data: TLead | null;
      error: { code?: string | null } | null;
    }>;
  },
): Promise<ProfessionalLeadIntakeOutcome<TLead>> {
  if (hasPopulatedHoneypot(payload)) return { status: "turnstile_failed" };

  const parsed = parseRequest(payload);
  if (!parsed) return { status: "invalid_payload" };
  if (!parsed.turnstileToken) return { status: "turnstile_failed" };

  const verification = await dependencies.verifyTurnstile(parsed.turnstileToken);
  if (!verification.ok) {
    if (verification.reason === "configuration") return { status: "configuration_unavailable" };
    if (verification.reason === "unavailable") return { status: "verification_unavailable" };
    return { status: "turnstile_failed" };
  }

  if (!(await dependencies.isProfessionalAvailable(parsed.professionalId))) {
    return { status: "professional_unavailable" };
  }

  const duplicate = await dependencies.findRecentDuplicate({
    professionalId: parsed.professionalId,
    requesterUserId: dependencies.requesterUserId,
    requesterEmail: parsed.requesterEmail,
    requesterPhone: parsed.requesterPhone,
    serviceNeeded: parsed.serviceNeeded,
  });
  if (duplicate) return { status: "already_submitted", lead: duplicate };

  const result = await dependencies.insertLead({
    professional_id: parsed.professionalId,
    requester_user_id: dependencies.requesterUserId,
    requester_profile_id: dependencies.requesterProfileId,
    requester_name: parsed.requesterName,
    requester_phone: parsed.requesterPhone,
    requester_email: parsed.requesterEmail,
    service_needed: parsed.serviceNeeded,
    description: parsed.description,
    preferred_date: parsed.preferredDate,
    preferred_time_window: parsed.preferredTimeWindow,
    neighborhood: parsed.neighborhood,
    location_id: parsed.locationId,
    source_channel: parsed.sourceChannel,
    status: "new",
    priority: "normal",
    metadata: {},
  });

  if (result.error || !result.data) return { status: "database_failed" };
  return { status: "created", lead: result.data };
}
