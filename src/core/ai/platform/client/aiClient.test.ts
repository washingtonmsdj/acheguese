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
const textRequest = {
  feature: "test.text",
  messages: [{ role: "user" as const, content: "teste" }],
};
const structuredRequest = {
  ...textRequest,
  schema: {
    name: "result",
    parameters: {
      type: "object",
      properties: { ok: { type: "boolean" } },
      required: ["ok"],
    },
  },
};

describe("AiClient", () => {
  beforeEach(() => {
    invoke.mockReset();
    readHttpErrorBody.mockReset();
    readHttpErrorBody.mockResolvedValue(null);
  });

  it("returns a complete image receipt", async () => {
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

  it("rejects image success without a usable generated URL", async () => {
    invoke.mockResolvedValue({
      data: { generationId: "generation-1", model: "image-model", urls: [] },
      error: null,
    });

    await expect(
      client.image({ feature: "test.image", prompt: "uma praça" }),
    ).rejects.toEqual({
      code: "server_error",
      message: "Resposta invalida da IA.",
      requestId: null,
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

    await expect(client.text(textRequest)).rejects.toEqual({
      code: "rate_limited",
      message: "Limite temporário atingido.",
      requestId: "req-123",
    });
    expect(readHttpErrorBody).toHaveBeenCalledWith(httpError);
  });

  it("normalizes unknown provider codes to server_error", async () => {
    const httpError = { message: "Edge Function returned a non-2xx status code" };
    invoke.mockResolvedValue({ data: null, error: httpError });
    readHttpErrorBody.mockResolvedValue({
      code: "provider_specific_failure",
      error: "Falha controlada",
      requestId: "req-456",
    });

    await expect(client.text(textRequest)).rejects.toEqual({
      code: "server_error",
      message: "Falha controlada",
      requestId: "req-456",
    });
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

  it("fails closed for a null or non-object Edge response", async () => {
    invoke.mockResolvedValue({ data: null, error: null });

    await expect(client.text(textRequest)).rejects.toEqual({
      code: "server_error",
      message: "Resposta invalida da IA.",
      requestId: null,
    });
  });

  it("allows null structured output when no schema was requested", async () => {
    invoke.mockResolvedValue({
      data: {
        text: "resposta",
        structured: null,
        model: "text-model",
        requestId: null,
      },
      error: null,
    });

    await expect(client.text(textRequest)).resolves.toEqual({
      text: "resposta",
      structured: null,
      model: "text-model",
      requestId: null,
    });
  });

  it("requires structured output when a schema was requested", async () => {
    invoke.mockResolvedValue({
      data: {
        text: "",
        structured: null,
        model: "text-model",
        requestId: "req-structured",
      },
      error: null,
    });

    await expect(client.text(structuredRequest)).rejects.toMatchObject({
      code: "server_error",
      message: "Resposta invalida da IA.",
    });
  });

  it("rejects the Edge _raw fallback as malformed structured output", async () => {
    invoke.mockResolvedValue({
      data: {
        text: "",
        structured: { _raw: "not-json" },
        model: "text-model",
        requestId: "req-structured",
      },
      error: null,
    });

    await expect(client.text(structuredRequest)).rejects.toMatchObject({
      code: "server_error",
      message: "Resposta invalida da IA.",
    });
  });
});
