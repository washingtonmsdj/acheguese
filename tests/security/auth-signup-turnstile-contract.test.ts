import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const signupPage = read("src/app/features/onboarding/pages/CadastroPage.tsx");
const signupHook = read("src/app/features/onboarding/hooks/useCadastro.ts");
const authService = read("src/core/auth/services/AuthService.ts");
const authTypes = read("src/core/auth/services/types.ts");

describe("signup Turnstile contract", () => {
  it("carries the verified token from the signup UI into the canonical submit owner", () => {
    expect(signupPage).toContain("const turnstile = useAuthTurnstile();");
    expect(signupPage).toContain("if (!turnstile.isReady)");
    expect(signupPage).toContain(
      "await submit(turnstile.token ?? undefined, turnstile.reset);",
    );
    expect(authTypes).toContain("captchaToken?: string;");
  });

  it("serializes both the signup command and competing email/Google UI actions", () => {
    expect(signupHook).toContain("const submitInFlightRef = useRef(false);");
    expect(signupHook).toContain("if (submitInFlightRef.current) return;");
    expect(signupHook).toContain("submitInFlightRef.current = true;");
    expect(signupHook).toContain("submitInFlightRef.current = false;");

    expect(signupPage).toContain("const authActionInFlightRef = useRef(false);");
    expect(signupPage).toContain(
      "if (sessionLoading || user || authActionInFlightRef.current) return;",
    );
    expect(signupPage).toContain("googleLoading ||\n      authActionInFlightRef.current");
    expect(signupPage).toContain("authActionInFlightRef.current = true;");
    expect(signupPage).toContain("authActionInFlightRef.current = false;");
  });

  it("forwards the token through the signup hook into Supabase Auth", () => {
    expect(signupHook).toContain(
      "const submit = (captchaToken?: string, onCaptchaConsumed?: () => void) =>",
    );
    expect(signupHook).toContain("await AuthService.signUp({");
    expect(signupHook).toContain("captchaToken,");
    expect(authService).toContain("const captchaToken = data.captchaToken?.trim();");
    expect(authService).toContain("...(captchaToken ? { captchaToken } : {})");
  });

  it("resets a single-use challenge only after the Auth request consumes it", () => {
    const authRequest = signupHook.indexOf("await AuthService.signUp({");
    const authFinally = signupHook.indexOf("} finally {", authRequest);
    const reset = signupHook.indexOf("onCaptchaConsumed?.();", authFinally);
    const availabilityCheck = signupHook.indexOf(
      "await PublicIdentityService.checkAvailability({",
    );
    const compromiseCheck = signupHook.indexOf(
      "await checkPasswordCompromise(values.password);",
    );

    expect(availabilityCheck).toBeGreaterThanOrEqual(0);
    expect(compromiseCheck).toBeGreaterThan(availabilityCheck);
    expect(authRequest).toBeGreaterThan(compromiseCheck);
    expect(authFinally).toBeGreaterThan(authRequest);
    expect(reset).toBeGreaterThan(authFinally);
    expect(signupHook.slice(0, authRequest)).not.toContain("onCaptchaConsumed?.();");
  });
});
