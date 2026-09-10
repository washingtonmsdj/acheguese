/**
 * Edge Function: profile-rpc
 *
 * Authenticated broker for privileged profile mutations. Browser clients never
 * execute the backing SECURITY DEFINER RPCs directly.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
import {
  auditLog,
  extractBearerToken,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = {
  createPersonal: true,
  createBusiness: true,
  updateBusiness: true,
  deactivateBusiness: true,
  createProfessional: true,
  updateProfessionalData: true,
  deactivateProfessional: true,
  updateOwnedProfile: true,
  clearExpiredSuspension: true,
  updateHandle: true,
  deleteProfile: true,
  transferOwnership: true,
  inviteMemberByEmail: true,
  getAccessibleProfiles: true,
  getVisibleContact: true,
} as const;

type ProfileRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;
type ProfileType = "personal" | "business" | "professional" | "driver";
type ProfileMemberRole = "member" | "admin";

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function optionalUuidArray(value: unknown, field: string): string[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length > 100) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value.map((item) => requireUuid(item, field));
}

function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return normalized;
}

function optionalString(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return normalized || null;
}

function requireEmail(value: unknown): string {
  const email = requireString(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Invalid email");
  }
  return email;
}

function requireProfileType(value: unknown): ProfileType {
  if (
    value !== "personal" &&
    value !== "business" &&
    value !== "professional" &&
    value !== "driver"
  ) {
    throw new RequestValidationError("Invalid profileType");
  }
  return value;
}

function optionalProfileType(value: unknown): ProfileType | "community" | null {
  if (value === undefined || value === null || value === "") return null;
  if (
    value !== "personal" &&
    value !== "business" &&
    value !== "professional" &&
    value !== "driver" &&
    value !== "community"
  ) {
    throw new RequestValidationError("Invalid profileType");
  }
  return value;
}

function optionalExtensionData(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid extensionData");
  }

  const sanitized = { ...(value as Record<string, unknown>) };
  delete sanitized._actor_user_id;
  delete sanitized.actor_user_id;
  delete sanitized.p_actor_user_id;
  delete sanitized.user_id;
  return sanitized;
}

const BUSINESS_PATCH_KEYS = new Set([
  "business_name",
  "legal_name",
  "cnpj",
  "company_type",
  "industry",
  "employee_count",
  "founded_year",
  "description",
  "category",
  "subcategory",
  "website",
  "instagram",
  "facebook",
  "payment_methods",
  "specialties",
  "facilities",
  "status",
  "slug",
  "metadata",
  "location_id",
  "address_id",
  "business_address",
  "business_city",
  "business_state",
  "business_zip",
  "can_post_vagas",
]);

function sanitizeBusinessPatch(
  value: unknown,
  options: { requireCreateFields?: boolean } = {},
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestValidationError("Invalid business patch");
  }

  const input = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(input)) {
    if (!BUSINESS_PATCH_KEYS.has(key)) {
      throw new RequestValidationError(`Unsupported business field: ${key}`);
    }
  }

  if (options.requireCreateFields) {
    input.business_name = requireString(input.business_name, "business_name", 100);
    input.description = requireString(input.description, "description", 1000);
    input.category = requireString(input.category, "category", 100);
    input.slug = requireString(input.slug, "slug", 60);
    input.location_id = requireUuid(input.location_id, "location_id");
  } else if ("business_name" in input) {
    input.business_name = requireString(input.business_name, "business_name", 100);
  }

  for (const [key, maxLength] of [
    ["legal_name", 150],
    ["cnpj", 32],
    ["industry", 100],
    ["description", 1000],
    ["category", 100],
    ["subcategory", 80],
    ["website", 2048],
    ["instagram", 120],
    ["facebook", 200],
    ["business_address", 240],
    ["business_city", 100],
    ["business_state", 100],
    ["business_zip", 16],
  ] as const) {
    if (key in input) {
      input[key] = optionalString(input[key], key, maxLength);
    }
  }

  if ("slug" in input) {
    const slug = requireString(input.slug, "slug", 60).toLowerCase();
    if (
      slug.length < 3 ||
      !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) ||
      slug.includes("--")
    ) {
      throw new RequestValidationError("Invalid slug");
    }
    input.slug = slug;
  }

  for (const key of ["location_id", "address_id"] as const) {
    if (key in input) {
      input[key] = optionalUuid(input[key], key);
    }
  }

  if (
    "founded_year" in input &&
    input.founded_year !== null &&
    (
      typeof input.founded_year !== "number" ||
      !Number.isInteger(input.founded_year) ||
      input.founded_year < 1800 ||
      input.founded_year > new Date().getUTCFullYear()
    )
  ) {
    throw new RequestValidationError("Invalid founded_year");
  }

  if (
    "company_type" in input &&
    input.company_type !== null &&
    !["mei", "ltda", "sa", "eireli", "other"].includes(String(input.company_type))
  ) {
    throw new RequestValidationError("Invalid company_type");
  }

  if (
    "employee_count" in input &&
    input.employee_count !== null &&
    !["1-10", "11-50", "51-200", "201-500", "500+"].includes(
      String(input.employee_count),
    )
  ) {
    throw new RequestValidationError("Invalid employee_count");
  }

  if (
    "status" in input &&
    input.status !== null &&
    !["active", "inactive", "pending"].includes(String(input.status))
  ) {
    throw new RequestValidationError("Invalid owner business status");
  }

  if (
    "can_post_vagas" in input &&
    input.can_post_vagas !== null &&
    typeof input.can_post_vagas !== "boolean"
  ) {
    throw new RequestValidationError("Invalid can_post_vagas");
  }

  for (const key of ["payment_methods", "specialties", "facilities"] as const) {
    if (!(key in input) || input[key] === null) continue;
    if (!Array.isArray(input[key]) || (input[key] as unknown[]).length > 100) {
      throw new RequestValidationError(`Invalid ${key}`);
    }
    input[key] = (input[key] as unknown[]).map((item) =>
      requireString(item, key, 160),
    );
  }

  if ("metadata" in input && input.metadata !== null) {
    if (
      typeof input.metadata !== "object" ||
      Array.isArray(input.metadata)
    ) {
      throw new RequestValidationError("Invalid metadata");
    }
    const metadata = { ...(input.metadata as Record<string, unknown>) };
    const allowedMetadata = new Set([
      "logo_url",
      "banner_url",
      "modos_atendimento",
      "tem_delivery",
      "aceita_cartao",
      "aceita_pix",
      "neighborhood",
      "cep",
      "city",
      "state",
    ]);
    for (const key of Object.keys(metadata)) {
      if (!allowedMetadata.has(key)) {
        throw new RequestValidationError(
          `Unsupported business metadata field: ${key}`,
        );
      }
    }
    for (const key of ["tem_delivery", "aceita_cartao", "aceita_pix"]) {
      if (
        key in metadata &&
        metadata[key] !== null &&
        typeof metadata[key] !== "boolean"
      ) {
        throw new RequestValidationError(`Invalid metadata.${key}`);
      }
    }
    if (
      "modos_atendimento" in metadata &&
      metadata.modos_atendimento !== null &&
      (
        !Array.isArray(metadata.modos_atendimento) ||
        metadata.modos_atendimento.length > 20
      )
    ) {
      throw new RequestValidationError("Invalid metadata.modos_atendimento");
    }
    input.metadata = metadata;
  }

  return input;
}

function sanitizeContactChannels(value: unknown): Array<Record<string, unknown>> | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length > 3) {
    throw new RequestValidationError("Invalid contact channels");
  }

  const seen = new Set<string>();
  return value.map((raw) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new RequestValidationError("Invalid contact channel");
    }
    const channel = raw as Record<string, unknown>;
    const channelType = requireString(channel.channelType, "channelType", 16);
    if (!["phone", "whatsapp", "email"].includes(channelType) || seen.has(channelType)) {
      throw new RequestValidationError("Invalid or duplicate contact channel");
    }
    seen.add(channelType);

    const channelValue = optionalString(channel.value, "value", 254);
    const visibility =
      channel.visibility === undefined || channel.visibility === null
        ? "authenticated"
        : requireString(channel.visibility, "visibility", 32);
    if (!["private", "authenticated"].includes(visibility)) {
      throw new RequestValidationError("Invalid contact visibility");
    }

    return {
      channelType,
      value: channelValue,
      visibility,
    };
  });
}

function sanitizeBusinessHours(value: unknown): Array<Record<string, unknown>> | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length > 7) {
    throw new RequestValidationError("Invalid business hours");
  }

  const seen = new Set<number>();
  return value.map((raw) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      throw new RequestValidationError("Invalid business hours row");
    }
    const row = raw as Record<string, unknown>;
    const day = row.day_of_week;
    if (
      typeof day !== "number" ||
      !Number.isInteger(day) ||
      day < 0 ||
      day > 6 ||
      seen.has(day)
    ) {
      throw new RequestValidationError("Invalid or duplicate business hours day");
    }
    seen.add(day);

    const opensAt = requireString(row.opens_at, "opens_at", 5);
    const closesAt = requireString(row.closes_at, "closes_at", 5);
    if (
      !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(opensAt) ||
      !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(closesAt)
    ) {
      throw new RequestValidationError("Invalid business hour");
    }
    if (
      row.is_closed !== undefined &&
      row.is_closed !== null &&
      typeof row.is_closed !== "boolean"
    ) {
      throw new RequestValidationError("Invalid is_closed");
    }

    return {
      day_of_week: day,
      opens_at: opensAt,
      closes_at: closesAt,
      is_closed: row.is_closed === true,
    };
  });
}

const OWNED_PROFILE_PATCH_KEYS = new Set([
  "name",
  "display_name",
  "bio",
  "short_bio",
  "avatar_url",
  "city",
  "neighborhood",
  "street",
  "state",
  "location_id",
  "main_territory_location_id",
  "public_location_visibility",
  "is_active",
  "contact_email",
  "phone",
  "website",
  "location",
  "is_public",
  "show_contact_email",
  "show_phone",
  "show_linked_profiles",
  "show_business_links",
  "show_professional_links",
  "share_activity_default",
]);

function sanitizeOwnedProfilePatch(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestValidationError("Invalid profile patch");
  }

  const input = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(input)) {
    if (!OWNED_PROFILE_PATCH_KEYS.has(key)) {
      throw new RequestValidationError(`Unsupported profile field: ${key}`);
    }
  }

  if ("name" in input) {
    input.name = requireString(input.name, "name", 160);
  }

  for (const [key, maxLength] of [
    ["display_name", 160],
    ["bio", 4000],
    ["short_bio", 280],
    ["avatar_url", 2048],
    ["city", 160],
    ["neighborhood", 160],
    ["street", 300],
    ["state", 160],
    ["location", 160],
    ["phone", 64],
    ["website", 2048],
  ] as const) {
    if (key in input) {
      input[key] = optionalString(input[key], key, maxLength);
    }
  }

  if ("contact_email" in input) {
    const email = optionalString(input.contact_email, "contact_email", 254);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new RequestValidationError("Invalid contact_email");
    }
    input.contact_email = email;
  }

  for (const key of ["location_id", "main_territory_location_id"] as const) {
    if (key in input) {
      input[key] = optionalUuid(input[key], key);
    }
  }

  for (const key of [
    "is_active",
    "is_public",
    "show_contact_email",
    "show_phone",
    "show_linked_profiles",
    "show_business_links",
    "show_professional_links",
    "share_activity_default",
  ] as const) {
    if (key in input && input[key] !== null && typeof input[key] !== "boolean") {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  if (
    "public_location_visibility" in input &&
    input.public_location_visibility !== null &&
    !["hidden", "city_only", "district"].includes(
      String(input.public_location_visibility),
    )
  ) {
    throw new RequestValidationError("Invalid public_location_visibility");
  }

  return input;
}

function optionalUsername(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const username = requireString(value, "username", 30).toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,29}$/.test(username)) {
    throw new RequestValidationError("Invalid username");
  }
  return username;
}

const PROFESSIONAL_PATCH_KEYS = new Set([
  "slug",
  "professional_name",
  "service_category",
  "service_subcategory",
  "description",
  "certifications",
  "experience_years",
  "education",
  "price_range",
  "available_hours",
  "is_accepting_clients",
  "address_id",
  "location_id",
  "metadata",
  "visibility",
  "availability_notes",
  "portfolio_items",
  "profession",
  "specialties",
  "years_experience",
  "services_offered",
  "service_area",
  "hourly_rate",
  "accepts_remote",
]);

function sanitizeProfessionalPatch(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestValidationError("Invalid professionalPatch");
  }

  const input = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(input)) {
    if (!PROFESSIONAL_PATCH_KEYS.has(key)) {
      throw new RequestValidationError(`Unsupported professional field: ${key}`);
    }
  }

  for (const key of [
    "professional_name",
    "service_category",
    "service_subcategory",
    "description",
    "education",
    "price_range",
    "availability_notes",
    "profession",
    "slug",
  ]) {
    const fieldValue = input[key];
    if (fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== "string") {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  if ("professional_name" in input) {
    input.professional_name = requireString(
      input.professional_name,
      "professional_name",
      160,
    );
  }

  if ("service_category" in input) {
    input.service_category = requireString(
      input.service_category,
      "service_category",
      100,
    );
  }

  if ("location_id" in input && (input.location_id === null || input.location_id === "")) {
    throw new RequestValidationError("location_id cannot be cleared");
  }

    if (typeof input.slug === "string") {
    const slug = input.slug.trim().toLowerCase();
    if (
      slug.length < 2 ||
      slug.length > 100 ||
      !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)
    ) {
      throw new RequestValidationError("Invalid slug");
    }
    input.slug = slug;
  }

  for (const key of ["address_id", "location_id"]) {
    if (key in input) {
      input[key] = optionalUuid(input[key], key);
    }
  }

  for (const key of ["is_accepting_clients", "accepts_remote"]) {
    if (
      key in input &&
      input[key] !== null &&
      typeof input[key] !== "boolean"
    ) {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  for (const key of ["experience_years", "years_experience", "hourly_rate"]) {
    if (
      key in input &&
      input[key] !== null &&
      (typeof input[key] !== "number" || !Number.isFinite(input[key] as number))
    ) {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  for (const key of ["certifications", "specialties", "services_offered", "service_area"]) {
    if (
      key in input &&
      input[key] !== null &&
      (!Array.isArray(input[key]) || (input[key] as unknown[]).length > 100)
    ) {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  if (
    "portfolio_items" in input &&
    input.portfolio_items !== null &&
    (!Array.isArray(input.portfolio_items) || input.portfolio_items.length > 50)
  ) {
    throw new RequestValidationError("Invalid portfolio_items");
  }

  for (const key of ["metadata", "available_hours"]) {
    if (
      key in input &&
      input[key] !== null &&
      (typeof input[key] !== "object" || Array.isArray(input[key]))
    ) {
      throw new RequestValidationError(`Invalid ${key}`);
    }
  }

  if (
    "visibility" in input &&
    input.visibility !== null &&
    !["public_listed", "public_unlisted", "private"].includes(String(input.visibility))
  ) {
    throw new RequestValidationError("Invalid visibility");
  }

  return input;
}

function requireInviteRole(value: unknown): ProfileMemberRole {
  if (value === undefined || value === null || value === "") return "member";
  if (value !== "member" && value !== "admin") {
    throw new RequestValidationError("Invalid role");
  }
  return value;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Missing or invalid authorization header" }, 401, ALLOWED_METHODS, req);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401, ALLOWED_METHODS, req);
  }

  return { userId: data.user.id };
}

async function handleCreatePersonal(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const username = requireString(params.username, "username", 30);
  const name = requireString(params.name, "name", 160);
  const displayName =
    optionalString(params.displayName, "displayName", 160) ?? name;
  const avatarUrl = optionalString(params.avatarUrl, "avatarUrl", 2048);
  const bio = optionalString(params.bio, "bio", 4000);
  const shortBio = optionalString(params.shortBio, "shortBio", 280);
  const city = requireString(params.city, "city", 160);
  const neighborhood = optionalString(params.neighborhood, "neighborhood", 160);
  const street = optionalString(params.street, "street", 300);

  const publicLocationVisibilityRaw = params.publicLocationVisibility;
  const publicLocationVisibility =
    publicLocationVisibilityRaw === undefined ||
      publicLocationVisibilityRaw === null ||
      publicLocationVisibilityRaw === ""
      ? null
      : publicLocationVisibilityRaw;

  if (
    publicLocationVisibility !== null &&
    publicLocationVisibility !== "hidden" &&
    publicLocationVisibility !== "city_only" &&
    publicLocationVisibility !== "district"
  ) {
    throw new RequestValidationError("Invalid publicLocationVisibility");
  }

  const patch: Record<string, unknown> = {
    name,
    display_name: displayName,
    city,
  };
  if (shortBio !== null) patch.short_bio = shortBio;
  if (neighborhood !== null) patch.neighborhood = neighborhood;
  if (street !== null) patch.street = street;
  if (publicLocationVisibility !== null) {
    patch.public_location_visibility = publicLocationVisibility;
  }

  const { data, error } = await supabaseAdmin.rpc(
    "profile_rpc_create_personal",
    {
      p_actor_user_id: auth.userId,
      p_username: username,
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
      p_bio: bio,
      p_patch: patch,
    },
  );

  if (error) throw error;
  return data ?? { success: false, error: "Personal profile RPC returned no data" };
}

async function handleCreateBusiness(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const businessPatch = sanitizeBusinessPatch(params.businessPatch, {
    requireCreateFields: true,
  });
  const contactChannels = sanitizeContactChannels(params.contactChannels);
  const businessHours = sanitizeBusinessHours(params.businessHours);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_create_business", {
    p_actor_user_id: auth.userId,
    p_business_patch: businessPatch,
    p_contact_channels: contactChannels,
    p_business_hours: businessHours,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Business create RPC returned no data" };
}

async function handleUpdateBusiness(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");
  const businessPatch = sanitizeBusinessPatch(params.businessPatch ?? {});
  const contactChannels = sanitizeContactChannels(params.contactChannels);
  const businessHours = sanitizeBusinessHours(params.businessHours);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_update_business", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_business_patch: businessPatch,
    p_contact_channels: contactChannels,
    p_business_hours: businessHours,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Business update RPC returned no data" };
}

async function handleDeactivateBusiness(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");

  const { data, error } = await supabaseAdmin.rpc(
    "profile_rpc_deactivate_business",
    {
      p_actor_user_id: auth.userId,
      p_profile_id: profileId,
    },
  );

  if (error) throw error;
  return data ?? { success: false, error: "Business deactivate RPC returned no data" };
}

async function handleCreateProfessional(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const handle = requireString(params.handle, "handle", 100);
  const displayName = requireString(params.displayName, "displayName", 160);
  const avatarUrl = optionalString(params.avatarUrl, "avatarUrl", 2048);
  const bio = optionalString(params.bio, "bio", 4000);
  const extensionData = optionalExtensionData(params.extensionData);
  if (!extensionData) {
    throw new RequestValidationError("extensionData is required");
  }
  const professionalPatch = sanitizeProfessionalPatch(params.professionalPatch ?? {});

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_create_professional", {
    p_actor_user_id: auth.userId,
    p_handle: handle,
    p_display_name: displayName,
    p_avatar_url: avatarUrl,
    p_bio: bio,
    p_extension_data: extensionData,
    p_professional_patch: professionalPatch,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Professional create RPC returned no data" };
}

async function handleUpdateProfessionalData(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");
  const patch = sanitizeProfessionalPatch(params.patch);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_update_professional_data", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_patch: patch,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Professional update RPC returned no data" };
}

async function handleDeactivateProfessional(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_deactivate_professional", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Professional deactivate RPC returned no data" };
}

async function handleUpdateOwnedProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");
  const patch = sanitizeOwnedProfilePatch(params.patch ?? {});
  const newUsername = optionalUsername(params.newUsername);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_update_owned_profile", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_patch: patch,
    p_new_username: newUsername,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile update RPC returned no data" };
}

async function handleClearExpiredSuspension(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");

  const { data, error } = await supabaseAdmin.rpc(
    "profile_rpc_clear_expired_suspension",
    {
      p_actor_user_id: auth.userId,
      p_profile_id: profileId,
    },
  );

  if (error) throw error;
  return data ?? { success: false, error: "Suspension clear RPC returned no data" };
}

async function handleUpdateHandle(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const newHandle = requireString(params.newHandle ?? params.p_new_handle, "newHandle", 100);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_update_profile_handle", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_new_handle: newHandle,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleDeleteProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_delete_profile", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleTransferOwnership(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const newOwnerUserId = requireUuid(
    params.newOwnerUserId ?? params.p_new_owner_user_id,
    "newOwnerUserId",
  );

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_transfer_profile_ownership", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_new_owner_user_id: newOwnerUserId,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleInviteMemberByEmail(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const email = requireEmail(params.email ?? params.p_email);
  const role = requireInviteRole(params.role ?? params.p_role);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_invite_profile_member_by_email", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_email: email,
    p_role: role,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleGetAccessibleProfiles(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileIds = optionalUuidArray(params.profileIds, "profileIds");
  const targetUserId = optionalUuid(params.targetUserId, "targetUserId");
  const profileType = optionalProfileType(params.profileType);

  if (profileIds === null && targetUserId === null) {
    throw new RequestValidationError("profileIds or targetUserId is required");
  }

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_get_accessible_profiles", {
    p_actor_user_id: auth.userId,
    p_profile_ids: profileIds,
    p_target_user_id: targetUserId,
    p_profile_type: profileType,
  });

  if (error) throw error;
  return data ?? [];
}

async function handleGetVisibleContact(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");
  const { data, error } = await supabaseAdmin.rpc("profile_rpc_get_visible_contact", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data ?? null;
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: ProfileRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "createPersonal":
      return handleCreatePersonal(supabaseAdmin, auth, params);
    case "createBusiness":
      return handleCreateBusiness(supabaseAdmin, auth, params);
    case "updateBusiness":
      return handleUpdateBusiness(supabaseAdmin, auth, params);
    case "deactivateBusiness":
      return handleDeactivateBusiness(supabaseAdmin, auth, params);
    case "createProfessional":
      return handleCreateProfessional(supabaseAdmin, auth, params);
    case "updateProfessionalData":
      return handleUpdateProfessionalData(supabaseAdmin, auth, params);
    case "deactivateProfessional":
      return handleDeactivateProfessional(supabaseAdmin, auth, params);
    case "updateOwnedProfile":
      return handleUpdateOwnedProfile(supabaseAdmin, auth, params);
    case "clearExpiredSuspension":
      return handleClearExpiredSuspension(supabaseAdmin, auth, params);
    case "updateHandle":
      return handleUpdateHandle(supabaseAdmin, auth, params);
    case "deleteProfile":
      return handleDeleteProfile(supabaseAdmin, auth, params);
    case "transferOwnership":
      return handleTransferOwnership(supabaseAdmin, auth, params);
    case "inviteMemberByEmail":
      return handleInviteMemberByEmail(supabaseAdmin, auth, params);
    case "getAccessibleProfiles":
      return handleGetAccessibleProfiles(supabaseAdmin, auth, params);
    case "getVisibleContact":
      return handleGetVisibleContact(supabaseAdmin, auth, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const auth = await requireUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const accountOperationalError = await requireOperationalAccount(
    supabaseAdmin,
    auth.userId,
    req,
    ALLOWED_METHODS,
  );
  if (accountOperationalError) return accountOperationalError;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as ProfileRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `profile_rpc_${safeAction}`,
      resource: "profile-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[profile-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `profile_rpc_${safeAction}`,
      resource: "profile-rpc",
      status: "failure",
      details: { action: safeAction, reason: "profile_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
