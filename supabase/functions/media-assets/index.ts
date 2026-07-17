import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  auditLog,
  extractBearerToken,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  requireHttpMethod,
} from "../_shared/security.ts";
import { getServerMediaPreset } from "../_shared/mediaPresets.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MEDIA_ASSET_BUCKET = "media-assets";
const MAX_MEDIA_ASSET_BYTES = 5 * 1024 * 1024;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MULTIPART_OVERHEAD_BYTES = 256 * 1024;

interface ValidatedJpeg {
  bytes: Uint8Array;
  height: number;
  width: number;
}

function validateAndStripJpegMetadata(source: Uint8Array): ValidatedJpeg | null {
  if (
    source.length < 16 ||
    source[0] !== 0xff ||
    source[1] !== 0xd8 ||
    source[source.length - 2] !== 0xff ||
    source[source.length - 1] !== 0xd9
  ) {
    return null;
  }

  const chunks: Uint8Array[] = [source.slice(0, 2)];
  let dimensions: { height: number; width: number } | null = null;
  let offset = 2;
  while (offset + 4 < source.length - 2) {
    const segmentStart = offset;
    if (source[offset] !== 0xff) return null;
    while (offset < source.length && source[offset] === 0xff) offset += 1;
    const marker = source[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xd8) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return null;
    if (offset + 2 > source.length) return null;

    const segmentLength = (source[offset] << 8) | source[offset + 1];
    const segmentEnd = offset + segmentLength;
    if (segmentLength < 2 || segmentEnd > source.length - 2) return null;

    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      if (segmentLength < 7) return null;
      const height = (source[offset + 3] << 8) | source[offset + 4];
      const width = (source[offset + 5] << 8) | source[offset + 6];
      if (width <= 0 || height <= 0 || dimensions) return null;
      dimensions = { width, height };
    }

    if (marker === 0xda) {
      if (!dimensions) return null;
      chunks.push(source.slice(segmentStart));
      const totalBytes = chunks.reduce((total, chunk) => total + chunk.length, 0);
      const sanitized = new Uint8Array(totalBytes);
      let writeOffset = 0;
      for (const chunk of chunks) {
        sanitized.set(chunk, writeOffset);
        writeOffset += chunk.length;
      }
      return { bytes: sanitized, ...dimensions };
    }

    const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) chunks.push(source.slice(segmentStart, segmentEnd));
    offset = segmentEnd;
  }

  return null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
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

  const limited = await rateLimitMiddleware(req, 20, 60_000);
  if (limited) return limited;

  const contentLength = Number(req.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return jsonResponse({ error: "Content-Length is required" }, 411, ALLOWED_METHODS, req);
  }
  if (contentLength > MAX_MEDIA_ASSET_BYTES + MAX_MULTIPART_OVERHEAD_BYTES) {
    return jsonResponse({ error: "Request body too large" }, 413, ALLOWED_METHODS, req);
  }

  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401, ALLOWED_METHODS, req);
  }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401, ALLOWED_METHODS, req);
  }

  let assetId: string | null = null;
  let objectPath: string | null = null;
  try {
    const form = await req.formData();
    const selectedPreset = getServerMediaPreset(form.get("preset"));
    const ownerProfileId = form.get("ownerProfileId");
    const file = form.get("file");
    if (
      !selectedPreset ||
      typeof ownerProfileId !== "string" ||
      !UUID_PATTERN.test(ownerProfileId) ||
      !(file instanceof File)
    ) {
      return jsonResponse({ error: "Invalid media request" }, 400, ALLOWED_METHODS, req);
    }

    if (
      contentLength >
      selectedPreset.config.maxBytes + MAX_MULTIPART_OVERHEAD_BYTES
    ) {
      return jsonResponse({ error: "File too large" }, 413, ALLOWED_METHODS, req);
    }
    if (file.type !== "image/jpeg" || file.size > selectedPreset.config.maxBytes) {
      return jsonResponse({ error: "Only bounded JPEG images are accepted" }, 415, ALLOWED_METHODS, req);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,user_id,is_active,is_suspended,suspended")
      .eq("id", ownerProfileId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (
      profileError ||
      !profile ||
      profile.is_active !== true ||
      profile.is_suspended === true ||
      profile.suspended === true
    ) {
      return jsonResponse({ error: "Active profile ownership required" }, 403, ALLOWED_METHODS, req);
    }

    const validatedJpeg = validateAndStripJpegMetadata(
      new Uint8Array(await file.arrayBuffer()),
    );
    if (!validatedJpeg) {
      return jsonResponse({ error: "Invalid JPEG data" }, 415, ALLOWED_METHODS, req);
    }
    if (
      validatedJpeg.width < selectedPreset.config.minWidth ||
      validatedJpeg.height < selectedPreset.config.minHeight ||
      validatedJpeg.width > selectedPreset.config.maxWidth ||
      validatedJpeg.height > selectedPreset.config.maxHeight
    ) {
      return jsonResponse({ error: "Image dimensions are outside preset limits" }, 422, ALLOWED_METHODS, req);
    }

    const bytes = validatedJpeg.bytes;
    assetId = crypto.randomUUID();
    objectPath = `${ownerProfileId}/${selectedPreset.name}/v${selectedPreset.config.version}/${assetId}.jpg`;
    const sha256 = await sha256Hex(bytes);
    const { error: reserveError } = await supabaseAdmin.rpc(
      "reserve_media_asset_upload",
      {
        p_asset_id: assetId,
        p_owner_user_id: authData.user.id,
        p_owner_profile_id: ownerProfileId,
        p_preset: selectedPreset.name,
        p_preset_version: selectedPreset.config.version,
        p_object_path: objectPath,
        p_mime_type: "image/jpeg",
        p_byte_size: bytes.byteLength,
        p_width: validatedJpeg.width,
        p_height: validatedJpeg.height,
        p_sha256: sha256,
      },
    );
    if (reserveError) {
      const quotaExceeded = reserveError.message?.includes("media_asset_quota_exceeded");
      return jsonResponse(
        { error: quotaExceeded ? "Media quota exceeded" : "Unable to reserve media" },
        quotaExceeded ? 429 : 409,
        ALLOWED_METHODS,
        req,
      );
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(MEDIA_ASSET_BUCKET)
      .upload(objectPath, bytes, {
        cacheControl: "31536000",
        contentType: "image/jpeg",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error: activateError } = await supabaseAdmin.rpc(
      "activate_media_asset_upload",
      { p_asset_id: assetId },
    );
    if (activateError) throw activateError;

    const reference = `storage://${MEDIA_ASSET_BUCKET}/${objectPath}`;
    await auditLog({
      timestamp: new Date().toISOString(),
      userId: authData.user.id,
      action: "media_asset_uploaded",
      resource: "media-assets",
      status: "success",
      details: {
        assetId,
        ownerProfileId,
        preset: selectedPreset.name,
        byteSize: bytes.byteLength,
        width: validatedJpeg.width,
        height: validatedJpeg.height,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      {
        asset: {
          id: assetId,
          reference,
          preset: selectedPreset.name,
          presetVersion: selectedPreset.config.version,
          mimeType: "image/jpeg",
          byteSize: bytes.byteLength,
          width: validatedJpeg.width,
          height: validatedJpeg.height,
        },
      },
      201,
      ALLOWED_METHODS,
      req,
    );
  } catch (error) {
    if (objectPath) {
      await supabaseAdmin.storage.from(MEDIA_ASSET_BUCKET).remove([objectPath]);
    }
    if (assetId) {
      await supabaseAdmin.rpc("fail_media_asset_upload", { p_asset_id: assetId });
    }
    console.error("[media-assets] upload failed", error);
    return jsonResponse({ error: "Unable to upload media" }, 500, ALLOWED_METHODS, req);
  }
});
