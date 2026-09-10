/**
 * AI Platform - Cliente unico para invocar edge functions de IA.
 * Centraliza tratamento de erros e mensagens amigaveis.
 */
import {
  readSupabaseFunctionHttpErrorBody,
  supabase,
} from "@/integrations/supabase";
import type {
  AiError,
  AiImageRequest,
  AiImageResult,
  AiTextRequest,
  AiTextResult,
  AiVisionRequest,
  AiVisionResult,
} from "../domain/types";

function toAiError(raw: unknown): AiError {
  const err = raw as { code?: string; error?: string; message?: string; requestId?: string };
  const code = (err?.code as AiError["code"]) || "server_error";
  const message =
    err?.error ||
    err?.message ||
    "Falha ao chamar a IA. Tente novamente em instantes.";
  return { code, message, requestId: err?.requestId ?? null };
}

async function invoke<TReq, TRes>(name: string, body: TReq): Promise<TRes> {
  const { data, error } = await supabase.functions.invoke<TRes & { error?: string }>(name, { body });
  if (error) {
    const payload = await readSupabaseFunctionHttpErrorBody(error);
    throw toAiError(payload ?? error);
  }
  if (!data) throw toAiError({ message: "Resposta vazia da IA." });
  return data as TRes;
}

export class AiClient {
  /** Gera (ou edita) imagens via edge function `ai-image`. */
  async image(req: AiImageRequest): Promise<AiImageResult> {
    const data = await invoke<AiImageRequest, AiImageResult>("ai-image", req);
    if (!("urls" in data)) throw toAiError({ message: "Resposta invalida da IA." });
    return data;
  }

  /** Geracao de texto / structured output via edge function `ai-text`. */
  async text<T = unknown>(req: AiTextRequest): Promise<AiTextResult<T>> {
    return invoke<AiTextRequest, AiTextResult<T>>("ai-text", req);
  }

  /** Analise multimodal de imagens via edge function `ai-vision`. */
  async vision<T = unknown>(req: AiVisionRequest): Promise<AiVisionResult<T>> {
    return invoke<AiVisionRequest, AiVisionResult<T>>("ai-vision", req);
  }
}

export const aiClient = new AiClient();
