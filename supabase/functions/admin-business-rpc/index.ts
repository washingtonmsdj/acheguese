/**
 * Edge Function: admin-business-rpc
 *
 * Admin-only broker for sensitive business flags. Browser clients call this
 * function with a verified user JWT; direct Data API writes to admin-only
 * business_data columns remain blocked for authenticated users.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACTIONS = {
  setVerification: true,
  setPremium: true,
  resolveClaim: true,
  grantInstitutionScope: true,
  revokeInstitutionScope: true,
  getInstitutionScopeAdminModel: true,
} as const;

const INSTITUTION_AUTHORITY_KINDS = {
  maintainer: true,
  municipal_secretariat: true,
  state_secretariat: true,
  federal_authority: true,
  education_network: true,
  public_agency: true,
} as const;

type AdminBusinessAction = keyof typeof ACTIONS;
type AdminBusinessFlagAction = Exclude<
  AdminBusinessAction,
  | "resolveClaim"
  | "grantInstitutionScope"
  | "revokeInstitutionScope"
  | "getInstitutionScopeAdminModel"
>;
type InstitutionAuthorityKind = keyof typeof INSTITUTION_AUTHORITY_KINDS;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
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

function cleanUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanText(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim();
  if (
    normalized.length < minLength ||
    normalized.length > maxLength
  ) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return normalized;
}

function cleanHttpUrl(value: unknown, field: string): string {
  const normalized = cleanText(value, field, 8, 2_048);
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported_protocol");
    }
    return url.toString();
  } catch {
    throw new RequestValidationError(`Invalid ${field}`);
  }
}

function cleanAuthorityKind(value: unknown): InstitutionAuthorityKind {
  if (
    typeof value !== "string" ||
    !(value in INSTITUTION_AUTHORITY_KINDS)
  ) {
    throw new RequestValidationError("Invalid authorityKind");
  }
  return value as InstitutionAuthorityKind;
}

function knownRpcReason(errorMessage: string, reasons: readonly string[]): string | null {
  return reasons.find((reason) => errorMessage.includes(reason)) ?? null;
}

async function updateBusinessByPublicId(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: ReturnType<typeof createClient<any, any, any>>,
  publicId: string,
  updates: Record<string, unknown>,
) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const byProfile = await supabaseAdmin
    .from("business_data")
    .update(payload)
    .eq("profile_id", publicId)
    .select("id,profile_id,business_name,is_verified,is_premium,status,updated_at")
    .maybeSingle();

  if (byProfile.error) throw byProfile.error;
  if (byProfile.data) return byProfile.data;

  const byBusinessData = await supabaseAdmin
    .from("business_data")
    .update(payload)
    .eq("id", publicId)
    .select("id,profile_id,business_name,is_verified,is_premium,status,updated_at")
    .maybeSingle();

  if (byBusinessData.error) throw byBusinessData.error;
  if (!byBusinessData.data) {
    throw new RequestValidationError("Business not found");
  }

  return byBusinessData.data;
}

function normalizeUpdate(
  action: AdminBusinessFlagAction,
  params: Record<string, unknown>,
): { businessId: string; updates: Record<string, unknown> } {
  const businessId = cleanUuid(params.businessId, "businessId");

  switch (action) {
    case "setVerification":
      return {
        businessId,
        updates: { is_verified: cleanBoolean(params.isVerified, "isVerified") },
      };
    case "setPremium":
      return {
        businessId,
        updates: { is_premium: cleanBoolean(params.isPremium, "isPremium") },
      };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 80, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 8_192,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as AdminBusinessAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    if (safeAction === "resolveClaim") {
      const claimId = cleanUuid(params.claimId, "claimId");
      const decision = params.decision;
      if (decision !== "approve" && decision !== "reject") {
        throw new RequestValidationError("Invalid decision");
      }
      const reviewNotes =
        typeof params.reviewNotes === "string"
          ? params.reviewNotes.trim().slice(0, 500) || null
          : null;

      const { data, error } = await supabaseAdmin.rpc(
        "admin_resolve_business_claim",
        {
          p_actor_user_id: auth.userId,
          p_claim_id: claimId,
          p_decision: decision,
          p_review_notes: reviewNotes,
        },
      );
      if (error) {
        const knownReason = [
          "business_claim_not_found",
          "business_claim_already_resolved",
          "business_profile_not_claimable",
          "business_profile_already_managed",
          "public_education_claim_requires_documents",
          "public_education_claim_requires_review_notes",
        ].find((reason) => error.message.includes(reason));
        if (knownReason) throw new RequestValidationError(knownReason);
        throw error;
      }

      auditLog({
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        action: "admin_business_resolveClaim",
        resource: "admin-business-rpc",
        status: "success",
        details: { action: safeAction, claimId, decision },
        ...getAuditInfo(req),
      });

      return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
    }

    if (safeAction === "getInstitutionScopeAdminModel") {
      const { data, error } = await supabaseAdmin.rpc(
        "admin_get_business_institution_scope_model",
        { p_actor_user_id: auth.userId },
      );
      if (error) {
        const reason = knownRpcReason(error.message, [
          "institution_scope_admin_required",
        ]);
        if (reason) throw new RequestValidationError(reason);
        throw error;
      }

      auditLog({
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        action: "admin_business_getInstitutionScopeAdminModel",
        resource: "admin-business-rpc",
        status: "success",
        details: { action: safeAction },
        ...getAuditInfo(req),
      });

      return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
    }

    if (safeAction === "grantInstitutionScope") {
      const authorityProfileId = cleanUuid(
        params.authorityProfileId,
        "authorityProfileId",
      );
      const targetProfileId = cleanUuid(
        params.targetProfileId,
        "targetProfileId",
      );
      const authorityKind = cleanAuthorityKind(params.authorityKind);
      const evidenceUrl = cleanHttpUrl(params.evidenceUrl, "evidenceUrl");
      const grantReason = cleanText(params.grantReason, "grantReason", 10, 1_000);

      const { data, error } = await supabaseAdmin.rpc(
        "admin_grant_business_institution_scope",
        {
          p_actor_user_id: auth.userId,
          p_authority_profile_id: authorityProfileId,
          p_target_profile_id: targetProfileId,
          p_authority_kind: authorityKind,
          p_evidence_url: evidenceUrl,
          p_grant_reason: grantReason,
        },
      );
      if (error) {
        const reason = knownRpcReason(error.message, [
          "institution_scope_admin_required",
          "institution_scope_invalid_profiles",
          "institution_scope_invalid_authority_kind",
          "institution_scope_official_evidence_required",
          "institution_scope_grant_reason_required",
          "institution_scope_authority_business_profile_required",
          "institution_scope_public_school_required",
          "institution_scope_network_mismatch",
        ]);
        if (reason) throw new RequestValidationError(reason);
        throw error;
      }

      auditLog({
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        action: "admin_business_grantInstitutionScope",
        resource: "admin-business-rpc",
        status: "success",
        details: {
          action: safeAction,
          authorityProfileId,
          targetProfileId,
          authorityKind,
        },
        ...getAuditInfo(req),
      });

      return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
    }

    if (safeAction === "revokeInstitutionScope") {
      const scopeId = cleanUuid(params.scopeId, "scopeId");
      const revocationReason = cleanText(
        params.revocationReason,
        "revocationReason",
        10,
        1_000,
      );

      const { data, error } = await supabaseAdmin.rpc(
        "admin_revoke_business_institution_scope",
        {
          p_actor_user_id: auth.userId,
          p_scope_id: scopeId,
          p_revocation_reason: revocationReason,
        },
      );
      if (error) {
        const reason = knownRpcReason(error.message, [
          "institution_scope_admin_required",
          "institution_scope_revocation_reason_required",
          "institution_scope_not_active",
        ]);
        if (reason) throw new RequestValidationError(reason);
        throw error;
      }

      auditLog({
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        action: "admin_business_revokeInstitutionScope",
        resource: "admin-business-rpc",
        status: "success",
        details: { action: safeAction, scopeId },
        ...getAuditInfo(req),
      });

      return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
    }

    const normalized = normalizeUpdate(safeAction, params);
    const data = await updateBusinessByPublicId(
      supabaseAdmin,
      normalized.businessId,
      normalized.updates,
    );

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_business_${safeAction}`,
      resource: "admin-business-rpc",
      status: "success",
      details: { action: safeAction, businessId: normalized.businessId },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-business-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_business_${safeAction}`,
      resource: "admin-business-rpc",
      status: "failure",
      details: { action: safeAction, reason: "update_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
