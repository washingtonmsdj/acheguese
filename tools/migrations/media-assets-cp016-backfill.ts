import { chromium, type Browser, type Page } from "@playwright/test";

import { MEDIA_PRESETS } from "../../supabase/functions/_shared/mediaPresets.ts";
import {
  sha256Hex,
  validateAndStripJpegMetadata,
} from "../../supabase/functions/_shared/jpegValidation.ts";
import {
  createServiceRoleClient,
  getSupabaseConfig,
} from "../supabase/supabase-client";

const MIGRATION_KEY = "CP-016";
const MEDIA_BUCKET = "media-assets";
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;
const APPLY_CONFIRMATION = "CP016_REMOTE_BACKFILL";
const DROP_UNAVAILABLE_CONFIRMATION = "HTTP_404_ONLY";
const LEGACY_GALLERY_KEYS = [
  "fotos",
  "photos",
  "gallery",
  "gallery_images",
] as const;

type BackfillDomain = "business" | "classified" | "site_setting";
type BackfillPreset =
  | "business_logo"
  | "business_banner"
  | "business_gallery"
  | "classified_image"
  | "site_logo"
  | "site_favicon";
type SourceKind = "unsplash" | "legacy_supabase_storage";

interface Owner {
  profileId: string;
  userId: string;
}

interface MediaTask {
  aggregateId: string;
  domain: BackfillDomain;
  owner: Owner;
  preset: BackfillPreset;
  slot: string;
  sourceKind: SourceKind;
  sourceUrl: string;
}

interface PreparedAsset {
  bytes: Uint8Array;
  height: number;
  sha256: string;
  width: number;
}

interface BaseWorkItem {
  aggregateId: string;
  expectedLegacy: unknown;
  owner: Owner;
  tasks: MediaTask[];
}

interface BusinessWorkItem extends BaseWorkItem {
  domain: "business";
}

interface ClassifiedWorkItem extends BaseWorkItem {
  domain: "classified";
}

interface SiteSettingWorkItem extends BaseWorkItem {
  domain: "site_setting";
}

type WorkItem = BusinessWorkItem | ClassifiedWorkItem | SiteSettingWorkItem;

interface ProfileRow {
  id: string;
  is_active: boolean;
  is_suspended: boolean;
  suspended: boolean;
  user_id: string;
}

interface BusinessRow {
  id: string;
  metadata: Record<string, unknown> | null;
  profile_id: string;
}

interface ClassifiedRow {
  id: string;
  photos: unknown;
  seller_id: string;
}

interface SiteSettingRow {
  id: string;
  key: string;
  updated_by: string | null;
  value: unknown;
}

interface StoredAssetRow {
  id: string;
  object_path: string;
  owner_profile_id: string;
  preset: string;
  sha256: string;
  state: string;
  storage_reference: string;
}

function getArgument(name: string): string | undefined {
  const prefix = name + "=";
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

function isApplyMode(): boolean {
  return process.argv.slice(2).includes("--apply");
}

function parseProjectRef(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const match = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function requireProjectMatch(url: string): string {
  const actualProjectRef = parseProjectRef(url);
  const expectedProjectRef = getArgument("--project-ref")?.trim();

  if (!actualProjectRef || !expectedProjectRef) {
    throw new Error("A valid --project-ref confirmation is required");
  }
  if (actualProjectRef !== expectedProjectRef) {
    throw new Error("Configured Supabase project does not match --project-ref");
  }
  return actualProjectRef;
}

function requireApplyConfirmation(): void {
  if (getArgument("--confirm") !== APPLY_CONFIRMATION) {
    throw new Error("Apply mode requires --confirm=" + APPLY_CONFIRMATION);
  }
}

function canDropUnavailable404(): boolean {
  return getArgument("--drop-unavailable") === DROP_UNAVAILABLE_CONFIRMATION;
}

function isCanonicalReference(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("storage://" + MEDIA_BUCKET + "/")
  );
}

function getLegacySource(
  value: unknown,
  supabaseHostname: string,
): { kind: SourceKind; url: string } {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0
  ) {
    throw new Error(
      "Legacy media source must be a non-empty normalized string",
    );
  }
  if (isCanonicalReference(value)) {
    throw new Error("Canonical references must not enter the legacy backfill");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Legacy media source is not a valid URL");
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port
  ) {
    throw new Error("Legacy media source must use plain HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "images.unsplash.com" ||
    hostname === "source.unsplash.com"
  ) {
    return { kind: "unsplash", url: value };
  }

  if (
    hostname === supabaseHostname &&
    parsed.pathname.startsWith("/storage/v1/object/public/")
  ) {
    return { kind: "legacy_supabase_storage", url: value };
  }

  throw new Error("Legacy media source origin is not allowlisted");
}

function getStringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(field + " must be an array of strings");
  }
  return value;
}

