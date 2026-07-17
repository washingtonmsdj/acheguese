import type { ImageOptimizePreset } from "@/shared/utils/imageOptimizer";

export const MEDIA_PRESET_VERSION = 1 as const;

export const MEDIA_PRESET_NAMES = [
  "user_avatar",
  "post_image",
  "business_logo",
  "business_banner",
  "business_gallery",
  "review_photo",
  "gastronomy_menu_item",
  "classified_image",
  "professional_logo",
  "professional_banner",
  "professional_portfolio",
  "site_banner",
  "site_logo",
  "site_favicon",
  "attachment_image",
] as const;

export type MediaPreset = (typeof MEDIA_PRESET_NAMES)[number];

interface MediaPresetClientConfig {
  readonly optimizerPreset: ImageOptimizePreset;
  readonly maxSourceBytes: number;
}

const FIVE_MEGABYTES = 5 * 1024 * 1024;

/** Client hints only. The Edge preset registry is the security authority. */
export const MEDIA_PRESET_CLIENT_CONFIG: Record<
  MediaPreset,
  MediaPresetClientConfig
> = {
  user_avatar: {
    optimizerPreset: "user_avatar",
    maxSourceBytes: 2 * 1024 * 1024,
  },
  post_image: { optimizerPreset: "post_image", maxSourceBytes: FIVE_MEGABYTES },
  business_logo: {
    optimizerPreset: "business_logo",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  business_banner: {
    optimizerPreset: "business_banner",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  business_gallery: {
    optimizerPreset: "business_gallery",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  review_photo: {
    optimizerPreset: "review_photo",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  gastronomy_menu_item: {
    optimizerPreset: "gastronomy_menu_item",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  classified_image: {
    optimizerPreset: "classified_image",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  professional_logo: {
    optimizerPreset: "professional_logo",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  professional_banner: {
    optimizerPreset: "business_banner",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  professional_portfolio: {
    optimizerPreset: "professional_portfolio",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  site_banner: {
    optimizerPreset: "banner_image",
    maxSourceBytes: FIVE_MEGABYTES,
  },
  site_logo: {
    optimizerPreset: "business_logo",
    maxSourceBytes: 2 * 1024 * 1024,
  },
  site_favicon: {
    optimizerPreset: "user_avatar",
    maxSourceBytes: 512 * 1024,
  },
  attachment_image: {
    optimizerPreset: "attachment_image",
    maxSourceBytes: FIVE_MEGABYTES,
  },
};

export function isMediaPreset(value: unknown): value is MediaPreset {
  return (
    typeof value === "string" &&
    (MEDIA_PRESET_NAMES as readonly string[]).includes(value)
  );
}
