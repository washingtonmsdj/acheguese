import { describe, expect, it } from "vitest";
import { createSupabaseApiKeySafeFetch } from "./apiKeySafeFetch";

function captureFetch() {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return { calls, fetchImpl };
}

describe("createSupabaseApiKeySafeFetch", () => {
  it("removes a new publishable API key used as the Bearer fallback", async () => {
    const apiKey = ["sb", "publishable", "fixture"].join("_");
    const { calls, fetchImpl } = captureFetch();
    const safeFetch = createSupabaseApiKeySafeFetch(apiKey, fetchImpl);

    await safeFetch("https://project.supabase.co/auth/v1/token", {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("apikey")).toBe(apiKey);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("preserves a real user JWT Authorization header", async () => {
    const apiKey = ["sb", "publishable", "fixture"].join("_");
    const { calls, fetchImpl } = captureFetch();
    const safeFetch = createSupabaseApiKeySafeFetch(apiKey, fetchImpl);

    await safeFetch("https://project.supabase.co/rest/v1/profiles", {
      headers: {
        apikey: apiKey,
        Authorization: "Bearer user.jwt.token",
      },
    });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer user.jwt.token");
  });

  it("does not rewrite legacy JWT API-key requests", async () => {
    const legacyKey = "eyJhbGciOiJIUzI1NiJ9.legacy";
    const { calls, fetchImpl } = captureFetch();
    const safeFetch = createSupabaseApiKeySafeFetch(legacyKey, fetchImpl);

    await safeFetch("https://project.supabase.co/auth/v1/token", {
      headers: {
        apikey: legacyKey,
        Authorization: `Bearer ${legacyKey}`,
      },
    });

    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${legacyKey}`);
  });
});
