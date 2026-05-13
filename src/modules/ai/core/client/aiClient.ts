/**
 * AI Platform — Cliente único para invocar edge functions de IA.
 * Centraliza tratamento de erros e mensagens amigáveis.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AiError, AiImageRequest, AiImageResult } from "../domain/types";

function toAiError(raw: unknown): AiError {
  const err = raw as { code?: string; error?: string; message?: string; requestId?: string };
  const code = (err?.code as AiError["code"]) || "server_error";
  const message =
    err?.error ||
    err?.message ||
    "Falha ao chamar a IA. Tente novamente em instantes.";
  return { code, message, requestId: err?.requestId ?? null };
}

export class AiClient {
  /** Gera (ou edita) imagens via edge function `ai-image`. */
  async image(req: AiImageRequest): Promise<AiImageResult> {
    const { data, error } = await supabase.functions.invoke<AiImageResult & { error?: string }>(
      "ai-image",
      { body: req },
    );

    if (error) {
      // supabase.functions.invoke retorna error.context.body com payload
      let payload: unknown = error;
      try {
        const ctx = (error as unknown as { context?: { body?: string } })?.context;
        if (ctx?.body) payload = JSON.parse(ctx.body);
      } catch {
        // ignore
      }
      throw toAiError(payload);
    }
    if (!data || !("urls" in data)) {
      throw toAiError({ message: "Resposta inválida da IA." });
    }
    return data as AiImageResult;
  }
}

export const aiClient = new AiClient();
