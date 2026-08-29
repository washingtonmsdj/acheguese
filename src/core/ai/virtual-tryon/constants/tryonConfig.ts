export const TRYON_UPLOAD_LIMITS = {
  maxImageBytes: 8 * 1024 * 1024,
  acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
} as const;

export const TRYON_DEFAULTS = {
  gender: "neutral",
  style: "casual",
  variations: 4,
  provider: "replicate",
  bucket: "tryon",
} as const;

export const TRYON_GENERATION_STATUS = {
  PENDING: "pending",
} as const;
