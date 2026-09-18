import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readJsonBody,
  readTextBody,
} from "../../supabase/functions/_shared/security.ts";

type StreamRequest = Pick<Request, "headers" | "body">;

function makeRequest(
  chunks: Uint8Array[],
  headers: Record<string, string> = { "content-type": "application/json" },
) {
  let nextChunk = 0;
  let pullCount = 0;
  let canceled = false;

  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pullCount += 1;
        const chunk = chunks[nextChunk++];
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
      cancel() {
        canceled = true;
      },
    },
    { highWaterMark: 0 },
  );

  const request = {
    headers: new Headers(headers),
    body,
  } as StreamRequest as Request;

  return {
    request,
    get pullCount() {
      return pullCount;
    },
    get canceled() {
      return canceled;
    },
  };
}

describe("shared Edge request body limits", () => {
  beforeEach(() => {
    vi.stubGlobal("Deno", { env: { get: () => undefined } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([undefined, "1"])(
    "rejects streamed bodies above the limit with Content-Length %s and cancels the stream",
    async (contentLength) => {
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (contentLength !== undefined) headers["content-length"] = contentLength;

      const request = makeRequest(
        [
          new TextEncoder().encode('{"message":"'),
          new TextEncoder().encode(`${"x".repeat(32)}"}`),
          new Uint8Array(256_000),
        ],
        headers,
      );

      const result = await readJsonBody(request.request, { maxBytes: 16 });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(413);
      expect(request.canceled).toBe(true);
      expect(request.pullCount).toBe(2);
    },
  );

  it("does not wait for a stalled stream cancellation after rejecting an oversized body", async () => {
    let canceled = false;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          controller.enqueue(new Uint8Array(17));
        },
        cancel() {
          canceled = true;
          return new Promise<void>(() => {});
        },
      },
      { highWaterMark: 0 },
    );
    const request = {
      headers: new Headers({ "content-type": "application/json" }),
      body,
    } as Request;

    const result = await readJsonBody(request, { maxBytes: 16 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
    expect(canceled).toBe(true);
  });

  it("accepts an exact-limit UTF-8 JSON body split across chunks", async () => {
    const payload = JSON.stringify({ city: "São Paulo" });
    const bytes = new TextEncoder().encode(payload);
    const split = bytes.findIndex((byte) => byte === 0xc3) + 1;
    const request = makeRequest([bytes.slice(0, split), bytes.slice(split)]);

    const result = await readJsonBody<{ city: string }>(request.request, {
      maxBytes: bytes.byteLength,
    });

    expect(result).toEqual({ ok: true, data: { city: "São Paulo" } });
    expect(request.canceled).toBe(false);
  });

  it("preserves decoded webhook text across UTF-8 chunk boundaries", async () => {
    const payload = "event=ação&status=ok";
    const bytes = new TextEncoder().encode(payload);
    const split = bytes.findIndex((byte) => byte === 0xc3) + 1;
    const request = makeRequest(
      [bytes.slice(0, split), bytes.slice(split)],
      { "content-type": "text/plain" },
    );

    const result = await readTextBody(request.request, {
      maxBytes: bytes.byteLength,
    });

    expect(result).toEqual({ ok: true, data: payload });
  });

  it("keeps declared-size, content-type, and malformed-JSON responses", async () => {
    const declaredTooLarge = makeRequest([new TextEncoder().encode("{}")], {
      "content-type": "application/json",
      "content-length": "17",
    });
    const contentTypeInvalid = makeRequest([new TextEncoder().encode("{}")], {
      "content-type": "text/plain",
    });
    const invalidJson = makeRequest([new TextEncoder().encode("{")]);

    const [large, wrongType, malformed] = await Promise.all([
      readJsonBody(declaredTooLarge.request, { maxBytes: 16 }),
      readJsonBody(contentTypeInvalid.request, { maxBytes: 16 }),
      readJsonBody(invalidJson.request, { maxBytes: 16 }),
    ]);

    expect(large.ok).toBe(false);
    if (!large.ok) expect(large.response.status).toBe(413);
    expect(declaredTooLarge.pullCount).toBe(0);

    expect(wrongType.ok).toBe(false);
    if (!wrongType.ok) expect(wrongType.response.status).toBe(415);

    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.response.status).toBe(400);
  });
});
