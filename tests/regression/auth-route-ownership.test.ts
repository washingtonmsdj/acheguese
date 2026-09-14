import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("auth/public route ownership", () => {
  it("keeps account entry routes owned only by AppRoutes", () => {
    const root = read("src/app/routes/AppRoutes.tsx");
    const appLayout = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    for (const authPath of [
      "AUTH_PATHS.login",
      "AUTH_PATHS.signup",
      "AUTH_PATHS.signupConfirmation",
      "AUTH_PATHS.firstAccess",
      "AUTH_PATHS.termsAcceptance",
      "AUTH_PATHS.passwordReset",
    ]) {
      expect(root).toContain(authPath);
    }

    for (const duplicateLiteral of [
      'path="/login"',
      'path="/cadastro"',
      'path="/cadastro/confirmacao"',
      'path="/reset-password"',
      'path="/splash"',
      'path="/sobre"',
      'path="/contato"',
      'path="/onboarding"',
      'path="/q/:token"',
      'path="/status"',
      'path="/empresas/:id/catalogo"',
      'path="/p/:slug/*"',
    ]) {
      expect(appLayout, `${duplicateLiteral} must stay outside AppLayoutRoutes`).not.toContain(
        duplicateLiteral,
      );
    }

    expect(appLayout).not.toContain("RootRouteEntry");
  });

  it("keeps root-owned screens out of the AppLayout lazy barrel", () => {
    const lazyImports = read("src/app/routes/lazyImports.ts");

    for (const rootOwnedExport of [
      "LoginPage",
      "CadastroPage",
      "CadastroConfirmacaoPage",
      "ResetPasswordPage",
      "AboutPage",
      "ContactPage",
      "SplashPage",
      "OnboardingPage",
      "StatusPage",
      "QrResolverPage",
      "EmpresaCatalogoPublicoPage",
      "PremiumBusinessSiteRoute",
      "PremiumBusinessHomePage",
      "PremiumBusinessMenuPage",
      "PremiumBusinessProductPage",
      "PremiumBusinessCartPage",
      "PremiumBusinessCheckoutPage",
    ]) {
      expect(
        lazyImports,
        `${rootOwnedExport} belongs to AppRoutes and must not be redeclared in lazyImports`,
      ).not.toContain(`export const ${rootOwnedExport}`);
    }

    expect(lazyImports).toContain("Rotas publicas sem layout pertencem diretamente a AppRoutes");
  });

  it("does not let the root tree permanently pause launch-gated event routes", () => {
    const root = read("src/app/routes/AppRoutes.tsx");
    const appLayout = read("src/app/routes/sections/AppLayoutRoutes.tsx");

    expect(root).not.toContain("EVENT_ROUTES");
    expect(root).not.toContain('moduleName="Eventos"');
    expect(appLayout).toContain("EVENT_ROUTES.home");
    expect(appLayout).toContain('launchElement(\n          "events"');
    expect(appLayout).toContain('surface: "events"');
  });
});