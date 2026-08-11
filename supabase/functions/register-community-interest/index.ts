// Public Community Interest registration broker.
// Deploy contract: verify_jwt = false. Secrets remain server-side.

import { getSupabaseAdminClient } from "../_shared/adminAuth.ts";
import { executeCommunityInterestRegistration } from "../_shared/communityInterestRegistration.ts";
import {
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
const MAX_BODY_BYTES = 8_192;
const MAX_REQUESTS_PER_MINUTE = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(ALLOWED_METHODS, req) });
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

  const userAgent = req.headers.get("user-agent")?.trim().slice(0, 500) || null;
  const remoteIp = getTrustedClientIp(req);

  try {
    const outcome = await executeCommunityInterestRegistration(body.data, {
      userAgent,
      verifyTurnstile: async (token) => {
        try {
          const secret = getRequiredEnv("TURNSTILE_SECRET_KEY");
          const allowedHostnames = parseAllowedTurnstileHostnames(
            getRequiredEnv("ALLOWED_ORIGINS"),
          );
          return await verifyTurnstileToken({
            token,
            secret,
            allowedHostnames,
            remoteIp,
          });
        } catch (error) {
          console.error("[register-community-interest] configuration unavailable", {
            message: error instanceof Error ? error.message : "unknown configuration error",
          });
          return { ok: false, reason: "configuration" };
        }
      },
      insertRegistration: async (row) => {
        const { error } = await getSupabaseAdminClient()
          .from("community_interest_registrations")
          .insert(row);
        if (error) {
          console.error("[register-community-interest] insert failed", { code: error.code });
        }
        return { error: error ? { code: error.code } : null };
      },
    });

    switch (outcome.status) {
      case "registered":
        return jsonResponse({ status: outcome.status }, 201, ALLOWED_METHODS, req);
      case "already_registered":
      case "turnstile_failed":
        return jsonResponse({ status: outcome.status }, 200, ALLOWED_METHODS, req);
      case "invalid_payload":
        return jsonResponse({ error: outcome.status }, 400, ALLOWED_METHODS, req);
      case "verification_unavailable":
        return jsonResponse({ error: outcome.status }, 502, ALLOWED_METHODS, req);
      case "configuration_unavailable":
        return jsonResponse({ error: outcome.status }, 503, ALLOWED_METHODS, req);
      case "database_failed":
        return jsonResponse({ error: "registration_failed" }, 500, ALLOWED_METHODS, req);
    }
  } catch (error) {
    console.error("[register-community-interest] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return jsonResponse({ error: "registration_failed" }, 500, ALLOWED_METHODS, req);
  }
});
