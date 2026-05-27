import { describe, expect, it } from "vitest";
import { IntentParser } from "../intent/IntentParser";
import { AIIntentSchema } from "../domain/types";

describe("IntentParser", () => {
  it("retorna JSON valido", async () => {
    const parser = new IntentParser();
    const intent = await parser.parse({ query: "pizzaria barata com delivery" });
    expect(() => AIIntentSchema.parse(intent)).not.toThrow();
  });

  it("fallback local e deterministico para entrada sem provider real", async () => {
    const parser = new IntentParser();
    const first = await parser.parse({ query: "encanador urgente" });
    const second = await parser.parse({ query: "encanador urgente" });

    expect(first).toEqual(second);
    expect(first.type).toBe("service_search");
    expect(first.source).toBe("fallback");
  });

  it("classifica consulta fora de busca como unknown", async () => {
    const parser = new IntentParser();
    const intent = await parser.parse({ query: "me conte uma piada" });
    expect(intent.type).toBe("unknown");
  });
});
