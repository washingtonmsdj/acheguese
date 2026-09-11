// Public Professional lead intake broker.
// Deploy contract: verify_jwt = false because anonymous visitors can request quotes.
// Authenticated identity is resolved from the bearer token and active Profile on the server.

import { getSupabaseAdminClient } from "../_shared/adminAuth.ts";
import {
  executeProfessionalLeadIntake,
  type ProfessionalLeadIntakeRow,
} from "../_shared/professionalLeadIntake.ts";
import {
  extractBearerToken,
  getCorsHeaders,
  getRequiredEnv,
  getTrustedClientIp,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import {
  parseAllowedTurnstileHostnames,
  verifyTurnstileToken,
} from "../_shared/turnstile.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_BODY_BYTES = 12_288;
const MAX_REQUESTS_PER_MINUTE = 5;
const DUPLICATE_WINDOW_MS = 10 * 60 * 1_000;
const TURNSTILE_ACTION = "professional-lead";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdminClient>;
type LeadIdRow = { id: string };

type RequesterIdentity =
  | { ok: true; userId: string | null; profileId: string | null }
  | { ok: false; response: Response };

function getProfileId(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const id = Reflect.get(row, "id");
  return typeof id === "string" ? id : null;
}

async function resolveRequesterIdentity(
  req: Request,
  supabaseAdmin: SupabaseAdmin,
): Promise<RequesterIdentity> {
  const token = extractBearerToken(req);
  if (!token) {
    return { ok: true, userId: null, profileId: null };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return {
      ok: false,
      response: jsonResponse(
        { error: "invalid_or_expired_token" },
        401,
        ALLOWED_METHODS,
        req,
      ),
    };
  }

  const { data: activeProfile, error: activeProfileError } = await supabaseAdmin.rpc(
    "get_active_profile",
    { p_user_id: authData.user.id },
  );
  if (activeProfileError) {
    console.error("[create-professional-lead] active Profile resolution failed", {
      code: activeProfileError.code,
    });
    return {
      ok: false,
      response: jsonResponse(
        { error: "requester_identity_unavailable" },
        503,
        ALLOWED_METHODS,
        req,
      ),
    };
  }

  return {
    ok: true,
    userId: authData.user.id,
    profileId: getProfileId(activeProfile),
  };
}

async function isProfessionalAvailable(
  supabaseAdmin: SupabaseAdmin,
  professionalId: string,
): Promise<boolean> {
  const { data: professional, error: professionalError } = await supabaseAdmin
    .from("professional_data")
    .select("id,profile_id,is_accepting_clients,visibility")
    .eq("id", professionalId)
    .maybeSingle();

  if (
    professionalError ||
    !professional?.is_accepting_clients ||
    (professional.visibility !== "public_listed" &&
      professional.visibility !== "public_unlisted")
  ) {
    return false;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,is_active,is_suspended")
    .eq("id", professional.profile_id)
    .maybeSingle();

  return !profileError && Boolean(profile?.is_active) && !profile?.is_suspended;
}

async function findRecentDuplicate(
  supabaseAdmin: SupabaseAdmin,
  input: {
    professionalId: string;
    requesterUserId: string | null;
    requesterEmail: string | null;
    requesterPhone: string | null;
    serviceNeeded: string;
  },
): Promise<LeadIdRow | null> {
  const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();

  const baseQuery = () =>
    supabaseAdmin
      .from("professional_leads")
      .select("id")
      .eq("professional_id", input.professionalId)
      .eq("service_needed", input.serviceNeeded)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

  if (input.requesterUserId) {
    const { data, error } = await baseQuery()
      .eq("requester_user_id", input.requesterUserId)
      .maybeSingle();
    if (!error && data?.id) return { id: data.id };
  }

  if (input.requesterEmail) {
    const { data, error } = await baseQuery()
      .eq("requester_email", input.requesterEmail)
      .maybeSingle();
    if (!error && data?.id) return { id: data.id };
  }

  if (input.requesterPhone) {
    const { data, error } = await baseQuery()
      .eq("requester_phone", input.requesterPhone)
      .maybeSingle();
    if (!error && data?.id) return { id: data.id };
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const requestOrigin = req.headers.get("origin");
  if (requestOrigin && !isOriginAllowed(requestOrigin)) {
    return jsonResponse({ error: "origin_not_allowed" }, 403, ALLOWED_METHODS, req);
  }

  const body = await readJsonBody<unknown>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    MAX_REQUESTS_PER_MINUTE,
    60_000,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const remoteIp = getTrustedClientIp(req);
  const supabaseAdmin = getSupabaseAdminClient();
  const requesterIdentity = await resolveRequesterIdentity(req, supabaseAdmin);
  if (!requesterIdentity.ok) return requesterIdentity.response;

  try {
    const outcome = await executeProfessionalLeadIntake(body.data, {
      requesterUserId: requesterIdentity.userId,
      requesterProfileId: requesterIdentity.profileId,
      verifyTurnstile: async (token) => {
        try {
          return await verifyTurnstileToken({
            token,
            secret: getRequiredEnv("TURNSTILE_SECRET_KEY"),
            expectedAction: TURNSTILE_ACTION,
            allowedHostnames: parseAllowedTurnstileHostnames(
              getRequiredEnv("ALLOWED_ORIGINS"),
            ),
            remoteIp,
          });
        } catch (error) {
          console.error("[create-professional-lead] Turnstile configuration unavailable", {
            message:
              error instanceof Error ? error.message : "unknown configuration error",
          });
          return { ok: false, reason: "configuration" };
        }
      },
      isProfessionalAvailable: (professionalId) =>
        isProfessionalAvailable(supabaseAdmin, professionalId),
      findRecentDuplicate: (input) => findRecentDuplicate(supabaseAdmin, input),
      insertLead: async (row: ProfessionalLeadIntakeRow) => {
        const { data, error } = await supabaseAdmin
          .from("professional_leads")
          .insert(row)
          .select("id")
          .single();
        if (error) {
          console.error("[create-professional-lead] insert failed", {
            code: error.code,
          });
        }
        return {
          data: data?.id ? { id: data.id } : null,
          error: error ? { code: error.code } : null,
        };
      },
    });

    switch (outcome.status) {
      case "created":
        return jsonResponse(
          { status: outcome.status, lead: outcome.lead },
          201,
          ALLOWED_METHODS,
          req,
        );
      case "already_submitted":
        return jsonResponse(
          { status: outcome.status, lead: outcome.lead },
          200,
          ALLOWED_METHODS,
          req,
        );
      case "turnstile_failed":
        return jsonResponse({ status: outcome.status }, 200, ALLOWED_METHODS, req);
      case "invalid_payload":
        return jsonResponse({ error: outcome.status }, 400, ALLOWED_METHODS, req);
      case "professional_unavailable":
        return jsonResponse({ error: outcome.status }, 409, ALLOWED_METHODS, req);
      case "verification_unavailable":
        return jsonResponse({ error: outcome.status }, 502, ALLOWED_METHODS, req);
      case "configuration_unavailable":
        return jsonResponse({ error: outcome.status }, 503, ALLOWED_METHODS, req);
      case "database_failed":
        return jsonResponse({ error: "lead_creation_failed" }, 500, ALLOWED_METHODS, req);
    }
  } catch (error) {
    console.error("[create-professional-lead] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return jsonResponse({ error: "lead_creation_failed" }, 500, ALLOWED_METHODS, req);
  }
});
