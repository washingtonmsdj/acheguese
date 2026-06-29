import { describe, expect, it, vi } from "vitest";
import { AIOrchestratorService } from "../orchestrator/AIOrchestratorService";
import type { AIIntent } from "../domain/types";
import type { IActionHandler } from "../actions/IActionHandler";
import { IntentParser } from "../intent/IntentParser";

const unknownIntent: AIIntent = {
  type: "unknown",
  query: "me conte uma piada",
  normalizedQuery: "me conte uma piada",
  confidence: 0.1,
  filters: { tags: [] },
  source: "fallback",
};

describe("AIOrchestratorService", () => {
  it("unknown nao executa handlers", async () => {
    const execute = vi.fn();
    const handler: IActionHandler = {
      type: "business_search",
      execute,
    };
    class MockIntentParser extends IntentParser {
      override parse = vi.fn().mockResolvedValue(unknownIntent);
    }
    const parser = new MockIntentParser();
    const orchestrator = new AIOrchestratorService(parser, [handler]);

    const result = await orchestrator.search({
      query: "me conte uma piada",
      context: {},
    });

    expect(result.intent.type).toBe("unknown");
    expect(result.items).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });
});
