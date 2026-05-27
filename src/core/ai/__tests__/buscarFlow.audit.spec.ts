import { describe, expect, it } from "vitest";
import { IntentParser } from "../intent/IntentParser";
import { AIOrchestratorService } from "../orchestrator/AIOrchestratorService";
import type { IActionHandler } from "../actions/IActionHandler";
import type { AIActionResultItem, AIIntent } from "../domain/types";

const queries = [
  "pizzaria barata com delivery",
  "restaurante aberto agora",
  "eletricista perto de mim",
  "encanador urgente",
  "empresa no meu bairro",
  "me conte uma piada",
];

function mockResult(kind: "business" | "service", title: string): AIActionResultItem {
  return {
    id: `${kind}-1`,
    kind,
    title,
    badges: [],
  };
}

describe("Auditoria de fluxo /buscar (fase 1)", () => {
  it("gera intents esperadas para as consultas mandatórias", async () => {
    const parser = new IntentParser();
    const intents: Array<{ query: string; type: AIIntent["type"]; normalizedQuery: string }> = [];

    for (const query of queries) {
      const parsed = await parser.parse({ query, locationId: "loc-audit" });
      intents.push({ query, type: parsed.type, normalizedQuery: parsed.normalizedQuery });
    }

    console.log("[AUDIT] Intents:", JSON.stringify(intents, null, 2));

    expect(intents[0].type).toBe("business_search");
    expect(intents[1].type).toBe("business_search");
    expect(intents[2].type).toBe("service_search");
    expect(intents[3].type).toBe("service_search");
    expect(intents[4].type).toBe("business_search");
    expect(intents[5].type).toBe("unknown");
  });

  it("retorna resultado ou empty state claro no orquestrador", async () => {
    const parser = new IntentParser();
    const businessHandler: IActionHandler = {
      type: "business_search",
      async execute(intent) {
        if (intent.normalizedQuery.includes("restaurante")) return [mockResult("business", "Restaurante Exemplo")];
        return [];
      },
    };
    const serviceHandler: IActionHandler = {
      type: "service_search",
      async execute() {
        return [];
      },
    };

    const orchestrator = new AIOrchestratorService(parser, [businessHandler, serviceHandler]);

    const outputs = [];
    for (const query of queries) {
      const output = await orchestrator.search({ query, context: { locationId: "loc-audit" } });
      outputs.push({
        query,
        intent: output.intent.type,
        items: output.items.length,
        message: output.message,
      });
    }

    console.log("[AUDIT] Orchestrator outputs:", JSON.stringify(outputs, null, 2));
    expect(outputs.some((item) => item.items > 0)).toBe(true);
    expect(outputs.some((item) => item.items === 0 && item.message.includes("Nenhum resultado"))).toBe(true);
    expect(outputs.find((item) => item.query === "me conte uma piada")?.intent).toBe("unknown");
  });
});
