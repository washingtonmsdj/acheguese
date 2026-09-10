import { beforeEach, describe, expect, it, vi } from "vitest";

const { text } = vi.hoisted(() => ({ text: vi.fn() }));

vi.mock("../platform/client/aiClient", () => ({
  aiClient: { text },
}));

import { EdgeAIProvider } from "./EdgeAIProvider";

const provider = new EdgeAIProvider();

describe("EdgeAIProvider", () => {
  beforeEach(() => {
    text.mockReset();
  });

  it("routes intent classification through canonical ai-text structured output", async () => {
    text.mockResolvedValue({
      text: "",
      structured: {
        type: "business_search",
        normalizedQuery: "pizzaria barata",
        confidence: 0.91,
        filters: { tags: ["pizzaria"], priceHint: "cheap" },
      },
      model: "test-model",
    });

    await expect(
      provider.parseIntent({ query: "  pizzaria barata  ", locationId: "location-1" }),
    ).resolves.toEqual({
      type: "business_search",
      query: "pizzaria barata",
      normalizedQuery: "pizzaria barata",
      confidence: 0.91,
      filters: { tags: ["pizzaria"], priceHint: "cheap" },
      source: "ai",
    });

    expect(text).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: "search.intent",
        schema: expect.objectContaining({ name: "classify_search_intent" }),
        temperature: 0,
      }),
    );
  });

  it("rejects an unstructured broker response so IntentParser can use its deterministic fallback", async () => {
    text.mockResolvedValue({ text: "texto solto", structured: null, model: "test-model" });

    await expect(provider.parseIntent({ query: "encanador" })).rejects.toThrow(
      "AI intent broker returned no structured result",
    );
  });

  it("does not trust the model to choose query or source ownership fields", async () => {
    text.mockResolvedValue({
      text: "",
      structured: {
        type: "service_search",
        query: "forged-query",
        source: "fallback",
        normalizedQuery: "eletricista",
        confidence: 0.8,
        filters: { tags: [] },
      },
      model: "test-model",
    });

    const result = await provider.parseIntent({ query: " eletricista " });

    expect(result).toEqual(
      expect.objectContaining({ query: "eletricista", source: "ai" }),
    );
  });
});
