export const MEDIA_STORAGE_BUCKETS = {
  AVATARS: "avatars",
  BUSINESS_IMAGES: "business_images",
  CLASSIFIED_IMAGES: "classified_images",
  SAFETY_EVIDENCE: "safety-evidence",
  TRYON: "tryon",
  VERIFICATION_DOCUMENTS: "verification-documents",
} as const;

export const PUBLIC_IMAGE_UPLOAD_BUCKETS = [
  MEDIA_STORAGE_BUCKETS.BUSINESS_IMAGES,
  MEDIA_STORAGE_BUCKETS.CLASSIFIED_IMAGES,
  MEDIA_STORAGE_BUCKETS.SAFETY_EVIDENCE,
  MEDIA_STORAGE_BUCKETS.TRYON,
] as const;

export type PublicImageUploadBucket =
  (typeof PUBLIC_IMAGE_UPLOAD_BUCKETS)[number];
