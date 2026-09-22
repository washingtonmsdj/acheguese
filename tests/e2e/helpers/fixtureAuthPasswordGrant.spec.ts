import { describe, expect, it, vi } from "vitest";
import { signInFixtureWithPasswordGrant } from "./fixtureAuthPasswordGrant";

const base = {
  supabaseUrl: "https://project.supabase.co",
  publishableKey: ["sb", "publishable", "fixture"].join("_"),
  email: "fixture@example.com",
  password: "fixture-password",
  retryDelayMs: 0,
};

describe("signInFixtureWithPasswordGrant", () => {
  it("uses apikey-only password grant and returns session tokens", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("apikey")).toBe(base.publishableKey);
      expect(headers.has("Authorization")).toBe(false);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        email: base.email,
        password: base.password,
      });
      return new Response(
        JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          user: { id: "fixture-user" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    });

    await expect(
      signInFixtureWithPasswordGrant({ ...base, fetchImpl }),
    ).resolves.toEqual({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries non-JSON gateway responses but never parses them as Auth JSON", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("<!DOCTYPE html><title>gateway</title>", {
          status: 503,
          headers: { "content-type": "text/html" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "access-token",
            refresh_token: "refresh-token",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      signInFixtureWithPasswordGrant({
        ...base,
        fetchImpl,
        maxAttempts: 2,
      }),
    ).resolves.toEqual({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed on JSON credential errors without retrying", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          code: "invalid_credentials",
          message: "Invalid login credentials",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await expect(
      signInFixtureWithPasswordGrant({ ...base, fetchImpl }),
    ).rejects.toThrow(
      "Supabase Auth password grant failed: HTTP 400; Invalid login credentials.",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
