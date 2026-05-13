/**
 * useAiImage — hook único para gerar/editar imagens via IA em qualquer módulo.
 *
 * @example
 * const { generate, urls, status, error } = useAiImage({ feature: "community.composer" });
 * await generate({ prompt: "Cachorro feliz na praia", count: 2 });
 */
import { useCallback, useState } from "react";
import { aiClient } from "../client/aiClient";
import type {
  AiError,
  AiImageRequest,
  AiImageResult,
  AiImageStatus,
} from "../domain/types";

export interface UseAiImageOptions {
  /** Identificador da feature consumidora (ex.: "gastronomy.dish"). */
  feature: string;
  /** Qualidade padrão das gerações (default: "fast"). */
  quality?: "fast" | "pro";
}

export interface UseAiImageReturn {
  status: AiImageStatus;
  urls: string[];
  generationId: string | null;
  error: AiError | null;
  generate: (input: Omit<AiImageRequest, "feature"> & { feature?: string }) => Promise<AiImageResult>;
  reset: () => void;
}

export function useAiImage({ feature, quality = "fast" }: UseAiImageOptions): UseAiImageReturn {
  const [status, setStatus] = useState<AiImageStatus>("idle");
  const [urls, setUrls] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<AiError | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setUrls([]);
    setGenerationId(null);
    setError(null);
  }, []);

  const generate = useCallback<UseAiImageReturn["generate"]>(
    async (input) => {
      setStatus("loading");
      setError(null);
      try {
        const result = await aiClient.image({
          feature: input.feature ?? feature,
          quality,
          ...input,
        });
        setUrls(result.urls);
        setGenerationId(result.generationId);
        setStatus("success");
        return result;
      } catch (err) {
        const aiErr = err as AiError;
        setError(aiErr);
        setStatus("error");
        throw err;
      }
    },
    [feature, quality],
  );

  return { status, urls, generationId, error, generate, reset };
}
