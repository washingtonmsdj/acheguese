import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("account and access concept contract", () => {
  it("keeps initial signup account-first and territory optional", () => {
    const cadastro = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const cadastroHook = readProjectFile(
      "src/app/features/onboarding/hooks/useCadastro.ts",
    );
    const schema = readProjectFile(
      "src/app/features/onboarding/validation/registerInitial.schema.ts",
    );

    expect(cadastro).toContain("Comece pelo seu perfil pessoal.");
    expect(cadastro).toContain("Depois, adicione perfis de negócio ou profissional.");
    expect(schema).not.toContain("confirmPassword");
    expect(schema).not.toContain("neighborhood");
    expect(schema).not.toContain("city:");
    expect(cadastroHook).not.toContain("neighborhood_id:");
    expect(cadastroHook).not.toContain("state:");
    expect(cadastroHook).not.toContain("city:");
  });

  it("always sends a confirmed new signup through first access before its return target", () => {
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );

    expect(login).toContain("if (isEmailConfirmed) {");
    expect(login).toContain('navigate("/cadastro/primeiro-acesso", { replace: true });');
    expect(login).not.toContain('isEmailConfirmed && redirectTo === "/"');

    expect(firstAccess).toContain("Sua conversa está esperando");
    expect(firstAccess).toContain("Continuar para a conversa");
    expect(firstAccess).toContain("Completar meu perfil depois");
    expect(firstAccess).toContain("Informar cidade e bairro");
    expect(firstAccess).toContain("Agora não");
    expect(firstAccess).toContain('public_location_visibility: "hidden"');
  });

  it("keeps recovery states implemented instead of decorative-only screens", () => {
    const recovery = readProjectFile("src/app/pages/ResetPasswordPage.tsx");

    for (const state of [
      '"request"',
      '"sent"',
      '"checking"',
      '"reset"',
      '"success"',
      '"invalid"',
    ]) {
      expect(recovery).toContain(state);
    }

    expect(recovery).toContain("resetPasswordByIdentifier");
    expect(recovery).toContain("updatePassword");
    expect(recovery).toContain("checkPasswordCompromise");
    expect(recovery).toContain("AuthService.onPasswordRecovery");
    expect(recovery).toContain("Este link não está");
  });

  it("ships the approved raster artwork used by desktop account screens", () => {
    const expectedAssets = [
      "public/auth/login-hero.webp",
      "public/auth/signup-hero.webp",
      "public/auth/confirm-hero.webp",
      "public/auth/recovery-hero.webp",
      "public/auth/confirm-envelope.webp",
    ];

    for (const asset of expectedAssets) {
      expect(existsSync(resolve(repoRoot, asset)), `${asset} must exist`).toBe(true);
    }

    expect(readProjectFile("src/app/pages/LoginPage.tsx")).toContain(
      '/auth/login-hero.webp',
    );
    expect(
      readProjectFile("src/app/features/onboarding/pages/CadastroPage.tsx"),
    ).toContain('/auth/signup-hero.webp');
    expect(
      readProjectFile(
        "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
      ),
    ).toContain('/auth/confirm-hero.webp');
    expect(readProjectFile("src/app/pages/ResetPasswordPage.tsx")).toContain(
      '/auth/recovery-hero.webp',
    );
  });

  it("does not reintroduce generic SVG icon packages in concept-owned auth components", () => {
    const conceptOwnedFiles = [
      "src/app/components/auth/AuthBrandHeader.tsx",
      "src/app/components/auth/AuthConceptIcon.tsx",
      "src/app/components/auth/PasswordInput.tsx",
      "src/app/pages/LoginPage.tsx",
      "src/app/pages/ResetPasswordPage.tsx",
      "src/app/features/onboarding/pages/CadastroPage.tsx",
      "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
      "src/shared/components/ui/checkbox.tsx",
    ];

    for (const path of conceptOwnedFiles) {
      const source = readProjectFile(path);
      expect(source, `${path} must not import lucide-react`).not.toContain(
        "lucide-react",
      );
      expect(source, `${path} must not embed svg markup`).not.toMatch(/<svg\b/i);
    }

    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );
    expect(firstAccess).not.toContain('@/shared/components/ui/select');
    expect(firstAccess).toContain("function ConceptSelect(");
  });
});