function getProfileOwner(profile: ProfileRow | undefined): Owner {
  if (
    !profile ||
    profile.is_active !== true ||
    profile.is_suspended === true ||
    profile.suspended === true
  ) {
    throw new Error("Legacy media owner does not have an active profile");
  }
  return { profileId: profile.id, userId: profile.user_id };
}

function createTask(
  input: Omit<MediaTask, "sourceKind" | "sourceUrl"> & { source: unknown },
  supabaseHostname: string,
): MediaTask {
  const source = getLegacySource(input.source, supabaseHostname);
  return {
    aggregateId: input.aggregateId,
    domain: input.domain,
    owner: input.owner,
    preset: input.preset,
    slot: input.slot,
    sourceKind: source.kind,
    sourceUrl: source.url,
  };
}

async function loadWorkItems(
  supabase: ReturnType<typeof createServiceRoleClient>,
  supabaseUrl: string,
): Promise<WorkItem[]> {
  const [
    { data: businessData, error: businessError },
    { data: classifiedData, error: classifiedError },
    { data: siteData, error: siteError },
  ] = await Promise.all([
    supabase.from("business_data").select("id,profile_id,metadata"),
    supabase.from("classifieds").select("id,seller_id,photos"),
    supabase
      .from("site_settings")
      .select("id,key,value,updated_by")
      .in("key", ["logo_url", "logo_mobile_url", "favicon_url"]),
  ]);

  if (businessError || classifiedError || siteError) {
    throw new Error("Unable to read CP-016 legacy aggregates");
  }

  const businesses = (businessData ?? []) as BusinessRow[];
  const classifieds = (classifiedData ?? []) as ClassifiedRow[];
  const siteSettings = (siteData ?? []) as SiteSettingRow[];

  const ownerProfileIds = new Set<string>();
  for (const business of businesses) ownerProfileIds.add(business.profile_id);
  for (const classified of classifieds) {
    if (Array.isArray(classified.photos) && classified.photos.length > 0) {
      ownerProfileIds.add(classified.seller_id);
    }
  }

  const ownerUserIds = Array.from(
    new Set(
      siteSettings
        .filter((setting) => typeof setting.value === "string")
        .map((setting) => setting.updated_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const profileQuery =
    ownerProfileIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id,user_id,is_active,is_suspended,suspended")
          .in("id", Array.from(ownerProfileIds))
      : { data: [], error: null };
  if (profileQuery.error) {
    throw new Error("Unable to resolve CP-016 media owners");
  }

  const profiles = (profileQuery.data ?? []) as ProfileRow[];
  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  );
  const siteProfilesByUser = new Map<string, ProfileRow>();
  for (const userId of ownerUserIds) {
    const { data, error } = await supabase.rpc("get_active_profile", {
      p_user_id: userId,
    });
    const candidates = Array.isArray(data) ? data : data ? [data] : [];
    if (error || candidates.length !== 1) {
      throw new Error("Site media owner has no canonical active profile");
    }
    const profile = candidates[0] as ProfileRow;
    if (profile.user_id !== userId) {
      throw new Error("Canonical site media profile is not owned by its admin");
    }
    siteProfilesByUser.set(userId, profile);
  }

  const supabaseHostname = new URL(supabaseUrl).hostname.toLowerCase();
  const workItems: WorkItem[] = [];

  for (const business of businesses) {
    const metadata = business.metadata ?? {};
    const legacyLogo = metadata.logo_url;
    const legacyBanner = metadata.banner_url;
    const gallerySources = LEGACY_GALLERY_KEYS.flatMap((key) => {
      if (!(key in metadata)) return [];
      const value = metadata[key];
      return Array.isArray(value) ? value : [value];
    });
    const hasLegacyMedia =
      (typeof legacyLogo === "string" && !isCanonicalReference(legacyLogo)) ||
      (typeof legacyBanner === "string" &&
        !isCanonicalReference(legacyBanner)) ||
      gallerySources.length > 0;
    if (!hasLegacyMedia) continue;
    if (
      isCanonicalReference(legacyLogo) ||
      isCanonicalReference(legacyBanner)
    ) {
      throw new Error(
        "Mixed canonical and legacy business media is unsupported",
      );
    }
    if (gallerySources.length > 20) {
      throw new Error("Legacy business gallery exceeds the canonical limit");
    }

    const owner = getProfileOwner(profilesById.get(business.profile_id));
    const tasks: MediaTask[] = [];
    if (legacyLogo !== undefined && legacyLogo !== null) {
      tasks.push(
        createTask(
          {
            aggregateId: business.id,
            domain: "business",
            owner,
            preset: "business_logo",
            slot: "logo",
            source: legacyLogo,
          },
          supabaseHostname,
        ),
      );
    }
    if (legacyBanner !== undefined && legacyBanner !== null) {
      tasks.push(
        createTask(
          {
            aggregateId: business.id,
            domain: "business",
            owner,
            preset: "business_banner",
            slot: "banner",
            source: legacyBanner,
          },
          supabaseHostname,
        ),
      );
    }
    gallerySources.forEach((source, index) => {
      tasks.push(
        createTask(
          {
            aggregateId: business.id,
            domain: "business",
            owner,
            preset: "business_gallery",
            slot: "gallery_" + (index + 1),
            source,
          },
          supabaseHostname,
        ),
      );
    });

    workItems.push({
      aggregateId: business.id,
      domain: "business",
      expectedLegacy: metadata,
      owner,
      tasks,
    });
  }

  for (const classified of classifieds) {
    if (!Array.isArray(classified.photos) || classified.photos.length === 0) {
      continue;
    }
    const sources = getStringArray(classified.photos, "classifieds.photos");
    if (sources.every(isCanonicalReference)) continue;
    if (sources.some(isCanonicalReference)) {
      throw new Error(
        "Mixed canonical and legacy classified media is unsupported",
      );
    }
    if (sources.length > 10) {
      throw new Error("Legacy classified photos exceed the canonical limit");
    }

    const owner = getProfileOwner(profilesById.get(classified.seller_id));
    const tasks = sources.map((source, index) =>
      createTask(
        {
          aggregateId: classified.id,
          domain: "classified",
          owner,
          preset: "classified_image",
          slot: "photo_" + (index + 1),
          source,
        },
        supabaseHostname,
      ),
    );

    workItems.push({
      aggregateId: classified.id,
      domain: "classified",
      expectedLegacy: classified.photos,
      owner,
      tasks,
    });
  }

  for (const setting of siteSettings) {
    if (typeof setting.value !== "string" || setting.value.length === 0) {
      continue;
    }
    if (isCanonicalReference(setting.value)) continue;
    if (!setting.updated_by) {
      throw new Error("Legacy site media has no accountable admin user");
    }
    const siteProfile = siteProfilesByUser.get(setting.updated_by);
    if (!siteProfile) {
      throw new Error("Site media admin has no canonical active profile");
    }
    const owner = getProfileOwner(siteProfile);
    const preset: BackfillPreset =
      setting.key === "favicon_url" ? "site_favicon" : "site_logo";

    workItems.push({
      aggregateId: setting.id,
      domain: "site_setting",
      expectedLegacy: setting.value,
      owner,
      tasks: [
        createTask(
          {
            aggregateId: setting.id,
            domain: "site_setting",
            owner,
            preset,
            slot: "primary",
            source: setting.value,
          },
          supabaseHostname,
        ),
      ],
    });
  }

  return workItems;
}

function getFetchUrl(task: MediaTask): string {
  const parsed = new URL(task.sourceUrl);
  if (task.sourceKind !== "unsplash") return parsed.toString();

  const preset = MEDIA_PRESETS[task.preset];
  parsed.searchParams.delete("auto");
  parsed.searchParams.set("fm", "jpg");
  parsed.searchParams.set("fit", "max");
  parsed.searchParams.set("w", String(preset.maxWidth));
  parsed.searchParams.set("h", String(preset.maxHeight));
  parsed.searchParams.set("q", "88");
  return parsed.toString();
}

async function fetchBoundedSourceUrl(
  task: MediaTask,
  sourceUrl: string,
): Promise<{
  bytes: Uint8Array;
  mimeType: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "image/jpeg,image/png,image/webp",
        "User-Agent": "Achegue-se-CP016-Media-Migration/1.0",
      },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok || !response.body) {
      throw new Error(
        "Legacy media fetch failed with HTTP " +
          response.status +
          " for " +
          task.sourceKind,
      );
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) {
      throw new Error("Legacy media source exceeds the byte limit");
    }

    const mimeType = response.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      ?.toLowerCase();
    if (
      !mimeType ||
      !["image/jpeg", "image/png", "image/webp"].includes(mimeType)
    ) {
      throw new Error("Legacy media source has an unsupported MIME type");
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_SOURCE_BYTES) {
        await reader.cancel();
        throw new Error("Legacy media source exceeds the byte limit");
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { bytes, mimeType };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Legacy media")) {
      throw error;
    }
    throw new Error("Legacy media fetch failed safely");
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBoundedSource(task: MediaTask): Promise<{
  bytes: Uint8Array;
  mimeType: string;
}> {
  const optimizedUrl = getFetchUrl(task);
  try {
    return await fetchBoundedSourceUrl(task, optimizedUrl);
  } catch (error) {
    const isOptimizedUnsplash404 =
      task.sourceKind === "unsplash" &&
      optimizedUrl !== task.sourceUrl &&
      error instanceof Error &&
      error.message.includes("HTTP 404");
    if (!isOptimizedUnsplash404) throw error;
    return fetchBoundedSourceUrl(task, task.sourceUrl);
  }
}

async function transcodeToJpeg(
  page: Page,
  source: Uint8Array,
  sourceMimeType: string,
  preset: BackfillPreset,
): Promise<PreparedAsset> {
  const config = MEDIA_PRESETS[preset];
  let result: { base64: string; height: number; width: number };

  try {
    result = await page.evaluate(
      async ({
        base64,
        maxBytes,
        maxHeight,
        maxWidth,
        mimeType,
        minHeight,
        minWidth,
      }) => {
        const binary = atob(base64);
        const sourceBytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          sourceBytes[index] = binary.charCodeAt(index);
        }

        const bitmap = await createImageBitmap(
          new Blob([sourceBytes], { type: mimeType }),
        );
        const scale = Math.min(
          1,
          maxWidth / bitmap.width,
          maxHeight / bitmap.height,
        );
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        if (width < minWidth || height < minHeight) {
          bitmap.close();
          throw new Error("dimensions");
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          bitmap.close();
          throw new Error("canvas");
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        let output: Blob | null = null;
        for (const quality of [0.88, 0.82, 0.76, 0.7, 0.64, 0.58]) {
          output = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", quality);
          });
          if (output && output.size <= maxBytes) break;
        }
        if (!output || output.size > maxBytes) {
          throw new Error("size");
        }

        const bytes = new Uint8Array(await output.arrayBuffer());
        let encoded = "";
        const chunkSize = 32_768;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
          encoded += String.fromCharCode(
            ...bytes.subarray(offset, offset + chunkSize),
          );
        }
        return {
          base64: btoa(encoded),
          height,
          width,
        };
      },
      {
        base64: Buffer.from(source).toString("base64"),
        maxBytes: config.maxBytes,
        maxHeight: config.maxHeight,
        maxWidth: config.maxWidth,
        mimeType: sourceMimeType,
        minHeight: config.minHeight,
        minWidth: config.minWidth,
      },
    );
  } catch {
    throw new Error("Legacy media could not be decoded and normalized");
  }

  const encodedBytes = new Uint8Array(Buffer.from(result.base64, "base64"));
  const validated = validateAndStripJpegMetadata(encodedBytes);
  if (
    !validated ||
    validated.width !== result.width ||
    validated.height !== result.height ||
    validated.bytes.byteLength > config.maxBytes
  ) {
    throw new Error("Normalized media failed canonical JPEG validation");
  }

  return {
    bytes: validated.bytes,
    height: validated.height,
    sha256: await sha256Hex(validated.bytes),
    width: validated.width,
  };
}

