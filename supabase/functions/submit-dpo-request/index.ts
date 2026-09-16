// Public LGPD/data-subject request intake broker.
// Deploy contract: verify_jwt = false. Public access is protected by strict
// payload validation, origin checks, rate limiting, honeypot and Turnstile.

import { getSupabaseAdminClient } from "../_shared/adminAuth.ts";
import { executeDpoRequestIntake } from "../_shared/dpoRequestIntake.ts";
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
const MAX_BODY_BYTES = 8_192;
const MAX_REQUESTS_PER_HOUR = 5;
const TURNSTILE_ACTION = "dpo-request";

Deno.serve(async (req) => {
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
    MAX_REQUESTS_PER_HOUR,
    60 * 60 * 1000,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const admin = getSupabaseAdminClient();
  const remoteIp = getTrustedClientIp(req);
  let authenticatedUserId: string | null = null;

  const token = extractBearerToken(req);
  if (token) {
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) authenticatedUserId = data.user.id;
  }

  try {
    const outcome = await executeDpoRequestIntake(body.data, {
      authenticatedUserId,
      verifyTurnstile: async (turnstileToken) => {
        try {
          const secret = getRequiredEnv("TURNSTILE_SECRET_KEY");
          const allowedHostnames = parseAllowedTurnstileHostnames(
            getRequiredEnv("ALLOWED_ORIGINS"),
          );
          return await verifyTurnstileToken({
            token: turnstileToken,
            secret,
            expectedAction: TURNSTILE_ACTION,
            allowedHostnames,
            remoteIp,
          });
        } catch (error) {
          console.error("[submit-dpo-request] anti-abuse configuration unavailable", {
            message: error instanceof Error ? error.message : "unknown configuration error",
          });
          return { ok: false, reason: "configuration" } as const;
        }
      },
      insertRequest: async (row) => {
        const { error } = await admin
          .from("privacy_subject_requests")
          .insert(row);

        if (error) {
          console.error("[submit-dpo-request] insert failed", { code: error.code });
        }
        return { error: error ? { code: error.code } : null };
      },
    });

    switch (outcome.status) {
      case "registered":
        return jsonResponse({ status: outcome.status }, 201, ALLOWED_METHODS, req);
      case "turnstile_failed":
        return jsonResponse({ status: outcome.status }, 200, ALLOWED_METHODS, req);
      case "invalid_payload":
        return jsonResponse({ error: outcome.status }, 400, ALLOWED_METHODS, req);
      case "verification_unavailable":
        return jsonResponse({ error: outcome.status }, 502, ALLOWED_METHODS, req);
      case "configuration_unavailable":
        return jsonResponse({ error: outcome.status }, 503, ALLOWED_METHODS, req);
      case "database_failed":
        return jsonResponse({ error: "request_registration_failed" }, 500, ALLOWED_METHODS, req);
    }
  } catch (error) {
    console.error("[submit-dpo-request] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return jsonResponse({ error: "request_registration_failed" }, 500, ALLOWED_METHODS, req);
  }
});
