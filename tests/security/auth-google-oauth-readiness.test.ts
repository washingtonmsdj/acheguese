import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const availability = read(
  "src/core/auth/services/AuthBackendAvailability.ts",
);
const authHook = read("src/core/auth/hooks/useAuth.ts");
const messages = read("src/core/auth/utils/authMessages.ts");

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
    expect(availability).toContain(
      "Entrar com Google está temporariamente indisponível. Use e-mail ou tente novamente em instantes.",
    );
    expect(availability).toContain("await response.json()");
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
    expect(availability).toContain(
      "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.",
    );
    expect(availability).toContain("if (!response.ok)");
    expect(messages).toContain("/gateway timeout/i");
    expect(messages).toContain("/connection timeout/i");
    expect(messages).toContain("/failed to fetch/i");
  });
});