async function prepareTask(
  page: Page,
  task: MediaTask,
  cache: Map<string, PreparedAsset>,
): Promise<PreparedAsset> {
  const cacheKey = task.preset + String.fromCharCode(0) + task.sourceUrl;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const source = await fetchBoundedSource(task);
  const prepared = await transcodeToJpeg(
    page,
    source.bytes,
    source.mimeType,
    task.preset,
  );
  cache.set(cacheKey, prepared);
  return prepared;
}

function isMissingStorageObject(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; statusCode?: number | string };
  return String(candidate.statusCode ?? candidate.status ?? "") === "404";
}

async function verifyStoredObject(
  supabase: ReturnType<typeof createServiceRoleClient>,
  objectPath: string,
  expectedSha256: string,
): Promise<"missing" | "valid"> {
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .download(objectPath);
  if (error) {
    if (isMissingStorageObject(error)) return "missing";
    throw new Error("Unable to verify reserved MediaAsset object");
  }
  if (!data) return "missing";

  const bytes = new Uint8Array(await data.arrayBuffer());
  const validated = validateAndStripJpegMetadata(bytes);
  if (!validated || (await sha256Hex(validated.bytes)) !== expectedSha256) {
    throw new Error("Reserved MediaAsset object failed integrity verification");
  }
  return "valid";
}

