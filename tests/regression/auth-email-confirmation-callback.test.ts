import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("email confirmation callback contract", () => {
  it("keeps pending auth exchange detection in the auth callback SSOT", () => {
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");

    expect(callback).toContain("export function hasPendingPkceCode");
    expect(callback).toContain("export function hasPendingAuthCallbackExchange");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.accessToken)");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.refreshToken)");
    expect(login).toContain("hasPendingAuthCallbackExchange");
    expect(login).not.toContain("hasPendingPkceCode");
    expect(login).not.toContain(
      "new URLSearchParams(window.location.search).has(AUTH_QUERY_KEYS.code)",
    );
  });

  it("uses hydrated session state as confirmation proof without racing the consumed callback URL", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");

    expect(login).toContain(
      'import { useSessionContext } from "@/core/session/hooks/useSessionContext";',
    );
    expect(login).toContain(
      "const { user, isLoading: sessionLoading } = useSessionContext();",
    );
    expect(login).toContain("const showEmailConfirmed =");
    expect(login).toContain("!sessionLoading &&");
    expect(login).toContain("user !== null &&");
    expect(login).toContain("!emailConfirmationExchangePending;");
    expect(login).toContain("const emailConfirmationSettling =");
    expect(login).toContain("user === null &&");
    expect(login).toContain("const showEmailConfirmationProgress =");
    expect(login).toContain("if (!isEmailConfirmed || sessionLoading) return;");
    expect(login).toContain("if (user && !emailConfirmationExchangePending) return;");
    expect(login).toContain("AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs");
    expect(login).toContain(
      "navigate(AUTH_PATHS.signupConfirmation, { replace: true });",
    );
  });

  it("keeps login actions inert while session ownership or confirmation settlement is unresolved", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");

    expect(login).toContain("const isBusy =");
    expect(login).toContain("const isBusy =");
    expect(login).toContain("pendingAction !== null ||");
    expect(login).toContain("emailConfirmationSettling;");
    expect(login).toContain("sessionLoading || user || authActionInFlightRef.current");
    expect(login).toContain("disabled={isBusy}");
    expect(login).toContain("disabled={isBusy || !turnstile.isReady}");
  });

  it("never treats an existing session as proof while any email confirmation exchange is pending", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");

    expect(login).toContain("const emailConfirmationExchangePending =");
    expect(login).toContain("hasPendingAuthCallbackExchange(");
    expect(login).toContain("const showEmailConfirmed =");
    expect(login).toContain("!emailConfirmationExchangePending;");
    expect(login).toContain(
      "if (user && !emailConfirmationExchangePending) return;",
    );
    expect(login).toContain("if (stillPending || !user) {");
    expect(login).toContain(
      "navigate(AUTH_PATHS.signupConfirmation, { replace: true });",
    );
  });

  it("keeps both PKCE and legacy implicit resend callbacks behind the pending barrier", () => {
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");

    expect(callback).toContain("searchParams.has(AUTH_QUERY_KEYS.code)");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.accessToken)");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.refreshToken)");
    expect(login).toContain("emailConfirmationExchangePending");
    expect(login).toContain("showEmailConfirmationProgress");
    expect(login).toContain("Confirmando seu e-mail…");
    expect(login).toContain("const stillPending = hasPendingAuthCallbackExchange(");
    expect(login).toContain("if (stillPending || !user) {");
  });

  it("returns failed, orphaned or forged confirmation callbacks to the recoverable confirmation surface", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const confirmation = readProjectFile(
      "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
    );

    expect(login).toContain("getAuthCallbackError(location.search, location.hash)");
    expect(login).toContain(
      "navigate(AUTH_PATHS.signupConfirmation, { replace: true })",
    );
    expect(login).toContain("AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs");
    expect(login).toContain("Confirmando seu e-mail…");
    expect(login).toContain("showEmailConfirmed");
    expect(login).toContain('"Continuando para seu primeiro acesso."');
    expect(confirmation).toContain("getSignupConfirmationContext");
    expect(confirmation).toContain("AUTH_EMAIL_CONFIRMATION_INTENTS.login");
    expect(confirmation).toContain("cancelUnconfirmedEmailLoginJourney");
    expect(confirmation).toContain("Reenviar e-mail");
    expect(confirmation).toContain("Voltar para criar conta");
  });

  it("keeps the canonical confirmation redirect allowlisted on production and localhost 5175", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const flow = readProjectFile("src/core/auth/constants/authFlow.ts");
    const supabaseConfig = readProjectFile("supabase/config.toml");
    const client = readProjectFile("src/integrations/supabase/supabase.ts");

    expect(flow).toContain("buildEmailConfirmationLoginPath");
    expect(authService).toContain(
      "buildPublicAbsoluteUrl(buildEmailConfirmationLoginPath())",
    );
    expect(supabaseConfig).toContain("https://acheguese.com.br/login?confirmed=1");
    expect(supabaseConfig).toContain("http://localhost:5175/login?confirmed=1");
    expect(supabaseConfig).toContain("http://127.0.0.1:5175/login?confirmed=1");
    expect(client).toContain('flowType: "pkce"');
    expect(client).toContain("detectSessionInUrl: true");
  });
});
