/**
 * AI Platform — API pública (SSOT)
 *
 * Importe daqui em qualquer módulo:
 *   import { useAiImage, aiClient, AI_MODELS } from "@/modules/ai/core";
 */
export * from "./domain/types";
export * from "./domain/models";
export { aiClient, AiClient } from "./client/aiClient";
export { useAiImage } from "./hooks/useAiImage";
export type { UseAiImageOptions, UseAiImageReturn } from "./hooks/useAiImage";
