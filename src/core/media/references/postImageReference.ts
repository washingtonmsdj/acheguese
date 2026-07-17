import { MEDIA_STORAGE_BUCKETS } from "@/core/media/config/storageBuckets";
import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const FILE_PATTERN = "[A-Za-z0-9][A-Za-z0-9_-]{15,127}\\.(?:jpg|jpeg)";
const POST_IMAGE_PATH_PATTERN = new RegExp(
  `^(${UUID_PATTERN})/posts/(${FILE_PATTERN})$`,
  "i",
);

export const POST_IMAGE_STORAGE_REFERENCE_PREFIX =
  `storage://${MEDIA_STORAGE_BUCKETS.POST_IMAGES}/` as const;

export interface ParsedPostImageReference {
  path: string;
  profileId: string;
}

export function parsePostImageReference(
  value: string | null | undefined,
): ParsedPostImageReference | null {
  if (!value?.startsWith(POST_IMAGE_STORAGE_REFERENCE_PREFIX)) return null;

  const path = value.slice(POST_IMAGE_STORAGE_REFERENCE_PREFIX.length);
  const match = POST_IMAGE_PATH_PATTERN.exec(path);
  if (!match) return null;

  return {
    path,
    profileId: match[1].toLowerCase(),
  };
}

export function isPostImageReference(value: unknown): value is string {
  return typeof value === "string" && parsePostImageReference(value) !== null;
}

export function toPostImageReference(
  path: string,
  expectedProfileId?: string,
): string {
  const match = POST_IMAGE_PATH_PATTERN.exec(path);
  if (!match) {
    throw new Error("Invalid post image storage path");
  }
  if (
    expectedProfileId &&
    match[1].toLowerCase() !== expectedProfileId.toLowerCase()
  ) {
    throw new Error("Post image path does not belong to the active profile");
  }

  return `${POST_IMAGE_STORAGE_REFERENCE_PREFIX}${path}`;
}

export function resolvePostImageReference(
  reference: string,
  storageOrigin = PUBLIC_SUPABASE_CONFIG.url,
): string | null {
  const parsed = parsePostImageReference(reference);
  if (!parsed) return null;

  const encodedPath = parsed.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${storageOrigin.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_STORAGE_BUCKETS.POST_IMAGES}/${encodedPath}`;
}

/**
 * Database media must use storage references. Relative URLs are accepted only
 * for code-owned bundled fixtures and cannot pass the database trigger.
 */
export function resolvePostImageSource(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const resolvedReference = resolvePostImageReference(value);
  if (resolvedReference) return resolvedReference;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}

export function resolvePostImageSources(values: readonly string[]): string[] {
  return values.flatMap((value) => {
    const resolved = resolvePostImageSource(value);
    return resolved ? [resolved] : [];
  });
}
