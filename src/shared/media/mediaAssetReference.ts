import { PUBLIC_SUPABASE_CONFIG } from "@/shared/config/publicSupabase";

export const MEDIA_ASSET_BUCKET = "media-assets" as const;
export const MEDIA_ASSET_REFERENCE_PREFIX =
  `storage://${MEDIA_ASSET_BUCKET}/` as const;

const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const MEDIA_ASSET_PATH_PATTERN = new RegExp(
  `^(${UUID_PATTERN})/([a-z][a-z0-9_]{2,63})/v([1-9][0-9]*)/(${UUID_PATTERN})\\.jpg$`,
  "i",
);

export interface ParsedMediaAssetReference {
  readonly assetId: string;
  readonly ownerProfileId: string;
  readonly path: string;
  readonly preset: string;
  readonly presetVersion: number;
}

/**
 * Parses the storage reference format without coupling shared consumers to a
 * domain preset registry. Domain layers must validate the allowed preset.
 */
export function parseMediaAssetReference(
  value: string | null | undefined,
): ParsedMediaAssetReference | null {
  if (!value?.startsWith(MEDIA_ASSET_REFERENCE_PREFIX)) return null;

  const path = value.slice(MEDIA_ASSET_REFERENCE_PREFIX.length);
  const match = MEDIA_ASSET_PATH_PATTERN.exec(path);
  if (!match) return null;

  const presetVersion = Number(match[3]);
  if (!Number.isSafeInteger(presetVersion) || presetVersion < 1) return null;

  return {
    ownerProfileId: match[1].toLowerCase(),
    preset: match[2],
    presetVersion,
    assetId: match[4].toLowerCase(),
    path,
  };
}

export function normalizeMediaAssetReference(
  value: string | null | undefined,
  expectedPreset?: string | readonly string[],
  expectedPresetVersion?: number,
): string | undefined {
  const normalized = value?.trim();
  const parsed = parseMediaAssetReference(normalized);
  if (!parsed) return undefined;

  if (
    expectedPresetVersion !== undefined &&
    parsed.presetVersion !== expectedPresetVersion
  ) {
    return undefined;
  }

  if (expectedPreset) {
    const allowedPresets = Array.isArray(expectedPreset)
      ? expectedPreset
      : [expectedPreset];
    if (!allowedPresets.includes(parsed.preset)) return undefined;
  }

  return normalized;
}

export function resolveMediaAssetReference(
  reference: string | null | undefined,
  storageOrigin = PUBLIC_SUPABASE_CONFIG.url,
): string | null {
  const parsed = parseMediaAssetReference(reference);
  if (!parsed) return null;

  const encodedPath = parsed.path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${storageOrigin.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_ASSET_BUCKET}/${encodedPath}`;
}

/** Database references are canonical; relative values are code-owned fixtures. */
export function resolveMediaAssetSource(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const resolved = resolveMediaAssetReference(value);
  if (resolved) return resolved;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return null;
}
