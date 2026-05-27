import { describe, expect, it } from "vitest";
import { AIOrchestratorService } from "../orchestrator/AIOrchestratorService";

const queries = [
  "pizzaria barata com delivery",
  "restaurante aberto agora",
  "eletricista perto de mim",
  "encanador urgente",
  "empresa no meu bairro",
  "me conte uma piada",
];

describe("Fluxo real do orquestrador /buscar (integration)", () => {
  it("executa consultas end-to-end com resultado ou empty state controlado", async () => {
    const orchestrator = new AIOrchestratorService();
    const outputs = [];

    for (const query of queries) {
      const out = await orchestrator.search({
        query,
        context: {
          locationId: undefined,
          coordinates: undefined,
        },
      });
      outputs.push({
        query,
        intent: out.intent.type,
        items: out.items.length,
        message: out.message,
        sampleUrl: out.items[0]?.url ?? null,
      });
    }

    console.log("[AUDIT][REAL] /buscar results:", JSON.stringify(outputs, null, 2));
    expect(outputs).toHaveLength(6);
    expect(outputs.find((item) => item.query === "me conte uma piada")?.intent).toBe("unknown");
  });
});
