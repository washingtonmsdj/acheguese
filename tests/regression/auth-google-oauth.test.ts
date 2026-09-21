import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Google OAuth account/access contract", () => {
  it("keeps Google visible by default unless an environment explicitly disables it", () => {
    const envExample = readProjectFile(".env.example");
    const envLocalExample = readProjectFile(".env.local.example");
    const envProduction = readProjectFile(".env.production");
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    expect(envExample).toContain('VITE_AUTH_GOOGLE_ENABLED="true"');
    expect(envLocalExample).toContain('VITE_AUTH_GOOGLE_ENABLED="true"');
    expect(envProduction).toContain("VITE_AUTH_GOOGLE_ENABLED=true");
    expect(authService).toContain('VITE_AUTH_GOOGLE_ENABLED !== "false"');
  });

  it("keeps a real Google CTA on both sign-in and account creation", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const signup = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );

    expect(login).toContain("googleAuthAvailable");
    expect(login).toContain("signInWithGoogle");
    expect(login).toContain("Continuar com Google");
    expect(signup).toContain("googleAuthAvailable");
    expect(signup).toContain("signInWithGoogle");
    expect(signup).toContain("Continuar com Google");
    expect(signup).toContain("ou crie com e-mail");
  });

  it("sends OAuth through terms acceptance and preserves the safe return target", () => {
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");
    const authFlow = readProjectFile("src/core/auth/constants/authFlow.ts");
    const journey = readProjectFile("src/core/auth/utils/authJourney.ts");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const signup = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    expect(authService).toContain('provider: "google"');
    expect(authService).toContain("getTermsAcceptanceRedirectUrl");
    expect(authFlow).toContain('termsAcceptance: "/aceitar-termos"');

    const googleLoginStart = login.indexOf("const handleGoogleLogin");
    const googleLoginEnd = login.indexOf("const handleForgotPassword");
    const googleLoginHandler = login.slice(googleLoginStart, googleLoginEnd);
    expect(googleLoginStart).toBeGreaterThanOrEqual(0);
    expect(googleLoginEnd).toBeGreaterThan(googleLoginStart);
    expect(googleLoginHandler).toContain("prepareGoogleLogin(redirectTo)");
    expect(googleLoginHandler.indexOf("prepareGoogleLogin(redirectTo)")).toBeLessThan(
      googleLoginHandler.indexOf("await signInWithGoogle()"),
    );
    expect(googleLoginHandler).toContain("cancelGoogleLogin()");

    expect(signup).toContain("prepareGoogleSignup(redirectTo)");
    expect(signup).toContain("cancelGoogleSignup()");
    expect(journey).toContain("setPendingSignupRedirect");
    expect(journey).toContain("setPendingReturn(AUTH_PATHS.firstAccess)");
    expect(journey).toContain("getAuthJourneyReturnTarget");
    expect(journey).toContain("getSignupJourneyReturnTarget");
    expect(terms).toContain("getAuthJourneyReturnTarget()");
    expect(terms).toContain("getSignupJourneyReturnTarget()");
    expect(terms).not.toContain("pendingAuthReturn");
    expect(terms).not.toContain("pendingSignup");
    expect(terms).toContain("recordConsent");
    expect(terms).toContain("TERMS_OF_SERVICE_VERSION");
    expect(terms).toContain("Entrar com Google não pula esta etapa");
  });

  it("continues through the correct journey when current terms are already accepted or a new acceptance succeeds", () => {
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    const existingAcceptance = terms.indexOf(
      "consents.some((consent) => hasCurrentTermsAcceptance(consent))",
    );
    const existingSignupCompletion = terms.indexOf(
      "completeExistingGoogleSignupJourney();",
      existingAcceptance,
    );
    const existingSignupNavigation = terms.indexOf(
      "navigate(signupOriginalReturn, { replace: true });",
      existingSignupCompletion,
    );
    const existingRegularCompletion = terms.indexOf(
      "completeTermsJourney();",
      existingSignupNavigation,
    );
    const existingRegularNavigation = terms.indexOf(
      "navigate(returnTo, { replace: true });",
      existingRegularCompletion,
    );

    const recordConsent = terms.indexOf(
      "await PrivacySettingsService.recordConsent",
    );
    const recordedSignupCompletion = terms.indexOf(
      "completeExistingGoogleSignupJourney();",
      recordConsent,
    );
    const recordedSignupNavigation = terms.indexOf(
      "navigate(signupOriginalReturn, { replace: true });",
      recordedSignupCompletion,
    );
    const recordedRegularCompletion = terms.indexOf(
      "completeTermsJourney();",
      recordedSignupNavigation,
    );
    const recordedRegularNavigation = terms.indexOf(
      "navigate(returnTo, { replace: true });",
      recordedRegularCompletion,
    );

    expect(existingAcceptance).toBeGreaterThanOrEqual(0);
    expect(existingSignupCompletion).toBeGreaterThan(existingAcceptance);
    expect(existingSignupNavigation).toBeGreaterThan(existingSignupCompletion);
    expect(existingRegularCompletion).toBeGreaterThan(existingSignupNavigation);
    expect(existingRegularNavigation).toBeGreaterThan(existingRegularCompletion);

    expect(recordConsent).toBeGreaterThanOrEqual(0);
    expect(recordedSignupCompletion).toBeGreaterThan(recordConsent);
    expect(recordedSignupNavigation).toBeGreaterThan(recordedSignupCompletion);
    expect(recordedRegularCompletion).toBeGreaterThan(recordedSignupNavigation);
    expect(recordedRegularNavigation).toBeGreaterThan(recordedRegularCompletion);

    expect(terms).not.toContain('state === "accepted"');
    expect(terms).not.toContain("Tudo certo com os termos.");
  });

  it("fails closed when existing terms history cannot be read", () => {
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );
    const consentRead = terms.indexOf(
      "void PrivacySettingsService.getUserConsents(user.id)",
    );
    const catchBlock = terms.indexOf(".catch(() => {", consentRead);
    const retryState = terms.indexOf('state === "consent-error"');

    expect(terms).toContain('| "consent-error";');
    expect(consentRead).toBeGreaterThanOrEqual(0);
    expect(catchBlock).toBeGreaterThan(consentRead);
    expect(terms.slice(catchBlock, catchBlock + 120)).toContain(
      'setState("consent-error")',
    );
    expect(terms.slice(catchBlock, catchBlock + 120)).not.toContain(
      'setState("needs-acceptance")',
    );
    expect(retryState).toBeGreaterThan(catchBlock);
    expect(terms).toContain("setConsentCheckAttempt((attempt) => attempt + 1)");
    expect(terms).toContain("Tentar verificar novamente");
  });

  it("serializes terms acceptance before React submitting state can settle", () => {
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    const acceptHandler = terms.indexOf("const handleAccept = async () => {");
    const consentWrite = terms.indexOf(
      "await PrivacySettingsService.recordConsent({",
      acceptHandler,
    );
    const release = terms.indexOf(
      "acceptanceInFlight.current = false;",
      consentWrite,
    );

    expect(terms).toContain("const acceptanceInFlight = useRef(false);");
    expect(terms).toContain(
      "if (!user || !accepted || acceptanceInFlight.current) return;",
    );
    expect(terms).toContain("acceptanceInFlight.current = true;");
    expect(acceptHandler).toBeGreaterThanOrEqual(0);
    expect(consentWrite).toBeGreaterThan(acceptHandler);
    expect(release).toBeGreaterThan(consentWrite);
    expect(terms.slice(acceptHandler, consentWrite)).toContain(
      "acceptanceInFlight.current = true;",
    );
  });

  it("waits for the OAuth session even when PKCE has already disappeared from the live URL", () => {
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    expect(terms).toContain("useSessionContext");
    expect(terms).toContain("isLoading: sessionLoading");
    expect(terms).toContain("hasAuthCallbackMarker");
    expect(terms).toContain("window.location.search");
    expect(terms).toContain("window.location.hash");
    expect(callback).toContain("export function hasPendingPkceCode");
    expect(terms).toContain(
      "hasPendingPkceCode as hasPendingPkceCodeInUrl",
    );
    expect(terms).toContain(
      "const hasPendingPkceCode = hasPendingPkceCodeInUrl(liveSearch);",
    );
    expect(terms).not.toContain("new URLSearchParams(liveSearch).has(");
    expect(terms).toContain("const hasPendingOAuthJourney = journeyIntent !== null;");
    expect(terms).toContain("const oauthSessionSettling =");
    expect(terms).toContain("const oauthSettlementPending =");
    expect(terms).toContain("hasPendingPkceCode ||");
    expect(terms).toContain("(!user && authCallbackPending) ||");
    expect(terms).toContain("oauthSessionSettling;");
    expect(terms).toContain("if (sessionLoading || oauthSettlementPending) {");

    const pendingGuard = terms.indexOf("if (sessionLoading || oauthSettlementPending)");
    const signedOutGuard = terms.indexOf("if (!user)", pendingGuard + 1);
    expect(pendingGuard).toBeGreaterThanOrEqual(0);
    expect(signedOutGuard).toBeGreaterThan(pendingGuard);
    expect(terms.slice(pendingGuard, signedOutGuard)).toContain(
      'setState("checking")',
    );
    expect(terms).not.toContain('const { user } = useAuth()');
  });

  it("uses journey intent only as a bounded wait signal, never as authentication proof", () => {
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );
    const securityConfig = readProjectFile(
      "src/shared/config/security.config.ts",
    );

    expect(securityConfig).toContain("authUrlCleanupDelayMs: 5 * 1000");
    expect(terms).toContain("hasPendingOAuthJourney");
    expect(terms).toContain("oauthSettlementPending");
    expect(terms).toContain("AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs");
    expect(terms).toContain("const timeout = window.setTimeout(() => {");
    expect(terms).toContain('setState("oauth-error")');
    expect(terms).toContain("return () => window.clearTimeout(timeout);");
    expect(terms).toContain("if (!user) {");
    expect(terms).toContain('setState("signed-out")');
  });

  it("leaves auth return URL cleanup to the Supabase callback exchange", () => {
    const client = readProjectFile("src/integrations/supabase/supabase.ts");
    const packageLock = readProjectFile("package-lock.json");

    expect(client).toContain("detectSessionInUrl: true");
    expect(client).toContain('flowType: "pkce"');
    expect(packageLock).toContain('"node_modules/@supabase/supabase-js"');
    expect(packageLock).toContain('"version": "2.99.3"');
    expect(client).not.toContain("hasAuthReturnParams");
    expect(client).not.toContain("cleanAuthReturnUrl");
    expect(client).not.toContain(".getSession()");
  });

  it("keeps localhost:5175 as the only browser-authoritative local OAuth origin", () => {
    const origin = readProjectFile("src/shared/config/publicAppOrigin.ts");
    const viteConfig = readProjectFile("vite.config.ts");
    const env = readProjectFile(".env");
    const envLocalExample = readProjectFile(".env.local.example");
    const envProduction = readProjectFile(".env.production");
    const supabaseConfig = readProjectFile("supabase/config.toml");

    expect(origin).toContain('const LOCAL_AUTH_PORT = "5175"');
    expect(origin).toContain('url.hostname === "localhost"');
    expect(origin).toContain('url.hostname === "127.0.0.1"');
    expect(origin).toContain('url.protocol === "http:"');
    expect(origin).toContain("url.port === LOCAL_AUTH_PORT");
    expect(origin).not.toContain("import.meta.env.DEV");
    expect(origin).not.toContain('hostname === "[::1]"');
    expect((viteConfig.match(/port: 5175/g) ?? []).length).toBe(2);
    expect((viteConfig.match(/strictPort: true/g) ?? []).length).toBe(2);
    expect(env).toContain('VITE_PUBLIC_SITE_URL="http://localhost:5175"');
    expect(env).toContain('BASE_URL="http://localhost:5175"');
    expect(envLocalExample).toContain(
      'VITE_PUBLIC_SITE_URL="http://localhost:5175"',
    );
    expect(envProduction).toContain(
      "VITE_PUBLIC_SITE_URL=https://acheguese.com.br",
    );
    expect(supabaseConfig).toContain("http://localhost:5175/aceitar-termos");
    expect(supabaseConfig).toContain("http://127.0.0.1:5175/aceitar-termos");
  });

  it("turns a cancelled or failed OAuth callback into a recoverable state without reflecting provider text", () => {
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    expect(terms).toContain("isOAuthTermsCallbackError");
    expect(callback).toContain("AUTH_PATHS.termsAcceptance");
    expect(callback).toContain("AUTH_QUERY_KEYS.error");
    expect(callback).toContain("AUTH_QUERY_KEYS.errorCode");
    expect(terms).toContain('"oauth-error"');
    expect(terms).toContain("Não foi possível concluir a entrada com Google");
    expect(terms).toContain("Seu destino foi preservado");
    expect(terms).toContain("Voltar e tentar novamente");
    expect(callback).not.toContain("error_description");
    expect(terms).not.toContain("error_description");
  });

  it("keeps OAuth errors separate from password recovery errors", () => {
    const redirect = readProjectFile(
      "src/core/auth/components/AuthHashRedirect.tsx",
    );
    const callback = readProjectFile("src/core/auth/utils/authCallback.ts");

    expect(redirect).toContain("isExpiredPasswordRecoveryError");
    expect(redirect).not.toContain("access_denied");
    expect(callback).toContain("AUTH_QUERY_VALUES.expiredOtp");
    expect(callback).toContain("isOAuthTermsCallbackError");
  });

  it("keeps the necessary OAuth terms page inside the concept visual system", () => {
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    expect(terms).toContain("AuthBrandHeader");
    expect(terms).toContain("AuthConceptIcon");
    expect(terms).toContain("AuthFooter");
    expect(terms).toContain("Antes de continuar");
    expect(terms).toContain("Regras transparentes");
    expect(terms).toContain("Convivência responsável");
    expect(terms).not.toContain("lucide-react");
    expect(terms).not.toMatch(/<svg\b/i);
  });
});
