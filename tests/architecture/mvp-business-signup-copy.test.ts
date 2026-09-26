import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP business signup copy", () => {
  it("keeps the public signup landing human-facing", () => {
    const content = readFileSync(
      "src/modules/business/pages/EmpresasCadastroLandingPage.tsx",
      "utf8",
    );

    for (const internalPhrase of [
      "Entrada comercial pública",
      "Módulo público",
      "Gestão real",
      "verticais e planos",
      "O cliente encontra sua empresa em /empresas",
      "/central/empresas/nova</p>",
    ]) {
      expect(content).not.toContain(internalPhrase);
    }

    expect(content).toContain("Para quem empreende no bairro");
    expect(content).toContain("Central da empresa");
    expect(content).toContain("Sua página pública");
  });
});
