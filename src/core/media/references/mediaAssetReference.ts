import {
  isMediaPreset,
  MEDIA_PRESET_VERSION,
  type MediaPreset,
} from "@/core/media/config/mediaPresets";
import {
  MEDIA_ASSET_BUCKET,
  MEDIA_ASSET_REFERENCE_PREFIX,
  parseMediaAssetReference as parseSharedMediaAssetReference,
  resolveMediaAssetReference as resolveSharedMediaAssetReference,
} from "@/shared/media/mediaAssetReference";

export { MEDIA_ASSET_BUCKET, MEDIA_ASSET_REFERENCE_PREFIX };

export interface ParsedMediaAssetReference {
  readonly assetId: string;
  readonly ownerProfileId: string;
  readonly path: string;
  readonly preset: MediaPreset;
  readonly presetVersion: number;
}

export function parseMediaAssetReference(
  value: string | null | undefined,
): ParsedMediaAssetReference | null {
  const parsed = parseSharedMediaAssetReference(value);
  if (!parsed || !isMediaPreset(parsed.preset)) return null;

  return {
    ...parsed,
    preset: parsed.preset as MediaPreset,
  };
}

export function resolveMediaAssetReference(
  reference: string | null | undefined,
  storageOrigin?: string,
): string | null {
  if (!parseMediaAssetReference(reference)) return null;
  return resolveSharedMediaAssetReference(reference, storageOrigin);
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

export function isMediaAssetReference(value: unknown): value is string {
  return typeof value === "string" && parseMediaAssetReference(value) !== null;
}

export function normalizeMediaAssetReference(
  value: string | null | undefined,
  expectedPreset?: MediaPreset | readonly MediaPreset[],
): string | undefined {
  const normalized = value?.trim();
  const parsed = parseMediaAssetReference(normalized);
  if (!parsed || parsed.presetVersion !== MEDIA_PRESET_VERSION) return undefined;

  if (expectedPreset) {
    const allowedPresets = Array.isArray(expectedPreset)
      ? expectedPreset
      : [expectedPreset];
    if (!allowedPresets.includes(parsed.preset)) return undefined;
  }

  return normalized;
}

export function toMediaAssetReference(input: {
  assetId: string;
  ownerProfileId: string;
  preset: MediaPreset;
  presetVersion?: number;
}): string {
  const version = input.presetVersion ?? MEDIA_PRESET_VERSION;
  const path = `${input.ownerProfileId}/${input.preset}/v${version}/${input.assetId}.jpg`;
  const reference = `${MEDIA_ASSET_REFERENCE_PREFIX}${path}`;
  if (!parseMediaAssetReference(reference)) {
    throw new Error("Invalid media asset identity");
  }
  return reference;
}
