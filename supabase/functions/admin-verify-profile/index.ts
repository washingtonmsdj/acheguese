/**
 * Administrative broker for the canonical profile-verification aggregate.
 * Browser sessions never receive service-role access and never mutate review
 * state directly.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, jsonResponse } from "../_shared/adminAuth.ts";
import {
  auditLog,
  getAuditInfo,
  getAllSecurityHeaders,
  isOriginAllowed,
  isValidUUID,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
  sanitizeString,
} from "../_shared/security.ts";

type VerificationStatus = "pending" | "approved" | "rejected" | "revoked";
type VerificationDecision = "approve" | "reject" | "revoke";

interface AdminVerificationRequest {
  action?: "list" | "stats" | "review" | "verify_profile";
  status?: VerificationStatus;
  limit?: number;
  offset?: number;
  verification_id?: string;
  profile_id?: string;
  decision?: VerificationDecision;
  reason?: string;
}

interface VerificationRow {
  id: string;
  profile_id: string;
  verification_type: string;
  status: VerificationStatus;
  document_url: string | null;
  document_type: string | null;
  notes: string | null;
  review_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileSummary {
  id: string;
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
}

const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_STATUSES = new Set<VerificationStatus>([
  "pending",
  "approved",
  "rejected",
  "revoked",
]);
const ALLOWED_DECISIONS = new Set<VerificationDecision>([
  "approve",
  "reject",
  "revoke",
]);

function boundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    return fallback;
  return Math.max(min, Math.min(max, value));
}

Deno.serve(async (req: Request) => {
  const auditInfo = getAuditInfo(req);
  const respond = (body: unknown, status = 200) =>
    jsonResponse(body, status, ALLOWED_METHODS, req);
  const origin = req.headers.get("origin");

  if (origin && !isOriginAllowed(origin)) {
    return respond({ error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 30, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const rawBody = await readJsonBody<AdminVerificationRequest>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const body = rawBody.data;
  const action =
    body.action ?? (body.profile_id ? "verify_profile" : undefined);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond({ error: "Service unavailable" }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    if (action === "list") {
      const status = body.status ?? "pending";
      if (!ALLOWED_STATUSES.has(status)) {
        return respond({ error: "Invalid status" }, 400);
      }

      const limit = boundedInteger(body.limit, 50, 1, 100);
      const offset = boundedInteger(body.offset, 0, 0, 10_000);
      const { data, error, count } = await supabase
        .from("verification")
        .select(
          "id, profile_id, verification_type, status, document_url, document_type, notes, review_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
          { count: "exact" },
        )
        .eq("status", status)
        .order(status === "pending" ? "submitted_at" : "reviewed_at", {
          ascending: status === "pending",
          nullsFirst: false,
        })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const rows = (data ?? []) as VerificationRow[];
      const profileIds = [...new Set(rows.map((row) => row.profile_id))];
      let profiles: ProfileSummary[] = [];
      if (profileIds.length > 0) {
        const profileResult = await supabase
          .from("profiles")
          .select("id, display_name, name, avatar_url")
          .in("id", profileIds);
        if (profileResult.error) throw profileResult.error;
        profiles = (profileResult.data ?? []) as ProfileSummary[];
      }

      const profileById = new Map(
        profiles.map((profile) => [profile.id, profile]),
      );
      return respond({
        items: rows.map((row) => {
          const profile = profileById.get(row.profile_id);
          return {
            ...row,
            display_name: profile?.display_name || profile?.name || "Sem nome",
            avatar_url: profile?.avatar_url ?? null,
          };
        }),
        total: count ?? rows.length,
      });
    }

    if (action === "stats") {
      const counts = await Promise.all(
        [...ALLOWED_STATUSES].map(async (status) => {
          const { count, error } = await supabase
            .from("verification")
            .select("id", { count: "exact", head: true })
            .eq("status", status);
          if (error) throw error;
          return [status, count ?? 0] as const;
        }),
      );
      const byStatus = Object.fromEntries(counts) as Record<
        VerificationStatus,
        number
      >;
      return respond({
        ...byStatus,
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
      });
    }

    if (action === "review") {
      if (!isValidUUID(body.verification_id)) {
        return respond({ error: "Valid verification_id is required" }, 400);
      }
      if (!body.decision || !ALLOWED_DECISIONS.has(body.decision)) {
        return respond({ error: "Invalid decision" }, 400);
      }

      const reason = body.reason?.trim()
        ? sanitizeString(body.reason, 500)
        : null;
      if (
        (body.decision === "reject" || body.decision === "revoke") &&
        (!reason || reason.length < 10)
      ) {
        return respond(
          { error: "Decision reason must have at least 10 characters" },
          400,
        );
      }

      const { data, error } = await supabase.rpc(
        "review_profile_verification",
        {
          p_actor_user_id: authResult.userId,
          p_verification_id: body.verification_id,
          p_decision: body.decision,
          p_reason: reason,
        },
      );
      if (error) throw error;

      auditLog({
        timestamp: new Date().toISOString(),
        userId: authResult.userId,
        action: `profile_verification_${body.decision}`,
        resource: "verification",
        status: "success",
        details: { verificationId: body.verification_id },
        ...auditInfo,
      });
      return respond({ verification: data });
    }

    if (action === "verify_profile") {
      if (!isValidUUID(body.profile_id)) {
        return respond({ error: "Valid profile_id is required" }, 400);
      }
      const reason = body.reason?.trim()
        ? sanitizeString(body.reason, 500)
        : null;
      const { data, error } = await supabase.rpc(
        "set_profile_verification_badge",
        {
          p_actor_user_id: authResult.userId,
          p_profile_id: body.profile_id,
          p_reason: reason,
        },
      );
      if (error) throw error;

      auditLog({
        timestamp: new Date().toISOString(),
        userId: authResult.userId,
        action: "verify_profile",
        resource: "profiles",
        status: "success",
        details: { profileId: body.profile_id },
        ...auditInfo,
      });
      return respond({ verification: data });
    }

    return respond({ error: "Invalid action" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: "profile_verification_failed",
      resource: "verification",
      status: "failure",
      details: { action, error: message },
      ...auditInfo,
    });
    return respond({ error: "Profile verification operation failed" }, 500);
  }
});
