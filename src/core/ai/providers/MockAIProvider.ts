import type { AIIntent, AIProvider, IntentParserInput } from "../domain/types";

const businessTerms = new Map<string, string>([
  ["pizzaria", "restaurante"],
  ["pizza", "restaurante"],
  ["restaurante", "restaurante"],
  ["comida", "restaurante"],
  ["lanche", "restaurante"],
  ["sushi", "restaurante"],
  ["mercado", "mercado"],
  ["supermercado", "mercado"],
  ["farmacia", "farmacia"],
  ["remedio", "farmacia"],
  ["academia", "lazer"],
  ["pet", "servicos"],
  ["loja", "todos"],
  ["empresa", "todos"],
]);

const serviceTerms = new Set([
  "advogado",
  "arquiteto",
  "chaveiro",
  "conserto",
  "diarista",
  "eletricista",
  "encanador",
  "jardineiro",
  "marceneiro",
  "mecanico",
  "pedreiro",
  "pintor",
  "profissional",
  "reparo",
  "servico",
  "tecnico",
]);

const nonSearchIntents = [
  "piada",
  "conte uma piada",
  "me conte uma piada",
  "quem e",
  "qual a capital",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, terms: Iterable<string>): string | null {
  for (const term of terms) {
    if (text.includes(term)) return term;
  }
  return null;
}

export class MockAIProvider implements AIProvider {
  async parseIntent(input: IntentParserInput): Promise<AIIntent> {
    const normalized = normalize(input.query);
    const tags: string[] = [];

    if (nonSearchIntents.some((term) => normalized.includes(term))) {
      return {
        type: "unknown",
        query: input.query,
        normalizedQuery: normalized || "unknown",
        confidence: 0.05,
        filters: { tags },
        source: "fallback",
      };
    }

    if (normalized.includes("delivery") || normalized.includes("entrega")) tags.push("delivery");
    if (normalized.includes("barato") || normalized.includes("preco baixo")) tags.push("barato");
    if (normalized.includes("urgente") || normalized.includes("agora")) tags.push("urgente");
    if (/\babert[oa]s?\b/.test(normalized)) tags.push("aberto_agora");

    const businessTerm = hasAny(normalized, businessTerms.keys());
    if (businessTerm) {
      const category = businessTerms.get(businessTerm);
      return {
        type: "business_search",
        query: input.query,
        normalizedQuery: businessTerm,
        confidence: 0.82,
        filters: {
          category: category === "todos" ? undefined : category,
          tags,
          delivery: tags.includes("delivery"),
          urgent: tags.includes("urgente"),
          priceHint: tags.includes("barato") ? "cheap" : undefined,
        },
        source: "fallback",
      };
    }

    const serviceTerm = hasAny(normalized, serviceTerms);
    if (serviceTerm) {
      return {
        type: "service_search",
        query: input.query,
        normalizedQuery: serviceTerm,
        confidence: 0.78,
        filters: {
          category: serviceTerm === "servico" || serviceTerm === "profissional" ? undefined : serviceTerm,
          tags,
          urgent: tags.includes("urgente"),
          priceHint: tags.includes("barato") ? "cheap" : undefined,
        },
        source: "fallback",
      };
    }

    return {
      type: "unknown",
      query: input.query,
      normalizedQuery: normalized || input.query,
      confidence: normalized.length >= 2 ? 0.2 : 0.1,
      filters: { tags },
      source: "fallback",
    };
  }
}
