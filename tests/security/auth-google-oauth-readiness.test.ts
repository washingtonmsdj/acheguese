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
  it("probes the canonical Supabase Auth health endpoint with a bounded wait", () => {
    expect(availability).toContain("/auth/v1/health");
    expect(availability).toContain("AUTH_HEALTH_TIMEOUT_MS = 4_000");
    expect(availability).toContain("AbortController");
    expect(availability).toContain("PUBLIC_SUPABASE_CONFIG.publishableKey");
    expect(availability).toContain('cache: "no-store"');
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

  it("normalizes gateway and network failures instead of exposing raw provider text", () => {
    expect(messages).toContain("/gateway timeout/i");
    expect(messages).toContain("/connection timeout/i");
    expect(messages).toContain("/failed to fetch/i");
    expect(messages).toContain(
      "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.",
    );
  });
});