async function recordUnavailable404(
  supabase: ReturnType<typeof createServiceRoleClient>,
  task: MediaTask,
): Promise<void> {
  const sourceSha256 = await sha256Hex(
    new TextEncoder().encode(task.sourceUrl),
  );
  const { error } = await supabase.rpc("reject_cp016_media_asset_backfill", {
    p_aggregate_id: task.aggregateId,
    p_domain: task.domain,
    p_preset: task.preset,
    p_reason: "http_404",
    p_slot: task.slot,
    p_source_kind: task.sourceKind,
    p_source_sha256: sourceSha256,
  });
  if (error) {
    throw new Error("CP-016 unavailable media rejection was refused");
  }
}

async function reserveAndStoreAsset(
  supabase: ReturnType<typeof createServiceRoleClient>,
  task: MediaTask,
  prepared: PreparedAsset,
): Promise<string> {
  const requestedAssetId = crypto.randomUUID();
  const requestedPath =
    task.owner.profileId +
    "/" +
    task.preset +
    "/v1/" +
    requestedAssetId +
    ".jpg";
  const sourceSha256 = await sha256Hex(
    new TextEncoder().encode(task.sourceUrl),
  );

  const { data: reservedId, error: reserveError } = await supabase.rpc(
    "reserve_cp016_media_asset_backfill",
    {
      p_aggregate_id: task.aggregateId,
      p_asset_id: requestedAssetId,
      p_byte_size: prepared.bytes.byteLength,
      p_domain: task.domain,
      p_height: prepared.height,
      p_mime_type: "image/jpeg",
      p_object_path: requestedPath,
      p_owner_profile_id: task.owner.profileId,
      p_owner_user_id: task.owner.userId,
      p_preset: task.preset,
      p_preset_version: 1,
      p_sha256: prepared.sha256,
      p_slot: task.slot,
      p_source_kind: task.sourceKind,
      p_source_sha256: sourceSha256,
      p_width: prepared.width,
    },
  );
  if (reserveError || typeof reservedId !== "string") {
    throw new Error("CP-016 MediaAsset reservation was rejected");
  }

  const { data: assetData, error: assetError } = await supabase
    .from("media_assets")
    .select(
      "id,object_path,owner_profile_id,preset,sha256,state,storage_reference",
    )
    .eq("id", reservedId)
    .single();
  if (assetError || !assetData) {
    throw new Error("Reserved CP-016 MediaAsset metadata is unavailable");
  }

  const asset = assetData as StoredAssetRow;
  if (
    asset.owner_profile_id !== task.owner.profileId ||
    asset.preset !== task.preset ||
    asset.sha256 !== prepared.sha256 ||
    !["reserved", "active"].includes(asset.state)
  ) {
    throw new Error("Reserved CP-016 MediaAsset metadata does not match");
  }

  const storedState = await verifyStoredObject(
    supabase,
    asset.object_path,
    prepared.sha256,
  );
  if (asset.state === "active") {
    if (storedState !== "valid") {
      throw new Error("Active CP-016 MediaAsset object is missing");
    }
    return asset.storage_reference;
  }

  if (storedState === "missing") {
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(asset.object_path, prepared.bytes, {
        cacheControl: "31536000",
        contentType: "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      await supabase.rpc("fail_media_asset_upload", {
        p_asset_id: asset.id,
      });
      throw new Error("CP-016 MediaAsset object upload failed");
    }
  }

  const { error: activateError } = await supabase.rpc(
    "activate_media_asset_upload",
    { p_asset_id: asset.id },
  );
  if (activateError) {
    throw new Error("CP-016 MediaAsset activation failed");
  }
  return asset.storage_reference;
}

