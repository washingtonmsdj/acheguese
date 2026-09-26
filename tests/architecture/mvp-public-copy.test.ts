import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PUBLIC_COPY_FILES = [
  "src/app/pages/TerritoryEntryPage.tsx",
  "src/app/pages/ComoFuncionaPage.tsx",
  "src/core/navigation/territoryNavigationModes.ts",
] as const;

describe("MVP public copy", () => {
  it("keeps public discovery language resident-facing", () => {
    const content = PUBLIC_COPY_FILES.map((path) => readFileSync(path, "utf8")).join("\n");

    for (const internalPhrase of [
      "conteúdo dos módulos ativos",
      "nos módulos ativos",
      "capacidades pausadas",
      "detalhe canônico",
      "redirects usados",
      "Pausar um módulo",
      "remendos nos módulos",
      "Buscar nos módulos ativos",
    ]) {
      expect(content).not.toContain(internalPhrase);
    }
  });
});
