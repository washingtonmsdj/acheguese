import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, readHttpErrorBody } = vi.hoisted(() => ({
  invoke: vi.fn(),
  readHttpErrorBody: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    functions: { invoke },
  },
  readSupabaseFunctionHttpErrorBody: readHttpErrorBody,
}));

import { AiClient } from "./aiClient";

const client = new AiClient();

describe("AiClient", () => {
  beforeEach(() => {
    invoke.mockReset();
    readHttpErrorBody.mockReset();
    readHttpErrorBody.mockResolvedValue(null);
  });

  it("returns a valid image response", async () => {
    invoke.mockResolvedValue({
      data: {
        generationId: "generation-1",
        model: "image-model",
        urls: ["https://example.com/image.png"],
      },
      error: null,
    });

    await expect(
      client.image({ feature: "test.image", prompt: "uma praça" }),
    ).resolves.toEqual({
      generationId: "generation-1",
      model: "image-model",
      urls: ["https://example.com/image.png"],
    });
  });

  it("preserves the structured AI error returned by a non-2xx Edge response", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    readHttpErrorBody.mockResolvedValue({
      code: "rate_limited",
      error: "Limite temporário atingido.",
      requestId: "req-123",
    });

    await expect(
      client.text({
        feature: "test.text",
        messages: [{ role: "user", content: "teste" }],
      }),
    ).rejects.toEqual({
      code: "rate_limited",
      message: "Limite temporário atingido.",
      requestId: "req-123",
    });
    expect(readHttpErrorBody).toHaveBeenCalledWith(httpError);
  });

  it("falls back to the transport error without fabricating provider metadata", async () => {
    const transportError = { message: "network failed" };
    invoke.mockResolvedValue({ data: null, error: transportError });

    await expect(
      client.vision({
        feature: "test.vision",
        prompt: "analise",
        imageUrls: ["https://example.com/input.png"],
      }),
    ).rejects.toEqual({
      code: "server_error",
      message: "network failed",
      requestId: null,
    });
    expect(readHttpErrorBody).toHaveBeenCalledWith(transportError);
  });

  it("fails closed for an empty Edge response", async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(
      client.text({
        feature: "test.text",
        messages: [{ role: "user", content: "teste" }],
      }),
    ).rejects.toEqual({
      code: "server_error",
      message: "Resposta vazia da IA.",
      requestId: null,
    });
  });
});
