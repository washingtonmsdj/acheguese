import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("MVP business signup copy", () => {
  it("keeps the public signup flow human-facing", () => {
    const landing = readFileSync(
      "src/modules/business/pages/EmpresasCadastroLandingPage.tsx",
      "utf8",
    );
    const create = readFileSync(
      "src/modules/business/pages/CriarEmpresaPage.tsx",
      "utf8",
    );
    const content = `${landing}\n${create}`;

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

    expect(landing).toContain("<CriarEmpresaPage");
    expect(create).toContain('"Para quem empreende"');
    expect(create).toContain('"Cadastrar empresa"');
    expect(create).toContain("Divulgue seu negócio");
    expect(create).toContain("Revisar e publicar");
    expect(create).toContain("Central da empresa");
  });
});
