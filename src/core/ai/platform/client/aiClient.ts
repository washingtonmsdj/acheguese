/**
 * AI Platform - Cliente unico para invocar edge functions de IA.
 * Centraliza tratamento de erros e valida o contrato de sucesso antes de
 * devolver dados aos consumidores.
 */
import {
  readSupabaseFunctionHttpErrorBody,
  supabase,
} from "@/integrations/supabase";
import type {
  AiError,
  AiErrorCode,
  AiImageRequest,
  AiImageResult,
  AiTextRequest,
  AiTextResult,
  AiVisionRequest,
  AiVisionResult,
} from "../domain/types";

const AI_ERROR_CODES = new Set<AiErrorCode>([
  "unauthorized",
  "payment_required",
  "rate_limited",
  "bad_request",
  "server_error",
  "network",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toAiError(raw: unknown): AiError {
  const err = isRecord(raw) ? raw : {};
  const rawCode = typeof err.code === "string" ? err.code : "server_error";
  const code: AiErrorCode = AI_ERROR_CODES.has(rawCode as AiErrorCode)
    ? (rawCode as AiErrorCode)
    : "server_error";
  const message =
    (typeof err.error === "string" && err.error) ||
    (typeof err.message === "string" && err.message) ||
    "Falha ao chamar a IA. Tente novamente em instantes.";
  const requestId =
    typeof err.requestId === "string" || err.requestId === null
      ? err.requestId
      : null;
  return { code, message, requestId };
}

function invalidAiResponse(): AiError {
  return toAiError({
    code: "server_error",
    message: "Resposta invalida da IA.",
  });
}

async function invoke<TReq>(name: string, body: TReq): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const payload = await readSupabaseFunctionHttpErrorBody(error);
    throw toAiError(payload ?? error);
  }

  if (!isRecord(data)) throw invalidAiResponse();
  if (typeof data.error === "string") throw toAiError(data);
  return data;
}

function parseTextResult<T>(
  data: Record<string, unknown>,
  requireStructured: boolean,
): AiTextResult<T> {
  if (
    typeof data.text !== "string" ||
    typeof data.model !== "string" ||
    !data.model.trim() ||
    !("structured" in data)
  ) {
    throw invalidAiResponse();
  }

  if (
    data.requestId !== undefined &&
    data.requestId !== null &&
    typeof data.requestId !== "string"
  ) {
    throw invalidAiResponse();
  }

  if (requireStructured) {
    if (data.structured === null || data.structured === undefined) {
      throw invalidAiResponse();
    }
    if (
      isRecord(data.structured) &&
      typeof data.structured._raw === "string"
    ) {
      throw invalidAiResponse();
    }
  }

  return {
    text: data.text,
    structured: data.structured as T | null,
    model: data.model,
    requestId:
      typeof data.requestId === "string" || data.requestId === null
        ? data.requestId
        : null,
  };
}

export class AiClient {
  /** Gera (ou edita) imagens via edge function `ai-image`. */
  async image(req: AiImageRequest): Promise<AiImageResult> {
    const data = await invoke("ai-image", req);
    if (
      typeof data.generationId !== "string" ||
      !data.generationId.trim() ||
      typeof data.model !== "string" ||
      !data.model.trim() ||
      !Array.isArray(data.urls) ||
      data.urls.length === 0 ||
      !data.urls.every((url) => typeof url === "string" && url.trim())
    ) {
      throw invalidAiResponse();
    }

    return {
      generationId: data.generationId,
      model: data.model,
      urls: data.urls as string[],
    };
  }

  /** Geracao de texto / structured output via edge function `ai-text`. */
  async text<T = unknown>(req: AiTextRequest): Promise<AiTextResult<T>> {
    const data = await invoke("ai-text", req);
    return parseTextResult<T>(data, Boolean(req.schema));
  }

  /** Analise multimodal de imagens via edge function `ai-vision`. */
  async vision<T = unknown>(req: AiVisionRequest): Promise<AiVisionResult<T>> {
    const data = await invoke("ai-vision", req);
    return parseTextResult<T>(data, Boolean(req.schema));
  }
}

export const aiClient = new AiClient();
