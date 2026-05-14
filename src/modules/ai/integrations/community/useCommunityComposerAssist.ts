/**
 * useCommunityComposerAssist
 *
 * Hook usado pelo composer da Comunidade (UnifiedComposer) para enriquecer
 * um rascunho de post com IA: sugere título, categoria, tags, melhora o texto,
 * detecta o tipo de post (alerta, problema, evento, recomendação) e classifica
 * severidade quando aplicável.
 *
 * Não acessa Supabase direto: usa o `aiClient` do core.
 */
import { useCallback, useState } from "react";
import { aiClient } from "@/modules/ai/core";
import type { AiError } from "@/modules/ai/core";

export type CommunityPostKind =
  | "post"
  | "alert"
  | "issue"
  | "event"
  | "recommendation"
  | "lost_found";

export type CommunitySeverity = "info" | "low" | "medium" | "high" | "critical";

export interface CommunityComposerSuggestion {
  kind: CommunityPostKind;
  title: string;
  body: string;
  category: string;
  tags: string[];
  severity: CommunitySeverity | null;
  /** true se o conteúdo deve ser bloqueado/revisado antes de publicar. */
  shouldModerate: boolean;
  moderationReason: string | null;
}

const SCHEMA = {
  name: "classify_community_post",
  description:
    "Analisa um rascunho de post de comunidade local e devolve sugestões estruturadas.",
  parameters: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["post", "alert", "issue", "event", "recommendation", "lost_found"],
      },
      title: { type: "string", maxLength: 80 },
      body: { type: "string", maxLength: 1200 },
      category: { type: "string" },
      tags: { type: "array", items: { type: "string" }, maxItems: 6 },
      severity: {
        type: ["string", "null"],
        enum: ["info", "low", "medium", "high", "critical", null],
      },
      shouldModerate: { type: "boolean" },
      moderationReason: { type: ["string", "null"] },
    },
    required: ["kind", "title", "body", "category", "tags", "shouldModerate"],
    additionalProperties: false,
  },
} as const;

const SYSTEM_PROMPT = `Você é assistente de uma rede social de bairro brasileira.
Receba o rascunho do morador e devolva uma versão limpa, sem palavrão, sem dados
sensíveis (CPF, telefone), em português neutro e claro. Detecte se é alerta de
segurança, problema urbano, evento, recomendação, achados/perdidos ou post comum.
Severidade só se aplica a alert/issue. Marque shouldModerate=true se houver
discurso de ódio, doxxing, linchamento ou desinformação evidente.`;

export interface UseCommunityComposerAssist {
  status: "idle" | "loading" | "success" | "error";
  error: AiError | null;
  suggestion: CommunityComposerSuggestion | null;
  assist: (input: {
    draft: string;
    neighborhood?: string | null;
    city?: string | null;
  }) => Promise<CommunityComposerSuggestion>;
  reset: () => void;
}

export function useCommunityComposerAssist(): UseCommunityComposerAssist {
  const [status, setStatus] = useState<UseCommunityComposerAssist["status"]>("idle");
  const [error, setError] = useState<AiError | null>(null);
  const [suggestion, setSuggestion] = useState<CommunityComposerSuggestion | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setSuggestion(null);
  }, []);

  const assist = useCallback<UseCommunityComposerAssist["assist"]>(async (input) => {
    setStatus("loading");
    setError(null);

    const userMsg = [
      `Bairro: ${input.neighborhood ?? "—"}`,
      `Cidade: ${input.city ?? "—"}`,
      "Rascunho:",
      input.draft.trim(),
    ].join("\n");

    try {
      const res = await aiClient.text<CommunityComposerSuggestion>({
        feature: "community.composer.assist",
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
        schema: SCHEMA as unknown as {
          name: string;
          description?: string;
          parameters: Record<string, unknown>;
        },
      });

      const data: CommunityComposerSuggestion = {
        kind: (res.structured?.kind as CommunityPostKind) ?? "post",
        title: res.structured?.title ?? "",
        body: res.structured?.body ?? input.draft,
        category: res.structured?.category ?? "geral",
        tags: Array.isArray(res.structured?.tags) ? res.structured!.tags : [],
        severity: (res.structured?.severity as CommunitySeverity | null) ?? null,
        shouldModerate: !!res.structured?.shouldModerate,
        moderationReason: res.structured?.moderationReason ?? null,
      };
      setSuggestion(data);
      setStatus("success");
      return data;
    } catch (err) {
      const aiErr = err as AiError;
      setError(aiErr);
      setStatus("error");
      throw err;
    }
  }, []);

  return { status, error, suggestion, assist, reset };
}
