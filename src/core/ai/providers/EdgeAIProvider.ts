import { aiClient } from "../platform/client/aiClient";
import type { AIProvider, IntentParserInput } from "../domain/types";

const INTENT_SCHEMA = {
  name: "classify_search_intent",
  description: "Classifica uma busca do Achegue-se sem inventar entidades ou resultados.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      type: {
        type: "string",
        enum: ["business_search", "service_search", "unknown"],
      },
      normalizedQuery: { type: "string", minLength: 1 },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string" },
          tags: { type: "array", items: { type: "string" }, maxItems: 10 },
          radiusKm: { type: "number", minimum: 0.5, maximum: 50 },
          delivery: { type: "boolean" },
          urgent: { type: "boolean" },
          priceHint: {
            type: "string",
            enum: ["cheap", "regular", "premium"],
          },
        },
        required: ["tags"],
      },
    },
    required: ["type", "normalizedQuery", "confidence", "filters"],
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Provider remoto do IntentParser sobre o broker canônico `ai-text`.
 * O browser nunca acessa credenciais do provider de IA diretamente.
 */
export class EdgeAIProvider implements AIProvider {
  async parseIntent(input: IntentParserInput): Promise<unknown> {
    const query = input.query.trim();
    const context = input.locationId
      ? `Território selecionado: ${input.locationId}.`
      : "Nenhum território explícito foi informado.";

    const result = await aiClient.text({
      feature: "search.intent",
      system:
        "Classifique exclusivamente a intenção de busca do usuário no Achegue-se. " +
        "Use business_search para estabelecimentos/empresas, service_search para profissionais/serviços e unknown para qualquer outro objetivo. " +
        "Não invente localização, categoria, urgência, preço ou entrega quando isso não estiver expresso na consulta.",
      messages: [
        {
          role: "user",
          content: `${context}\nConsulta: ${query}`,
        },
      ],
      schema: INTENT_SCHEMA,
      temperature: 0,
      maxTokens: 500,
    });

    if (!isRecord(result.structured)) {
      throw new Error("AI intent broker returned no structured result");
    }

    return {
      ...result.structured,
      query,
      source: "ai",
    };
  }
}
