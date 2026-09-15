import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Google Identity Services security contract", () => {
  it("keeps the browser client id public while excluding the Google client secret", () => {
    const envExample = readProjectFile(".env.example");
    const envLocalExample = readProjectFile(".env.local.example");
    const envProduction = readProjectFile(".env.production");
    const identity = readProjectFile(
      "src/core/auth/services/GoogleIdentityService.ts",
    );

    expect(envExample).toContain('VITE_GOOGLE_CLIENT_ID=""');
    expect(envLocalExample).toContain('VITE_GOOGLE_CLIENT_ID=""');
    expect(envProduction).toContain("VITE_GOOGLE_CLIENT_ID=");
    expect(identity).toContain("VITE_GOOGLE_CLIENT_ID");

    for (const source of [envExample, envLocalExample, envProduction, identity]) {
      expect(source).not.toContain("VITE_GOOGLE_CLIENT_SECRET");
      expect(source).not.toContain("GOOGLE_CLIENT_SECRET");
    }
  });

  it("uses a fresh cryptographic nonce and gives Google only its SHA-256 digest", () => {
    const identity = readProjectFile(
      "src/core/auth/services/GoogleIdentityService.ts",
    );

    expect(identity).toContain("crypto.getRandomValues(new Uint8Array(32))");
    expect(identity).toContain('crypto.subtle.digest("SHA-256", encodedNonce)');
    expect(identity).toContain("nonce: hashedNonce");
    expect(identity).toContain("settle({ token, nonce })");
    expect(identity).not.toContain("localStorage");
    expect(identity).not.toContain("sessionStorage");
  });

  it("exchanges the Google ID token only through canonical Supabase Auth", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    const googleStart = authService.indexOf("static async signInWithGoogle()");
    const googleEnd = authService.indexOf(
      "private static async clearLocalAuthStorage",
      googleStart,
    );
    const googleHandler = authService.slice(googleStart, googleEnd);

    expect(googleStart).toBeGreaterThanOrEqual(0);
    expect(googleEnd).toBeGreaterThan(googleStart);
    expect(googleHandler).toContain("GoogleIdentityService.requestCredential()");
    expect(googleHandler).toContain("supabase.auth.signInWithIdToken({");
    expect(googleHandler).toContain('provider: "google"');
    expect(googleHandler).toContain("token: identityCredential.token");
    expect(googleHandler).toContain("nonce: identityCredential.nonce");
    expect(googleHandler).not.toContain("fetch(");
  });

  it("preserves terms acceptance and the proven OAuth redirect as a browser fallback", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    const googleStart = authService.indexOf("static async signInWithGoogle()");
    const googleEnd = authService.indexOf(
      "private static async clearLocalAuthStorage",
      googleStart,
    );
    const googleHandler = authService.slice(googleStart, googleEnd);

    expect(googleHandler).toContain(
      "window.location.replace(AuthService.getTermsAcceptanceRedirectUrl())",
    );
    expect(googleHandler).toContain("supabase.auth.signInWithOAuth({");
    expect(googleHandler).toContain(
      "redirectTo: AuthService.getTermsAcceptanceRedirectUrl()",
    );
    expect(googleHandler.indexOf("signInWithIdToken")).toBeLessThan(
      googleHandler.indexOf("signInWithOAuth"),
    );
  });
});
