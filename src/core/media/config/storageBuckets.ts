export const MEDIA_STORAGE_BUCKETS = {
  MEDIA_ASSETS: "media-assets",
  AVATARS: "avatars",
  BUSINESS_IMAGES: "business_images",
  CLASSIFIED_IMAGES: "classified_images",
  TRYON: "tryon",
  SAFETY_EVIDENCE: "safety-evidence",
  VERIFICATION_DOCUMENTS: "verification-documents",
} as const;

// Legacy public buckets remain named so old references/backfills can be
// identified, but new runtime uploads for Business/Classifieds are forbidden.
// Canonical public image uploads for those domains go through media-assets.
export const LEGACY_PUBLIC_IMAGE_BUCKETS = [
  MEDIA_STORAGE_BUCKETS.BUSINESS_IMAGES,
  MEDIA_STORAGE_BUCKETS.CLASSIFIED_IMAGES,
] as const;

// Try-On input is a specialized public staging surface. It is the only public
// bucket still writable through MediaService.uploadToBucket().
export const PUBLIC_IMAGE_UPLOAD_BUCKETS = [
  MEDIA_STORAGE_BUCKETS.TRYON,
] as const;

export const PRIVATE_STORAGE_BUCKETS = [
  MEDIA_STORAGE_BUCKETS.SAFETY_EVIDENCE,
  MEDIA_STORAGE_BUCKETS.VERIFICATION_DOCUMENTS,
] as const;

export type PublicImageUploadBucket = (typeof PUBLIC_IMAGE_UPLOAD_BUCKETS)[number];
export type PrivateStorageBucket = (typeof PRIVATE_STORAGE_BUCKETS)[number];
