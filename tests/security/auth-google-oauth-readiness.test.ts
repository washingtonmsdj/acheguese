import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/publicSupabase", () => ({
  PUBLIC_SUPABASE_CONFIG: {
    url: "https://project.supabase.co",
    publishableKey: "publishable-test-key",
  },
}));

import { AuthBackendAvailability } from "@/core/auth/services/AuthBackendAvailability";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const availability = read(
  "src/core/auth/services/AuthBackendAvailability.ts",
);
const authHook = read("src/core/auth/hooks/useAuth.ts");
const messages = read("src/core/auth/utils/authMessages.ts");

const TEMPORARILY_UNAVAILABLE =
  "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.";
const GOOGLE_UNAVAILABLE =
  "Entrar com Google está temporariamente indisponível. Use e-mail ou tente novamente em instantes.";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Google OAuth backend readiness", () => {
  it("probes public Auth settings with a bounded wait before leaving the app", () => {
    expect(availability).toContain("/auth/v1/settings");
    expect(availability).not.toContain("/auth/v1/health");
    expect(availability).toContain("AUTH_READINESS_TIMEOUT_MS = 4_000");
    expect(availability).toContain("AbortController");
    expect(availability).toContain("PUBLIC_SUPABASE_CONFIG.publishableKey");
    expect(availability).toContain('cache: "no-store"');
  });

  it("requires the remote Google provider to be enabled, not merely a healthy Auth service", () => {
    expect(availability).toContain("settings.external?.google !== true");
    expect(availability).toContain(GOOGLE_UNAVAILABLE);
    expect(availability).toContain("await response.json()");
  });

  it("allows OAuth only when the remote settings explicitly expose Google", async () => {
    const json = vi.fn().mockResolvedValue({ external: { google: true } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      AuthBackendAvailability.assertReadyForExternalOAuth(),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/settings",
      expect.objectContaining({
        method: "GET",
        headers: { apikey: "publishable-test-key" },
        cache: "no-store",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("keeps a disabled Google provider inside a recoverable Achegue-se error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ external: { google: false } }),
      }),
    );

    await expect(
      AuthBackendAvailability.assertReadyForExternalOAuth(),
    ).rejects.toThrow(GOOGLE_UNAVAILABLE);
  });

  it("normalizes non-2xx and malformed settings responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn(),
      }),
    );
    await expect(
      AuthBackendAvailability.assertReadyForExternalOAuth(),
    ).rejects.toThrow(TEMPORARILY_UNAVAILABLE);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error("invalid json")),
      }),
    );
    await expect(
      AuthBackendAvailability.assertReadyForExternalOAuth(),
    ).rejects.toThrow(TEMPORARILY_UNAVAILABLE);
  });

  it("bounds a stalled settings request instead of hanging the Google button", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        }),
      ),
    );

    const pending = AuthBackendAvailability.assertReadyForExternalOAuth();
    const assertion = expect(pending).rejects.toThrow(TEMPORARILY_UNAVAILABLE);
    await vi.advanceTimersByTimeAsync(4_000);
    await assertion;
  });

  it("checks readiness before starting the external Google OAuth redirect", () => {
    const googleStart = authHook.indexOf("const signInWithGoogle");
    const googleEnd = authHook.indexOf("const resetPasswordByIdentifier");
    const googleFlow = authHook.slice(googleStart, googleEnd);

    expect(googleStart).toBeGreaterThanOrEqual(0);
    expect(googleEnd).toBeGreaterThan(googleStart);
    expect(googleFlow).toContain(
      "await AuthBackendAvailability.assertReadyForExternalOAuth();",
    );
    expect(googleFlow).toContain("await AuthService.signInWithGoogle();");
    expect(
      googleFlow.indexOf(
        "await AuthBackendAvailability.assertReadyForExternalOAuth();",
      ),
    ).toBeLessThan(googleFlow.indexOf("await AuthService.signInWithGoogle();"));
  });

  it("normalizes gateway, malformed settings and network failures without exposing raw provider text", () => {
    expect(availability).toContain(TEMPORARILY_UNAVAILABLE);
    expect(availability).toContain("if (!response.ok)");
    expect(messages).toContain("/gateway timeout/i");
    expect(messages).toContain("/connection timeout/i");
    expect(messages).toContain("/failed to fetch/i");
  });
});
