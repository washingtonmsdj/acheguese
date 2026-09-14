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
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const signup = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const terms = readProjectFile(
      "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
    );

    expect(authService).toContain('provider: "google"');
    expect(authService).toContain("getTermsAcceptanceRedirectUrl");
    expect(authService).toContain('/aceitar-termos');

    const googleLoginStart = login.indexOf("const handleGoogleLogin");
    const googleLoginEnd = login.indexOf("const handleForgotPassword");
    const googleLoginHandler = login.slice(googleLoginStart, googleLoginEnd);
    expect(googleLoginStart).toBeGreaterThanOrEqual(0);
    expect(googleLoginEnd).toBeGreaterThan(googleLoginStart);
    expect(googleLoginHandler).toContain("setPendingAuthReturn(redirectTo)");
    expect(googleLoginHandler.indexOf("setPendingAuthReturn(redirectTo)")).toBeLessThan(
      googleLoginHandler.indexOf("await signInWithGoogle()"),
    );
    expect(googleLoginHandler).toContain("clearPendingAuthReturn()");

    expect(signup).toContain('setPendingAuthReturn("/cadastro/primeiro-acesso")');
    expect(terms).toContain("getPendingAuthReturn");
    expect(terms).toContain('resolveSafeInternalPath(getPendingAuthReturn(), "/")');
    expect(terms).toContain("recordConsent");
    expect(terms).toContain("TERMS_OF_SERVICE_VERSION");
    expect(terms).toContain("Entrar com Google não pula esta etapa");
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