async function finalizeWorkItem(
  supabase: ReturnType<typeof createServiceRoleClient>,
  workItem: WorkItem,
  referencesBySlot: Map<string, string | null>,
): Promise<void> {
  let references: unknown;
  if (workItem.domain === "business") {
    references = {
      logo: referencesBySlot.get("logo") ?? null,
      banner: referencesBySlot.get("banner") ?? null,
      gallery: workItem.tasks
        .filter((task) => task.slot.startsWith("gallery_"))
        .map((task) => referencesBySlot.get(task.slot)),
    };
  } else if (workItem.domain === "classified") {
    references = workItem.tasks.map((task) => referencesBySlot.get(task.slot));
  } else {
    references = referencesBySlot.get("primary");
  }

  if (
    references === undefined ||
    (workItem.domain === "classified" &&
      (references as Array<unknown>).some(
        (reference) => reference === undefined,
      ))
  ) {
    throw new Error("CP-016 finalization references are incomplete");
  }

  const { data, error } = await supabase.rpc(
    "finalize_cp016_media_asset_backfill",
    {
      p_aggregate_id: workItem.aggregateId,
      p_domain: workItem.domain,
      p_expected_legacy: workItem.expectedLegacy,
      p_references: references,
    },
  );
  if (error || data !== workItem.tasks.length) {
    throw new Error("CP-016 aggregate finalization failed atomically");
  }
}

