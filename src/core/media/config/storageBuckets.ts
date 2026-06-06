export const MEDIA_STORAGE_BUCKETS = {
  AVATARS: "avatars",
  POST_IMAGES: "post-images",
  BUSINESS_LOGOS: "business-logos",
  BANNERS: "banners",
  BUSINESS_IMAGES: "business-images",
  POSTS: "posts",
  CLASSIFIED_IMAGES: "classified-images",
  SAFETY_EVIDENCE: "safety-evidence",
  TRYON: "tryon",
  COMMUNITY_POSTS: "community-posts",
  VERIFICATION_DOCUMENTS: "verification-documents",
} as const;

export const PUBLIC_IMAGE_UPLOAD_BUCKETS = [
  MEDIA_STORAGE_BUCKETS.BANNERS,
  MEDIA_STORAGE_BUCKETS.BUSINESS_IMAGES,
  MEDIA_STORAGE_BUCKETS.POSTS,
  MEDIA_STORAGE_BUCKETS.CLASSIFIED_IMAGES,
  MEDIA_STORAGE_BUCKETS.SAFETY_EVIDENCE,
  MEDIA_STORAGE_BUCKETS.TRYON,
  MEDIA_STORAGE_BUCKETS.COMMUNITY_POSTS,
] as const;

export type PublicImageUploadBucket = (typeof PUBLIC_IMAGE_UPLOAD_BUCKETS)[number];

export type PublicMediaBucket =
  | typeof MEDIA_STORAGE_BUCKETS.AVATARS
  | typeof MEDIA_STORAGE_BUCKETS.POST_IMAGES;

export function isPublicImageUploadBucket(bucket: string): bucket is PublicImageUploadBucket {
  return (PUBLIC_IMAGE_UPLOAD_BUCKETS as readonly string[]).includes(bucket);
}
