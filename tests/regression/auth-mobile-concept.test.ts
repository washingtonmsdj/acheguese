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
    expect(signup).toContain("max-w-[284px]");
    expect(signup).toContain('name="chevron-right"');
    expect(signup).not.toContain(">›</span>");
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

  it("keeps login Google and concept-owned artwork in the approved mobile composition", () => {
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
    expect(login).toContain("max-w-[245px]");
    expect(login).toContain('name="chevron-right"');
    expect(login).toContain('name="shield-filled"');
    expect(login).not.toContain(">›</span>");
    expect(login).toContain("Ainda não tem conta?");
    expect(login).toContain("Criar minha conta");
    expect(login).toContain("Continuar explorando sem conta");
    expect(login).toContain("Verificação de segurança");
  });

  it("keeps safe areas structural and visual artwork inside the concept icon owner", () => {
    const layout = read("src/app/components/auth/auth-concept-layout.css");
    const iconCss = read("src/app/components/auth/auth-concept-icons.css");
    const iconComponent = read("src/app/components/auth/AuthConceptIcon.tsx");

    expect(layout).toContain("env(safe-area-inset-left)");
    expect(layout).toContain("env(safe-area-inset-right)");
    expect(layout).toContain("env(safe-area-inset-bottom)");
    expect(layout).toContain('button[aria-label="Voltar"]');
    expect(layout).toContain("details > summary::-webkit-details-marker");
    expect(layout).not.toContain("font-size: 0 !important");
    expect(layout).not.toContain(".auth-concept-icon--shield");

    expect(iconComponent).toContain('| "chevron-right"');
    expect(iconComponent).toContain('| "shield-filled"');
    expect(iconCss).toContain(".auth-concept-icon--chevron-right");
    expect(iconCss).toContain(".auth-concept-icon--shield-filled");
    expect(iconCss).toContain("clip-path:polygon(50% 0,94% 17%,88% 68%,50% 100%,12% 68%,6% 17%)");
    expect(iconCss).toContain("border-left:2px solid #fff");
    expect(iconCss).toContain("border-bottom:2px solid #fff");
  });
});
