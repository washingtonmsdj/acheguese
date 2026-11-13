import { describe, expect, it, vi } from "vitest";
import { probeProductionTerritorialDataPlane } from "../../tools/release/preflight-production-territorial-data-plane";

const okResponse = () =>
  new Response(JSON.stringify([{ id: "redacted" }]), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("production territorial data-plane preflight", () => {
  it("requires repeated successful reads for both territorial authorities", async () => {
    const fetchImpl = vi.fn(async () => okResponse()) as typeof fetch;
    const sleep = vi.fn(async () => undefined);

    const results = await probeProductionTerritorialDataPlane({
      supabaseUrl: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
      fetchImpl,
      rounds: 3,
      delayMs: 1,
      timeoutMs: 1_000,
      sleep,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(6);

    const urls = fetchImpl.mock.calls.map(([input]) => String(input));
    expect(
      urls.filter((url) => url.includes("/rest/v1/locations?")),
    ).toHaveLength(3);
    expect(
      urls.filter((url) => url.includes("/rest/v1/territorial_groups?")),
    ).toHaveLength(3);
    expect(urls.every((url) => url.includes("select=id"))).toBe(true);
    expect(urls.every((url) => url.includes("status=eq.active"))).toBe(true);
    expect(urls.every((url) => url.includes("limit=1"))).toBe(true);
  });

  it("fails immediately on a real Data API 5xx instead of falling back", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/rest/v1/locations?")) {
        return new Response(JSON.stringify({ message: "timeout" }), {
          status: 504,
        });
      }
      return okResponse();
    }) as typeof fetch;

    await expect(
      probeProductionTerritorialDataPlane({
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
        fetchImpl,
        rounds: 3,
        delayMs: 0,
        timeoutMs: 1_000,
      }),
    ).rejects.toThrow("table=locations HTTP 504");

    expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("fails closed when an active territorial authority returns an empty set", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/rest/v1/territorial_groups?")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return okResponse();
    }) as typeof fetch;

    await expect(
      probeProductionTerritorialDataPlane({
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
        fetchImpl,
        rounds: 1,
        timeoutMs: 1_000,
      }),
    ).rejects.toThrow("table=territorial_groups returned no active row");
  });
});
