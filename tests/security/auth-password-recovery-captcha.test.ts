import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const recoveryPage = read("src/app/pages/ResetPasswordPage.tsx");
const accountSecurityPage = read(
  "src/modules/profile/pages/ContaSegurancaPage.tsx",
);

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
    expect(recoveryPage.slice(finallyIndex, finallyIndex + 220)).toContain(
      "requestTurnstile.reset()",
    );
  });

  it("serializes recovery-link requests before React busy state can settle", () => {
    const sendHandler = recoveryPage.indexOf("const sendRecovery = async");
    const authRequest = recoveryPage.indexOf(
      "await resetPasswordByIdentifier(",
      sendHandler,
    );
    const release = recoveryPage.indexOf(
      "recoveryRequestInFlight.current = false;",
      authRequest,
    );

    expect(recoveryPage).toContain(
      "const recoveryRequestInFlight = useRef(false);",
    );
    expect(recoveryPage).toContain(
      "if (recoveryRequestInFlight.current) return;",
    );
    expect(recoveryPage).toContain("recoveryRequestInFlight.current = true;");
    expect(sendHandler).toBeGreaterThanOrEqual(0);
    expect(authRequest).toBeGreaterThan(sendHandler);
    expect(release).toBeGreaterThan(authRequest);
    expect(recoveryPage.slice(sendHandler, authRequest)).toContain(
      "recoveryRequestInFlight.current = true;",
    );
  });

  it("serializes recovered-password mutation before compromise/Auth checks can duplicate", () => {
    const saveHandler = recoveryPage.indexOf(
      "const saveNewPassword = form.handleSubmit(async (data) => {",
    );
    const compromiseCheck = recoveryPage.indexOf(
      "await checkPasswordCompromise(data.newPassword)",
      saveHandler,
    );
    const passwordMutation = recoveryPage.indexOf(
      "await AuthService.updateRecoveredPassword(data.newPassword);",
      compromiseCheck,
    );
    const release = recoveryPage.indexOf(
      "passwordSaveInFlight.current = false;",
      passwordMutation,
    );

    expect(recoveryPage).toContain("const passwordSaveInFlight = useRef(false);");
    expect(recoveryPage).toContain(
      'if (view !== "reset" || passwordSaveInFlight.current) return;',
    );
    expect(recoveryPage).toContain("passwordSaveInFlight.current = true;");
    expect(saveHandler).toBeGreaterThanOrEqual(0);
    expect(compromiseCheck).toBeGreaterThan(saveHandler);
    expect(passwordMutation).toBeGreaterThan(compromiseCheck);
    expect(release).toBeGreaterThan(passwordMutation);
  });

  it("routes authenticated account recovery through the canonical CAPTCHA flow", () => {
    expect(accountSecurityPage).toContain("buildPasswordResetRequestPath");
    expect(accountSecurityPage).toContain(
      "navigate(buildPasswordResetRequestPath(user.email))",
    );
    expect(accountSecurityPage).toContain(
      "Continuar para recuperação por e-mail",
    );
    expect(accountSecurityPage).not.toContain("resetPassword(user.email)");
    expect(accountSecurityPage).not.toContain("sendingReset");
    expect(accountSecurityPage).not.toContain("resetSent");

    expect(recoveryPage).toContain(
      "const initialEmail = searchParams.get(AUTH_QUERY_KEYS.email) ?? \"\";",
    );
    expect(recoveryPage).toContain("const [email, setEmail] = useState(initialEmail);");
    expect(recoveryPage).toContain("if (!requestTurnstile.isReady)");
  });
});
