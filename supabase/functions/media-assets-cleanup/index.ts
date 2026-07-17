import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  requireCronSecret,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MEDIA_ASSET_BUCKET = "media-assets";
const BATCH_SIZE = 100;
const MAX_BATCHES_PER_RUN = 5;

interface OrphanRow {
  id: string;
  object_path: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }
  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;
  const authError = requireCronSecret(req, ALLOWED_METHODS);
  if (authError) return authError;
  const limited = await rateLimitMiddleware(req, 4, 60_000);
  if (limited) return limited;

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    let batches = 0;
    let deleted = 0;
    for (; batches < MAX_BATCHES_PER_RUN; batches += 1) {
      const { data, error } = await supabaseAdmin.rpc(
        "list_media_asset_orphans",
        { p_limit: BATCH_SIZE },
      );
      if (error) throw error;
      const orphans = (data ?? []) as OrphanRow[];
      if (orphans.length === 0) break;

      const { error: removeError } = await supabaseAdmin.storage
        .from(MEDIA_ASSET_BUCKET)
        .remove(orphans.map((orphan) => orphan.object_path));
      if (removeError) throw removeError;

      const { error: markError } = await supabaseAdmin.rpc(
        "mark_media_assets_deleted",
        { p_asset_ids: orphans.map((orphan) => orphan.id) },
      );
      if (markError) throw markError;
      deleted += orphans.length;
      if (orphans.length < BATCH_SIZE) {
        batches += 1;
        break;
      }
    }

    await auditLog({
      timestamp: new Date().toISOString(),
      action: "media_asset_orphans_deleted",
      resource: "media-assets-cleanup",
      status: "success",
      details: { batches, deleted },
      ...getAuditInfo(req),
    });
    return jsonResponse(
      { batches, deleted },
      200,
      ALLOWED_METHODS,
      req,
    );
  } catch (error) {
    console.error("[media-assets-cleanup] cleanup failed", error);
    return jsonResponse({ error: "Unable to clean media" }, 500, ALLOWED_METHODS, req);
  }
});
