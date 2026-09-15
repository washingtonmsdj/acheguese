import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const login = read("src/app/pages/LoginPage.tsx");
const service = read("src/core/auth/services/AuthService.ts");
const types = read("src/core/auth/services/types.ts");
const journey = read("src/core/auth/utils/authJourney.ts");
const messages = read("src/core/auth/utils/authMessages.ts");
const usernameBroker = read("supabase/functions/auth-username-login/index.ts");
const edgeValidation = read("supabase/functions/_shared/validation.ts");
const usernameRpcHardening = read(
  "supabase/migrations/20260707103853_harden_username_auth_rpc_surface.sql",
);

describe("login Turnstile contract", () => {
  it("passes the verified token from the login UI to both password-login paths", () => {
    expect(login).toContain("const captchaToken = turnstile.token ?? undefined;");
    expect(login).toContain("signInWithUsername({");
    expect(login).toContain("captchaToken,");
    expect(login).toContain("await signIn({");
    expect(login).toContain("turnstile.reset();");
  });

  it("serializes email, username, Google and recovery navigation actions", () => {
    expect(login).toContain("const authActionInFlightRef = useRef(false);");
    expect(login).toContain(
      "if (sessionLoading || user || authActionInFlightRef.current) return;",
    );
    expect(login).toContain("!googleAuthAvailable ||\n      authActionInFlightRef.current");
    expect(login).toContain("authActionInFlightRef.current = true;");
    expect(login).toContain("authActionInFlightRef.current = false;");

    const forgotPassword = login.indexOf("const handleForgotPassword");
    expect(forgotPassword).toBeGreaterThanOrEqual(0);
    expect(login.slice(forgotPassword, forgotPassword + 220)).toContain(
      "authActionInFlightRef.current",
    );
  });

  it("keeps captcha optional when the gate is disabled while forwarding it when present", () => {
    expect(types).toContain("captchaToken?: string;");
    expect(service).toContain("const captchaToken = data.captchaToken?.trim();");
    expect(service).toContain("...(captchaToken ? { options: { captchaToken } } : {})");
    expect(service).toContain("...(captchaToken ? { captchaToken } : {})");
  });

  it("lets the canonical auth-state observer own username-login hydration", () => {
    const usernameHandler = service.indexOf("static async signInWithUsername(");
    const nextHandler = service.indexOf("static async signInWithGoogle()", usernameHandler);

    expect(usernameHandler).toBeGreaterThanOrEqual(0);
    expect(nextHandler).toBeGreaterThan(usernameHandler);

    const usernameFlow = service.slice(usernameHandler, nextHandler);
    expect(usernameFlow).toContain("await supabase.auth.setSession({");
    expect(usernameFlow).toContain("if (error) throw error;");
    expect(usernameFlow).not.toContain("SessionService.refreshSession()");
  });

  it("keeps username-to-email lookup behind the service-role boundary", () => {
    expect(usernameBroker).toContain(
      'await supabaseAdmin.rpc("get_email_by_username"',
    );
    expect(usernameRpcHardening).toContain(
      "REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC",
    );
    expect(usernameRpcHardening).toContain(
      "REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon",
    );
    expect(usernameRpcHardening).toContain(
      "REVOKE ALL ON FUNCTION %I.%I(%s) FROM authenticated",
    );
    expect(usernameRpcHardening).toContain(
      "GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role",
    );
  });

  it("hands an unconfirmed email login to the confirmation journey without inventing a resend", () => {
    expect(messages).toContain("export function isEmailNotConfirmedError");
    expect(messages).toContain("email[_\\s-]*not[_\\s-]*confirmed");
    expect(journey).toContain("export function prepareUnconfirmedEmailLogin");
    expect(journey).toContain("clearPendingSignupConfirmationCooldown();");

    const catchBlock = login.indexOf("} catch (error) {");
    const unconfirmedGuard = login.indexOf(
      'parsed.kind === "email" && isEmailNotConfirmedError(error)',
      catchBlock,
    );
    const prepareJourney = login.indexOf(
      "prepareUnconfirmedEmailLogin(parsed.value, redirectTo);",
      unconfirmedGuard,
    );
    const confirmationNavigation = login.indexOf(
      "navigate(AUTH_PATHS.signupConfirmation",
      prepareJourney,
    );

    expect(unconfirmedGuard).toBeGreaterThan(catchBlock);
    expect(prepareJourney).toBeGreaterThan(unconfirmedGuard);
    expect(confirmationNavigation).toBeGreaterThan(prepareJourney);
    expect(login.slice(unconfirmedGuard, confirmationNavigation)).not.toContain(
      "prepareEmailSignupConfirmation",
    );
  });

  it("does not expose a username-derived email when confirmation is still pending", () => {
    const unconfirmedGuard = login.indexOf(
      'parsed.kind === "email" && isEmailNotConfirmedError(error)',
    );
    expect(unconfirmedGuard).toBeGreaterThanOrEqual(0);
    expect(login).not.toContain("prepareUnconfirmedEmailLogin(data.identifier");
    expect(login).not.toContain("prepareUnconfirmedEmailLogin(parsedIdentifier");
  });

  it("validates the username broker captcha in the shared Edge Function schema", () => {
    expect(edgeValidation).toContain("export interface AuthUsernameLoginBody");
    expect(edgeValidation).toContain("captchaToken?: string;");
    expect(edgeValidation).toContain(
      "captchaToken: { required: false, validator: v.string(1, 2048) }",
    );
    expect(usernameBroker).toContain("const captchaToken = readCaptchaToken(validation.data!)");
    expect(usernameBroker).toContain(
      "...(captchaToken ? { options: { captchaToken } } : {})",
    );
  });
});
