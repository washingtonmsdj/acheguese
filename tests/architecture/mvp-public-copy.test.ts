import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PUBLIC_COPY_FILES = [
  "src/app/pages/TerritoryEntryPage.tsx",
  "src/app/pages/TerritoryHomePage.tsx",
  "src/app/pages/ComoFuncionaPage.tsx",
  "src/app/pages/BuscaPage.tsx",
  "src/core/navigation/territoryNavigationModes.ts",
  "src/core/nearby/pages/NearbyPage.tsx",
] as const;

describe("MVP public copy", () => {
  it("keeps public discovery language resident-facing", () => {
    const content = PUBLIC_COPY_FILES.map((path) => readFileSync(path, "utf8")).join("\n");

    for (const internalPhrase of [
      "conteúdo dos módulos ativos",
      "nos módulos ativos",
      "resultados dos módulos ativos",
      "lista técnica de módulos",
      "capacidades pausadas",
      "detalhe canônico",
      "redirects usados",
      "Pausar um módulo",
      "remendos nos módulos",
      "Buscar nos módulos ativos",
      "sem fontes ativas",
      "capability continua",
      "provider de domínio",
      "provider de proximidade",
      "owner de Perto de mim",
      "módulo Empresas",
      "referência territorial sem fabricar distância pessoal",
      "Procurar no bairro",
    ]) {
      expect(content).not.toContain(internalPhrase);
    }
  });
});
