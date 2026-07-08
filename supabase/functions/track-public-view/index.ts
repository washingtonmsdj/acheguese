/**
 * Edge Function: track-public-view
 *
 * Public broker for non-critical public view counters. The browser cannot call
 * privileged counter RPCs directly; this function owns the tiny allowed surface.
 *
 * @security Public endpoint with rate limiting, entity whitelist, UUID
 * validation, and service_role-only RPC execution.
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
  publicViewEventSchema,
  validateBody,
  validationErrorResponse,
  type PublicViewEventBody,
} from "../_shared/validation.ts";

const ALLOWED_METHODS = "POST, OPTIONS";

const VIEW_COUNTER_RPCS = {
  business: {
    functionName: "increment_business_views",
    argName: "business_id",
  },
  professional: {
    functionName: "increment_professional_views",
    argName: "professional_id",
  },
  vaga: {
    functionName: "increment_vaga_view_count",
    argName: "vaga_id",
  },
} as const;

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auditInfo = getAuditInfo(req);

  try {
    const rawBody = await readJsonBody<PublicViewEventBody>(req, {
      maxBytes: 512,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const validation = validateBody<PublicViewEventBody>(
      rawBody.data,
      publicViewEventSchema,
    );
    if (!validation.ok) {
      return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
    }

    const { entityType, entityId } = validation.data!;
    const counterRpc = VIEW_COUNTER_RPCS[entityType];
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { error } = await supabaseAdmin.rpc(counterRpc.functionName, {
      [counterRpc.argName]: entityId,
    });

    if (error) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: "track_public_view",
        resource: "track-public-view",
        status: "failure",
        details: {
          entityType,
          reason: "counter_rpc_failed",
          code: error.code ?? null,
        },
        ...auditInfo,
      });
      return jsonResponse({ error: "Unable to track public view" }, 500, ALLOWED_METHODS, req);
    }

    return jsonResponse({ ok: true }, 202, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    console.error("[track-public-view]", error);
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
