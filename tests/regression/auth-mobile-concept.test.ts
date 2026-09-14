import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("mobile account concept composition", () => {
  it("keeps signup account-first without extra OAuth chrome on mobile", () => {
    const signup = read("src/app/features/onboarding/pages/CadastroPage.tsx");
    const googleCopy = signup.indexOf("Continuar com Google");
    const desktopOnlyWrapper = signup.lastIndexOf(
      '<div className="hidden lg:block">',
      googleCopy,
    );

    expect(googleCopy).toBeGreaterThanOrEqual(0);
    expect(desktopOnlyWrapper).toBeGreaterThanOrEqual(0);
    expect(googleCopy - desktopOnlyWrapper).toBeLessThan(1_500);
    expect(signup).toContain(
      '<span className="lg:hidden">Seu identificador público.</span>',
    );
    expect(signup).toContain(
      '<span className="lg:hidden">Você pode se cadastrar de qualquer lugar.</span>',
    );
    expect(signup).toContain(
      '<span className="hidden lg:inline">\n                    Já tem conta?',
    );
    expect(signup).not.toContain('name="confirmPassword"');
    expect(signup).not.toContain('name="stateId"');
    expect(signup).not.toContain('name="cityId"');
    expect(signup).not.toContain('name="neighborhoodId"');
  });

  it("keeps login Google inside the approved mobile sign-in composition", () => {
    const login = read("src/app/pages/LoginPage.tsx");
    const googleCopy = login.indexOf("Continuar com Google");
    const nearestDesktopOnlyWrapper = login.lastIndexOf(
      '<div className="hidden lg:block">',
      googleCopy,
    );

    expect(googleCopy).toBeGreaterThanOrEqual(0);
    // O último bloco desktop-only é o cabeçalho do card, bem antes da ação Google.
    // Se Google for movido para dentro de um wrapper lg-only, a distância cai e o
    // contrato acusa a regressão da prancha mobile de Entrar.
    expect(googleCopy - nearestDesktopOnlyWrapper).toBeGreaterThan(2_000);
    expect(login).toContain("Ainda não tem conta?");
    expect(login).toContain("Criar minha conta");
    expect(login).toContain("Continuar explorando sem conta");
    expect(login).toContain("Verificação de segurança");
  });

  it("keeps notch/home-indicator spacing and concept-owned mobile artwork in CSS", () => {
    const layout = read("src/app/components/auth/auth-concept-layout.css");

    expect(layout).toContain("env(safe-area-inset-left)");
    expect(layout).toContain("env(safe-area-inset-right)");
    expect(layout).toContain("env(safe-area-inset-bottom)");
    expect(layout).toContain('button[aria-label="Voltar"]');
    expect(layout).toContain("max-width: 15.25rem !important");
    expect(layout).toContain("max-width: 17.75rem !important");
    expect(layout).toContain('main#main-content:has(#login-identifier) span[aria-hidden="true"].text-xl');
    expect(layout).toContain("font-size: 0 !important");
    expect(layout).toContain("border-right: 1.5px solid currentColor");
    expect(layout).toContain("border-bottom: 1.5px solid currentColor");
    expect(layout).toContain("details > summary::-webkit-details-marker");
    expect(layout).toContain(".auth-concept-icon--shield");
    expect(layout).toContain("clip-path: polygon(50% 0, 94% 17%, 88% 68%, 50% 100%, 12% 68%, 6% 17%)");
    expect(layout).toContain("border-left-color: #fff");
    expect(layout).toContain("border-bottom-color: #fff");
  });
});
