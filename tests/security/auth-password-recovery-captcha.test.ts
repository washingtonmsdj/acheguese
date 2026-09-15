import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const recoveryPage = read("src/app/pages/ResetPasswordPage.tsx");

describe("password recovery CAPTCHA propagation", () => {
  it("keeps recovery CAPTCHA support in the canonical Auth owner", () => {
    expect(authService).toContain(
      "static async resetPassword(email: string, captchaToken?: string)",
    );
    expect(authService).toContain("resetPasswordForEmail(email, {");
    expect(authService).toContain("captchaToken: normalizedCaptchaToken");
    expect(authService).toContain(
      "await AuthService.resetPassword(parsedIdentifier.value, captchaToken)",
    );
  });

  it("exposes the token through useAuth without a parallel recovery service", () => {
    expect(authHook).toContain(
      "resetPassword: (email: string, captchaToken?: string) => Promise<void>",
    );
    expect(authHook).toContain("captchaToken?: string,");
    expect(authHook).toContain(
      "await AuthService.resetPasswordByIdentifier(identifier, captchaToken)",
    );
  });

  it("sends and then invalidates the Turnstile token for every recovery request", () => {
    expect(recoveryPage).toContain('action="password_reset"');
    expect(recoveryPage).toContain("requestTurnstile.token ?? undefined");
    expect(recoveryPage).toContain(
      "await resetPasswordByIdentifier(\n        normalizedEmail,\n        requestTurnstile.token ?? undefined,\n      )",
    );

    const finallyIndex = recoveryPage.indexOf("} finally {");
    expect(finallyIndex).toBeGreaterThanOrEqual(0);
    expect(recoveryPage.slice(finallyIndex, finallyIndex + 140)).toContain(
      "requestTurnstile.reset()",
    );
  });
});
