import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authFlow = read("src/core/auth/constants/authFlow.ts");
const authJourney = read("src/core/auth/utils/authJourney.ts");
const authMessages = read("src/core/auth/utils/authMessages.ts");
const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const confirmationPage = read(
  "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
);

describe("signup confirmation resend Turnstile contract", () => {
  it("forwards the optional captcha token through the canonical auth owner", () => {
    expect(authService).toContain("static async resendConfirmationEmail(");
    expect(authService).toContain("email: string,");
    expect(authService).toContain("captchaToken?: string,");
    expect(authService).toContain(
      "const normalizedCaptchaToken = captchaToken?.trim();",
    );
    expect(authService).toContain("supabase.auth.resend({");
    expect(authService).toContain("captchaToken: normalizedCaptchaToken");

    expect(authHook).toContain("resendConfirmationEmail: (");
    expect(authHook).toContain("captchaToken?: string,");
    expect(authHook).toContain(
      "AuthService.resendConfirmationEmail(email, captchaToken)",
    );
  });

  it("prefers canonical journey context over stale router state", () => {
    expect(confirmationPage).toContain(
      "const journeyContext = useMemo(() => getSignupConfirmationContext(), []);",
    );
    expect(confirmationPage).toContain("const hasCanonicalJourneyContext =");
    expect(confirmationPage).toContain(
      "journeyContext.email !== null || journeyContext.intent !== null",
    );
    expect(confirmationPage).toContain(
      "journeyContext.email ?? state?.email?.trim().toLowerCase() ?? null",
    );
    expect(confirmationPage).toContain("hasCanonicalJourneyContext");
    expect(confirmationPage).toContain("? journeyContext.returnTo");
    expect(confirmationPage).toContain(
      ": state?.redirectTo ?? journeyContext.returnTo",
    );
    expect(confirmationPage).not.toContain(
      "state?.email?.trim().toLowerCase() || journeyContext.email",
    );
    expect(confirmationPage).not.toContain(
      "state?.redirectTo ?? journeyContext.returnTo, \"/\"",
    );
  });

  it("does not claim a new email was sent when confirmation came from login", () => {
    expect(confirmationPage).toContain(
      'startedFromLogin ? "Sua conta ainda aguarda confirmação em " : "Enviamos um link para "',
    );
    expect(confirmationPage).toContain(
      "journeyContext.intent === AUTH_EMAIL_CONFIRMATION_INTENTS.login",
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
    expect(confirmationPage).toContain("<AuthTurnstileGate");
    expect(confirmationPage).toContain('action="signup"');
  });

  it("serializes resend attempts before React busy state can settle", () => {
    const resendCall = confirmationPage.indexOf(
      "await resendConfirmationEmail(email, turnstile.token ?? undefined);",
    );
    const lock = confirmationPage.indexOf("resendInFlight.current = true;");
    const release = confirmationPage.indexOf(
      "resendInFlight.current = false;",
      resendCall,
    );

    expect(confirmationPage).toContain("const resendInFlight = useRef(false);");
    expect(confirmationPage).toContain(
      "if (cooldown > 0 || resendInFlight.current) return;",
    );
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(resendCall).toBeGreaterThan(lock);
    expect(release).toBeGreaterThan(resendCall);
  });

  it("keeps resend timing in the Auth journey instead of disposable page state", () => {
    expect(authFlow).toContain("pendingSignupConfirmationCooldownUntil:");
    expect(authFlow).toContain(
      '"auth.pending-signup-confirmation-cooldown-until"',
    );
    expect(authFlow).toContain(
      "AUTH_SIGNUP_CONFIRMATION_RESEND_COOLDOWN_MS = 60 * 1000",
    );
    expect(authJourney).toContain(
      "export function getSignupConfirmationResendRemainingMs",
    );
    expect(authJourney).toContain(
      "export function startSignupConfirmationResendCooldown",
    );
    expect(confirmationPage).toContain(
      "const [cooldown, setCooldown] = useState(getResendCooldownSeconds);",
    );
    expect(confirmationPage).toContain(
      "const syncCooldown = () => setCooldown(getResendCooldownSeconds());",
    );
    expect(confirmationPage).not.toContain("RESEND_COOLDOWN_SECONDS");
  });

  it("moves the cooldown forward only after a confirmed resend", () => {
    const resendCall = confirmationPage.indexOf(
      "await resendConfirmationEmail(email, turnstile.token ?? undefined);",
    );
    const startCooldown = confirmationPage.indexOf(
      "startSignupConfirmationResendCooldown();",
      resendCall,
    );
    const catchBlock = confirmationPage.indexOf("} catch (error) {", resendCall);

    expect(resendCall).toBeGreaterThanOrEqual(0);
    expect(startCooldown).toBeGreaterThan(resendCall);
    expect(catchBlock).toBeGreaterThan(startCooldown);
  });

  it("honors a server rate limit by renewing the local blocking window", () => {
    expect(authMessages).toContain("export function isAuthRateLimitError");
    expect(authMessages).toContain("status === 429");
    expect(authMessages).toContain("over[_\\s-]*email[_\\s-]*send");
    expect(confirmationPage).toContain("if (isAuthRateLimitError(error)) {");

    const catchBlock = confirmationPage.indexOf("} catch (error) {");
    const rateLimitGuard = confirmationPage.indexOf(
      "if (isAuthRateLimitError(error)) {",
      catchBlock,
    );
    const retryCooldown = confirmationPage.indexOf(
      "startSignupConfirmationResendCooldown();",
      rateLimitGuard,
    );
    expect(rateLimitGuard).toBeGreaterThan(catchBlock);
    expect(retryCooldown).toBeGreaterThan(rateLimitGuard);
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
