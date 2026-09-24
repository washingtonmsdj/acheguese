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
      allowedIntentTypes: ["business_search"],
    });

    expect(result.intent.type).toBe("unknown");
    expect(result.items).toEqual([]);
    expect(execute).not.toHaveBeenCalled();
  });

  it("nao executa intent que o caller nao autorizou", async () => {
    const execute = vi.fn();
    const handler: IActionHandler = {
      type: "service_search",
      execute,
    };
    const serviceIntent: AIIntent = {
      type: "service_search",
      query: "eletricista",
      normalizedQuery: "eletricista",
      confidence: 0.9,
      filters: { tags: [] },
      source: "fallback",
    };
    class MockIntentParser extends IntentParser {
      override parse = vi.fn().mockResolvedValue(serviceIntent);
    }

    const orchestrator = new AIOrchestratorService(
      new MockIntentParser(),
      [handler],
    );
    const result = await orchestrator.search({
      query: "eletricista",
      context: {},
      allowedIntentTypes: ["business_search"],
    });

    expect(result.items).toEqual([]);
    expect(result.message).toContain("ainda nao esta disponivel");
    expect(execute).not.toHaveBeenCalled();
  });

  it("executa handler quando a intent foi autorizada", async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const handler: IActionHandler = {
      type: "business_search",
      execute,
    };
    const businessIntent: AIIntent = {
      type: "business_search",
      query: "mercado",
      normalizedQuery: "mercado",
      confidence: 0.9,
      filters: { tags: [] },
      source: "fallback",
    };
    class MockIntentParser extends IntentParser {
      override parse = vi.fn().mockResolvedValue(businessIntent);
    }

    const orchestrator = new AIOrchestratorService(
      new MockIntentParser(),
      [handler],
    );
    await orchestrator.search({
      query: "mercado",
      context: {},
      allowedIntentTypes: ["business_search"],
    });

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
