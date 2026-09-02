export const SAFETY_EVIDENCE_UPLOAD_POLICY = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFileSizeLabel: "10MB",
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "application/pdf",
  ] as const,
} as const;
