import { describe, expect, it, vi } from "vitest";
import {
  AuthUpstreamTimeoutError,
  CI_AUTH_UPSTREAM_TIMEOUT_MS,
  createBoundedAuthFetch,
} from "../../supabase/functions/ci-auth-fixture-session/authUpstreamFetch";

describe("CI Auth upstream bounded fetch", () => {
  it("keeps the production Auth upstream timeout below the runner request timeout", () => {
    expect(CI_AUTH_UPSTREAM_TIMEOUT_MS).toBe(10_000);
    expect(CI_AUTH_UPSTREAM_TIMEOUT_MS).toBeLessThan(15_000);
  });

  it("aborts a stalled upstream fetch and records that the timeout fired", async () => {
    const hangingFetch = vi.fn<typeof fetch>((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        );
      }),
    );
    const bounded = createBoundedAuthFetch(25, hangingFetch);

    await expect(
      bounded.fetch("https://project.supabase.co/auth/v1/token"),
    ).rejects.toBeInstanceOf(AuthUpstreamTimeoutError);
    expect(bounded.didTimeout()).toBe(true);
    expect(hangingFetch).toHaveBeenCalledTimes(1);
  });

  it("returns a timely upstream response without marking a timeout", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "fixture" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const bounded = createBoundedAuthFetch(100, fetchImpl);

    const response = await bounded.fetch(
      "https://project.supabase.co/auth/v1/token",
    );

    expect(response.status).toBe(200);
    expect(bounded.didTimeout()).toBe(false);
  });

  it("propagates an inherited caller abort without misclassifying it as an upstream timeout", async () => {
    const fetchImpl = vi.fn<typeof fetch>((_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true },
        );
      }),
    );
    const controller = new AbortController();
    const bounded = createBoundedAuthFetch(500, fetchImpl);

    const request = bounded.fetch("https://project.supabase.co/auth/v1/token", {
      signal: controller.signal,
    });
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(bounded.didTimeout()).toBe(false);
  });

  it("rejects nonsensical timeout configuration", () => {
    expect(() => createBoundedAuthFetch(0)).toThrow(
      "Auth upstream timeout must be between 1ms and 30000ms.",
    );
    expect(() => createBoundedAuthFetch(30_001)).toThrow(
      "Auth upstream timeout must be between 1ms and 30000ms.",
    );
  });
});
