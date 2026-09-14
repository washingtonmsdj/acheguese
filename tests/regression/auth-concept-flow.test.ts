import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function readWebpDimensions(path: string): { width: number; height: number } {
  const filePath = resolve(repoRoot, path);
  const data = readFileSync(filePath);

  expect(data.subarray(0, 4).toString("ascii"), `${path} must start with RIFF`).toBe(
    "RIFF",
  );
  expect(data.subarray(8, 12).toString("ascii"), `${path} must be WEBP`).toBe(
    "WEBP",
  );
  expect(
    data.readUInt32LE(4) + 8,
    `${path} RIFF length must match the checked-in blob`,
  ).toBe(data.length);

  const chunk = data.subarray(12, 16).toString("ascii");
  expect(chunk, `${path} must use a supported WebP frame`).toBe("VP8 ");

  const payload = 20;
  expect(
    Array.from(data.subarray(payload + 3, payload + 6)),
    `${path} must contain a valid VP8 keyframe`,
  ).toEqual([0x9d, 0x01, 0x2a]);

  return {
    width: data.readUInt16LE(payload + 6) & 0x3fff,
    height: data.readUInt16LE(payload + 8) & 0x3fff,
  };
}

describe("account and access concept contract", () => {
  it("keeps the mobile viewport notch-safe without disabling zoom", () => {
    const html = readProjectFile("index.html");
    const header = readProjectFile("src/app/components/auth/AuthBrandHeader.tsx");
    const footer = readProjectFile("src/app/components/auth/AuthFooter.tsx");

    expect(html).toContain(
      'content="width=device-width, initial-scale=1.0, viewport-fit=cover"',
    );
    expect(html).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(html).not.toMatch(/maximum-scale\s*=\s*1/i);
    expect(header).toContain('env(safe-area-inset-top)');
    expect(header).toContain('location.pathname === "/reset-password"');
    expect(header).toContain(">Voltar</span>");
    expect(footer).toContain('env(safe-area-inset-bottom)');
  });

  it("keeps Google OAuth visible in production and wired through the real provider flow", () => {
    const productionEnv = readProjectFile(".env.production");
    const login = readProjectFile("src/app/pages/LoginPage.tsx");
    const cadastro = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPage.tsx",
    );
    const authService = readProjectFile("src/core/auth/services/AuthService.ts");

    expect(productionEnv).toContain("VITE_AUTH_GOOGLE_ENABLED=true");
    expect(login).toContain("Continuar com Google");
    expect(login).toContain("googleAuthAvailable");
    expect(cadastro).toContain("Continuar com Google");
    expect(cadastro).toContain('setPendingAuthReturn("/cadastro/primeiro-acesso")');
    expect(authService).toContain('provider: "google"');
    expect(authService).toContain("getTermsAcceptanceRedirectUrl");
  });

  it("keeps initial signup account-first, territory optional and username-aware", () => {
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
    expect(cadastro).toContain("useIdentityAvailability");
    expect(cadastro).toContain("Verificando disponibilidade");
    expect(cadastro).toContain("Nome de usuário disponível.");
    expect(cadastroHook).toContain("PublicIdentityService.checkAvailability");
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
    const passwordPolicy = readProjectFile("src/shared/validation/passwordPolicy.ts");

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
    expect(recovery).toContain("getPasswordConceptRequirementStatus");
    expect(recovery).not.toContain("getPasswordRequirementStatus(newPassword)");
    expect(passwordPolicy).toContain('label: "Maiúscula e minúscula"');
    expect(passwordPolicy).toContain('label: "Número e símbolo"');
    expect(passwordPolicy).toContain("getPasswordRequirementStatus(password)");
  });

  it("ships valid concept raster artwork with the approved crop dimensions", () => {
    const expectedAssets = [
      {
        path: "public/auth/login-hero.webp",
        width: 376,
        height: 264,
        minBytes: 9_000,
      },
      {
        path: "public/auth/signup-hero.webp",
        width: 340,
        height: 186,
        minBytes: 5_000,
      },
      {
        path: "public/auth/confirm-hero.webp",
        width: 355,
        height: 188,
        minBytes: 5_000,
      },
      {
        path: "public/auth/recovery-hero.webp",
        width: 368,
        height: 149,
        minBytes: 7_000,
      },
      {
        path: "public/auth/confirm-envelope.webp",
        width: 120,
        height: 115,
        minBytes: 1_000,
      },
    ] as const;

    for (const asset of expectedAssets) {
      const absolutePath = resolve(repoRoot, asset.path);
      expect(existsSync(absolutePath), `${asset.path} must exist`).toBe(true);
      const data = readFileSync(absolutePath);
      expect(data.length, `${asset.path} must not be a truncated placeholder`).toBeGreaterThanOrEqual(
        asset.minBytes,
      );
      expect(readWebpDimensions(asset.path), `${asset.path} crop dimensions`).toEqual({
        width: asset.width,
        height: asset.height,
      });
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

    const iconCss = readProjectFile(
      "src/app/components/auth/auth-concept-icons.css",
    );
    expect(iconCss).toContain("conic-gradient");
    expect(iconCss).not.toContain("content:'G'");

    const firstAccess = readProjectFile(
      "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
    );
    expect(firstAccess).not.toContain('@/shared/components/ui/select');
    expect(firstAccess).toContain("function ConceptSelect(");
  });
});