function summarize(workItems: WorkItem[]): Record<string, unknown> {
  const tasks = workItems.flatMap((item) => item.tasks);
  const countBy = (selector: (task: MediaTask) => string) =>
    Object.fromEntries(
      Array.from(
        tasks.reduce((counts, task) => {
          const key = selector(task);
          counts.set(key, (counts.get(key) ?? 0) + 1);
          return counts;
        }, new Map<string, number>()),
      ).sort(([left], [right]) => left.localeCompare(right)),
    );

  return {
    aggregates: workItems.length,
    assets: tasks.length,
    byDomain: countBy((task) => task.domain),
    byPreset: countBy((task) => task.preset),
    bySourceKind: countBy((task) => task.sourceKind),
  };
}

async function run(): Promise<void> {
  const apply = isApplyMode();
  if (apply) requireApplyConfirmation();
  const dropUnavailable404 = canDropUnavailable404();
  if (!apply && dropUnavailable404) {
    throw new Error("--drop-unavailable is valid only with --apply");
  }

  const config = getSupabaseConfig();
  if (!config.url) {
    throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required");
  }
  requireProjectMatch(config.url);

  const supabase = createServiceRoleClient();
  const workItems = await loadWorkItems(supabase, config.url);
  const summary = summarize(workItems);

  if (workItems.length === 0) {
    console.log(
      JSON.stringify(
        {
          migration: MIGRATION_KEY,
          mode: apply ? "apply" : "dry-run",
          status: "no-legacy-media",
          ...summary,
        },
        null,
        2,
      ),
    );
    return;
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const cache = new Map<string, PreparedAsset>();
    const preparationFailures = new Map<string, number>();
    let droppedUnavailableAssets = 0;
    let processedAggregates = 0;
    let processedAssets = 0;

    for (const workItem of workItems) {
      const referencesBySlot = new Map<string, string | null>();
      for (const task of workItem.tasks) {
        let prepared: PreparedAsset;
        try {
          prepared = await prepareTask(page, task, cache);
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : "Unknown media preparation failure";
          const diagnostic =
            reason +
            " [" +
            task.domain +
            "/" +
            task.preset +
            "/" +
            task.slot +
            "]";
          const mayDrop =
            dropUnavailable404 &&
            reason.includes("HTTP 404 for unsplash") &&
            (task.domain === "classified" ||
              task.preset === "business_gallery");
          if (apply && mayDrop) {
            await recordUnavailable404(supabase, task);
            referencesBySlot.set(task.slot, null);
            droppedUnavailableAssets += 1;
            processedAssets += 1;
            continue;
          }
          if (apply) throw new Error(diagnostic);
          preparationFailures.set(
            diagnostic,
            (preparationFailures.get(diagnostic) ?? 0) + 1,
          );
          processedAssets += 1;
          continue;
        }
        if (apply) {
          const reference = await reserveAndStoreAsset(
            supabase,
            task,
            prepared,
          );
          referencesBySlot.set(task.slot, reference);
        }
        processedAssets += 1;
      }

      if (apply) {
        await finalizeWorkItem(supabase, workItem, referencesBySlot);
      }
      processedAggregates += 1;
    }

    if (preparationFailures.size > 0) {
      console.log(
        JSON.stringify(
          {
            migration: MIGRATION_KEY,
            mode: "dry-run",
            status: "validation-failed-no-writes",
            failures: Object.fromEntries(
              Array.from(preparationFailures).sort(([left], [right]) =>
                left.localeCompare(right),
              ),
            ),
            processedAggregates,
            processedAssets,
            uniqueTransforms: cache.size,
            ...summary,
          },
          null,
          2,
        ),
      );
      throw new Error("Dry-run found inaccessible or invalid legacy media");
    }

    console.log(
      JSON.stringify(
        {
          migration: MIGRATION_KEY,
          mode: apply ? "apply" : "dry-run",
          status: apply ? "backfill-complete" : "validated-no-writes",
          droppedUnavailableAssets,
          processedAggregates,
          processedAssets,
          uniqueTransforms: cache.size,
          ...summary,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser?.close();
  }
}

run().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown CP-016 backfill failure";
  console.error("CP-016 backfill failed: " + message);
  process.exitCode = 1;
});
