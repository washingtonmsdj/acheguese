import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const messages = read("src/core/auth/utils/authMessages.ts");

describe("Google OAuth fast-start contract", () => {
  it("does not block the Google button on a preliminary Auth settings request", () => {
    expect(authHook).not.toContain("AuthBackendAvailability");
    expect(authHook).not.toContain("assertReadyForExternalOAuth");
    expect(authHook).not.toContain("/auth/v1/settings");
    expect(authHook).toContain("await AuthService.signInWithGoogle();");
  });

  it("keeps Supabase Auth as the only Google sign-in authority", () => {
    const googleStart = authService.indexOf("static async signInWithGoogle()");
    const googleEnd = authService.indexOf(
      "private static async clearLocalAuthStorage",
      googleStart,
    );
    const googleFlow = authService.slice(googleStart, googleEnd);

    expect(googleStart).toBeGreaterThanOrEqual(0);
    expect(googleEnd).toBeGreaterThan(googleStart);
    expect(googleFlow).toContain("supabase.auth.signInWithOAuth({");
    expect(googleFlow).toContain('provider: "google"');
    expect(googleFlow).toContain(
      "redirectTo: AuthService.getTermsAcceptanceRedirectUrl()",
    );
    expect(googleFlow).not.toContain("signInWithIdToken");
    expect(googleFlow).not.toContain("GoogleIdentityService");
    expect(googleFlow).not.toContain("fetch(");
  });

  it("requests only the identity scopes required for Google login", () => {
    expect(authService).toContain('"openid"');
    expect(authService).toContain(
      '"https://www.googleapis.com/auth/userinfo.email"',
    );
    expect(authService).toContain(
      '"https://www.googleapis.com/auth/userinfo.profile"',
    );
    expect(authService).toContain("scopes: GOOGLE_IDENTITY_SCOPES");
    expect(authService).not.toContain('access_type: "offline"');
    expect(authService).not.toContain('prompt: "consent"');
  });

  it("keeps network/gateway failures normalized without a duplicate readiness service", () => {
    expect(
      existsSync(resolve(root, "src/core/auth/services/AuthBackendAvailability.ts")),
    ).toBe(false);
    expect(messages).toContain("/gateway timeout/i");
    expect(messages).toContain("/connection timeout/i");
    expect(messages).toContain("/failed to fetch/i");
  });
});
