import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/modules/profile/pages/ContaHubPage.tsx"),
  "utf8",
);

describe("Conta: erro de refresh nao pode exibir snapshot privado como saudavel", () => {
  it("exibe erro com retry antes de qualquer layout de perfil, inclusive se existir cache", () => {
    const errorGuardIndex = source.indexOf("if (data.error) {");
    const emptyIdentityIndex = source.indexOf("if (!resolvedProfile) {");
    const layoutIndex = source.indexOf("return (\n    <ContaHubLayout");

    expect(errorGuardIndex).toBeGreaterThan(-1);
    expect(emptyIdentityIndex).toBeGreaterThan(errorGuardIndex);
    expect(layoutIndex).toBeGreaterThan(emptyIdentityIndex);
    expect(source.slice(errorGuardIndex, emptyIdentityIndex)).toContain(
      "data.refreshWorkspace()",
    );
    expect(source).not.toContain(
      "data.error && !resolvedProfile && !data.identity",
    );
  });
});
