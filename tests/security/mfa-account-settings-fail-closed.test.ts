import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const hook = readFileSync(
  join(root, "src/core/auth/hooks/useMFA.ts"),
  "utf8",
);
const securityPage = readFileSync(
  join(root, "src/modules/profile/pages/ContaSegurancaPage.tsx"),
  "utf8",
);

describe("account MFA settings fail-closed contract", () => {
  it("preserves factor lookup failure instead of turning it into an empty authority result", () => {
    expect(hook).toContain("setError('Não foi possível consultar os fatores de MFA')");
    expect(hook).toContain("return null;");
    expect(hook).not.toContain(
      "setError('Não foi possível consultar os fatores de MFA');\n      return [];",
    );
  });

  it("does not present unresolved MFA authority as disabled", () => {
    expect(securityPage).toContain("isMFAStatusResolved");
    expect(securityPage).toContain("isMFAStatusResolved && !isMFAEnabled");
    expect(securityPage).toContain("isMFAStatusResolved && isMFAEnabled");
    expect(securityPage).toContain("Indisponível");
    expect(securityPage).not.toContain("{!isMFAEnabled ? (");
  });

  it("blocks destructive and enrollment actions while factor authority is unknown", () => {
    expect(securityPage).toContain("if (factors === null)");
    expect(securityPage).toContain("Nenhuma alteração foi feita.");
    expect(securityPage).toContain("!isMFAStatusResolved ? (");
    expect(securityPage).toContain(
      "Nenhuma nova configuração será criada enquanto o serviço de autenticação estiver indisponível.",
    );
    expect(securityPage).toContain("Confirmando o estado de segurança da conta...");
  });

  it("keeps implementation jargon out of the user-facing security surface", () => {
    expect(securityPage).not.toContain("códigos TOTP");
    expect(securityPage).not.toContain("fator TOTP");
    expect(securityPage).not.toContain("autoridade de fatores");
    expect(securityPage).toContain("aplicativo autenticador");
    expect(securityPage).toContain("serviço de autenticação");
  });
});
