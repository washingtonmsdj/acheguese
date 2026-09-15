import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authFlow = read("src/core/auth/constants/authFlow.ts");
const authService = read("src/core/auth/services/AuthService.ts");
const supabaseConfig = read("supabase/config.toml");

const SUPPORTED_ORIGINS = [
  "https://acheguese.com.br",
  "https://acheguese.vercel.app",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
] as const;

describe("Supabase Auth redirect allowlist", () => {
  it("derives the three redirect families from the canonical auth flow", () => {
    expect(authFlow).toContain('termsAcceptance: "/aceitar-termos"');
    expect(authFlow).toContain('return `${AUTH_PATHS.login}?${query.toString()}`;');
    expect(authFlow).toContain('return `${AUTH_PATHS.passwordReset}?${query.toString()}`;');

    expect(authService).toContain(
      "buildPublicAbsoluteUrl(buildEmailConfirmationLoginPath())",
    );
    expect(authService).toContain(
      "buildPublicAbsoluteUrl(buildPasswordRecoveryPath())",
    );
    expect(authService).toContain(
      "buildPublicAbsoluteUrl(AUTH_PATHS.termsAcceptance)",
    );
  });

  it.each(SUPPORTED_ORIGINS)(
    "allows every active auth callback on %s",
    (origin) => {
      expect(supabaseConfig).toContain(`\"${origin}\"`);
      expect(supabaseConfig).toContain(`\"${origin}/aceitar-termos\"`);
      expect(supabaseConfig).toContain(`\"${origin}/login?confirmed=1\"`);
      expect(supabaseConfig).toContain(
        `\"${origin}/reset-password?mode=recovery\"`,
      );
    },
  );

  it("does not keep obsolete development ports in the auth allowlist", () => {
    expect(supabaseConfig).not.toContain("localhost:8080");
    expect(supabaseConfig).not.toContain("localhost:5173");
    expect(supabaseConfig).not.toContain("127.0.0.1:5174");
  });
});
