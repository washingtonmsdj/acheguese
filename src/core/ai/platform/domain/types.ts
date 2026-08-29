/**
 * AI Platform — Domain Types (SSOT)
 * Tipos canônicos consumidos por todos os módulos.
 */

export type AiCapability = "text" | "structured" | "vision" | "image" | "embed" | "moderation";

export type AiErrorCode =
  | "unauthorized"
  | "payment_required"
  | "rate_limited"
  | "bad_request"
  | "server_error"
  | "network";

export interface AiError {
  code: AiErrorCode;
  message: string;
  requestId?: string | null;
}

export interface AiImageRequest {
  /** Identificador estável do consumidor (ex: "community.composer", "gastronomy.dish"). */
  feature: string;
  mode?: "generate" | "edit";
  prompt: string;
  negativePrompt?: string;
  /** URLs públicas (data URLs também aceitas). Use para edit ou inspiração. */
  referenceUrls?: string[];
  /** 1..4 variações. */
  count?: number;
  /** "fast" = Nano Banana 2; "pro" = Gemini 3 Pro Image. */
  quality?: "fast" | "pro";
  metadata?: Record<string, unknown>;
}

export interface AiImageResult {
  generationId: string;
  model: string;
  urls: string[];
}

export type AiImageStatus = "idle" | "loading" | "success" | "error";

// ---------- Text ----------
export interface AiTextMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiSchema {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface AiTextRequest {
  feature: string;
  model?: string;
  system?: string;
  messages: AiTextMessage[];
  schema?: AiSchema;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh" | "none";
}

export interface AiTextResult<T = unknown> {
  text: string;
  structured: T | null;
  model: string;
  requestId?: string | null;
}

// ---------- Vision ----------
export interface AiVisionRequest {
  feature: string;
  prompt: string;
  imageUrls: string[];
  schema?: AiSchema;
  system?: string;
  model?: string;
}

export type AiVisionResult<T = unknown> = AiTextResult<T>;
