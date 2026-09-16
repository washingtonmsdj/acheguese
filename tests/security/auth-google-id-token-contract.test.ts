import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Google authentication single-authority contract", () => {
  it("retires the browser GIS ID-token path instead of maintaining two auth routes", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    expect(
      existsSync(
        resolve(repoRoot, "src/core/auth/services/GoogleIdentityService.ts"),
      ),
    ).toBe(false);
    expect(authService).not.toContain("GoogleIdentityService");
    expect(authService).not.toContain("signInWithIdToken");
    expect(authService).not.toContain("VITE_GOOGLE_CLIENT_ID");
  });

  it("uses the canonical Supabase OAuth redirect and preserves the terms gate", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const googleStart = authService.indexOf("static async signInWithGoogle()");
    const googleEnd = authService.indexOf(
      "private static async clearLocalAuthStorage",
      googleStart,
    );
    const googleHandler = authService.slice(googleStart, googleEnd);

    expect(googleStart).toBeGreaterThanOrEqual(0);
    expect(googleEnd).toBeGreaterThan(googleStart);
    expect(googleHandler).toContain("supabase.auth.signInWithOAuth({");
    expect(googleHandler).toContain('provider: "google"');
    expect(googleHandler).toContain(
      "redirectTo: AuthService.getTermsAcceptanceRedirectUrl()",
    );
    expect(googleHandler).toContain("scopes: GOOGLE_IDENTITY_SCOPES");
    expect(googleHandler).not.toContain("fetch(");
  });

  it("never requires a Google client secret in browser source or example envs", () => {
    for (const path of [".env.example", ".env.local.example", ".env.remote.example", ".env.production"]) {
      const source = readProjectFile(path);
      expect(source).not.toContain("VITE_GOOGLE_CLIENT_SECRET");
      expect(source).not.toContain("GOOGLE_CLIENT_SECRET");
    }
  });
});
