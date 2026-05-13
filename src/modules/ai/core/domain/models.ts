/**
 * AI Platform — Catálogo de modelos (SSOT)
 */
export const AI_MODELS = {
  TEXT_DEFAULT: "google/gemini-3-flash-preview",
  TEXT_PRO: "google/gemini-3.1-pro-preview",
  TEXT_LITE: "google/gemini-3.1-flash-lite-preview",
  IMAGE_FAST: "google/gemini-3.1-flash-image-preview", // Nano Banana 2
  IMAGE_PRO: "google/gemini-3-pro-image-preview",
  EMBEDDING: "google/gemini-embedding-001",
} as const;

export type AiModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
