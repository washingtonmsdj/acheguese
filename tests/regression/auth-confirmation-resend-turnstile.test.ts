import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const confirmationPage = read(
  "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
);

describe("signup confirmation resend Turnstile contract", () => {
  it("forwards the optional captcha token through the canonical auth owner", () => {
    expect(authService).toContain(
      "static async resendConfirmationEmail(\n    email: string,\n    captchaToken?: string,",
    );
    expect(authService).toContain(
      "const normalizedCaptchaToken = captchaToken?.trim();",
    );
    expect(authService).toContain("supabase.auth.resend({");
    expect(authService).toContain("captchaToken: normalizedCaptchaToken");

    expect(authHook).toContain(
      "resendConfirmationEmail: (\n    email: string,\n    captchaToken?: string,",
    );
    expect(authHook).toContain(
      "AuthService.resendConfirmationEmail(email, captchaToken)",
    );
  });

  it("does not unlock resend without a solved Turnstile challenge", () => {
    expect(confirmationPage).toContain("if (!turnstile.isReady) {");
    expect(confirmationPage).toContain(
      'description: "Conclua a verificação de segurança para reenviar.",',
    );
    expect(confirmationPage).toContain(
      "const resendDisabled = isResending || cooldown > 0 || !turnstile.isReady;",
    );
    expect(confirmationPage).toContain('<AuthTurnstileGate\n                    action="signup"');
  });

  it("sends the solved token and invalidates it after every consumed resend attempt", () => {
    expect(confirmationPage).toContain(
      "await resendConfirmationEmail(email, turnstile.token ?? undefined);",
    );

    const resendCall = confirmationPage.indexOf(
      "await resendConfirmationEmail(email, turnstile.token ?? undefined);",
    );
    const finallyBlock = confirmationPage.indexOf("} finally {", resendCall);
    const reset = confirmationPage.indexOf("turnstile.reset();", finallyBlock);
    const finish = confirmationPage.indexOf("setIsResending(false);", finallyBlock);

    expect(resendCall).toBeGreaterThanOrEqual(0);
    expect(finallyBlock).toBeGreaterThan(resendCall);
    expect(reset).toBeGreaterThan(finallyBlock);
    expect(finish).toBeGreaterThan(reset);
    expect(confirmationPage.slice(resendCall, finallyBlock)).not.toContain(
      "turnstile.reset();",
    );
  });
});
