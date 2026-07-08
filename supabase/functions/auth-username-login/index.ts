/**
 * Edge Function: auth-username-login
 *
 * Public login broker for username authentication.
 * The browser never calls get_email_by_username and the resolved auth email is
 * only used server-side to perform Supabase Auth password verification.
 *
 * @security Public endpoint with strict rate limiting and generic auth errors.
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
import {
  authUsernameLoginSchema,
  validateBody,
  validationErrorResponse,
  type AuthUsernameLoginBody,
} from "../_shared/validation.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const INVALID_LOGIN_MESSAGE = "Invalid login credentials";

interface SessionPayload {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function normalizeIdentifier(username: string): string {
  return username.trim().replace(/^@/, "").toLowerCase();
}

function returnInvalidLogin(req: Request): Response {
  return jsonResponse({ error: INVALID_LOGIN_MESSAGE }, 401, ALLOWED_METHODS, req);
}

function returnSessionPayload(session: SessionPayload, req: Request): Response {
  return jsonResponse(
    {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
    },
    200,
    ALLOWED_METHODS,
    req,
  );
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 8, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auditInfo = getAuditInfo(req);

  try {
    const rawBody = await readJsonBody<AuthUsernameLoginBody>(req, {
      maxBytes: 2048,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const normalizedBody =
      typeof rawBody.data === "object" && rawBody.data !== null
        ? {
            ...rawBody.data,
            username: normalizeIdentifier(
              (rawBody.data as Partial<AuthUsernameLoginBody>).username ?? "",
            ),
          }
        : rawBody.data;

    const validation = validateBody<AuthUsernameLoginBody>(
      normalizedBody,
      authUsernameLoginSchema,
    );
    if (!validation.ok) {
      return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
    }

    const { username, password } = validation.data!;
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: email, error: emailLookupError } =
      await supabaseAdmin.rpc("get_email_by_username", { p_username: username });

    if (emailLookupError || typeof email !== "string" || !email) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: "auth_username_login",
        resource: "auth-username-login",
        status: "failure",
        details: { reason: "identifier_not_found" },
        ...auditInfo,
      });
      return returnInvalidLogin(req);
    }

    const { data: signInData, error: signInError } =
      await authClient.auth.signInWithPassword({ email, password });

    if (signInError || !signInData.session) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: "auth_username_login",
        resource: "auth-username-login",
        status: "failure",
        details: { reason: "invalid_credentials" },
        ...auditInfo,
      });
      return returnInvalidLogin(req);
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: signInData.user?.id,
      action: "auth_username_login",
      resource: "auth-username-login",
      status: "success",
      details: { method: "username" },
      ...auditInfo,
    });

    return returnSessionPayload(signInData.session, req);
  } catch (error: unknown) {
    console.error("[auth-username-login]", error);
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
