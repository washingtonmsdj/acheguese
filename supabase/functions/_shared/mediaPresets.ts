export interface ServerMediaPreset {
  readonly dailyLimit: number;
  readonly maxBytes: number;
  readonly maxHeight: number;
  readonly maxUnattached: number;
  readonly maxWidth: number;
  readonly minHeight: number;
  readonly minWidth: number;
  readonly version: 1;
}

const MB = 1024 * 1024;

export const MEDIA_PRESETS = {
  user_avatar: preset(2 * MB, 1200, 1200, 48, 48, 10, 3),
  post_image: preset(5 * MB, 1800, 1800, 32, 32, 20, 20),
  business_logo: preset(5 * MB, 1600, 1600, 64, 64, 20, 10),
  business_banner: preset(5 * MB, 2400, 1600, 320, 120, 20, 10),
  business_gallery: preset(5 * MB, 2000, 2000, 64, 64, 40, 20),
  review_photo: preset(5 * MB, 1800, 1800, 64, 64, 30, 12),
  gastronomy_menu_item: preset(5 * MB, 1800, 1800, 128, 128, 50, 20),
  classified_image: preset(5 * MB, 2200, 2200, 64, 64, 40, 20),
  professional_logo: preset(5 * MB, 1600, 1600, 64, 64, 20, 10),
  professional_banner: preset(5 * MB, 2400, 1600, 320, 120, 20, 10),
  professional_portfolio: preset(5 * MB, 2000, 2000, 64, 64, 40, 20),
  site_banner: preset(5 * MB, 2400, 1600, 320, 120, 20, 10),
  site_logo: preset(2 * MB, 1600, 1600, 32, 32, 10, 5),
  site_favicon: preset(512 * 1024, 512, 512, 16, 16, 10, 5),
  attachment_image: preset(5 * MB, 2000, 2000, 64, 64, 20, 10),
} as const;

export type ServerMediaPresetName = keyof typeof MEDIA_PRESETS;

function preset(
  maxBytes: number,
  maxWidth: number,
  maxHeight: number,
  minWidth: number,
  minHeight: number,
  dailyLimit: number,
  maxUnattached: number,
): ServerMediaPreset {
  return {
    version: 1,
    maxBytes,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    dailyLimit,
    maxUnattached,
  };
}

export function getServerMediaPreset(
  value: FormDataEntryValue | null,
): { name: ServerMediaPresetName; config: ServerMediaPreset } | null {
  if (typeof value !== "string" || !(value in MEDIA_PRESETS)) return null;
  const name = value as ServerMediaPresetName;
  return { name, config: MEDIA_PRESETS[name] };
}
