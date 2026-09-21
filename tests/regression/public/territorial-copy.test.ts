import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

const suspiciousMojibakeTokens = [
  "Ã¡",
  "Ã¢",
  "Ã£",
  "Ã§",
  "Ã©",
  "Ãª",
  "Ã­",
  "Ã³",
  "Ãµ",
  "Ãº",
  "Ã‡",
  "Â°",
  "â€¢",
  "â˜…",
  "â€“",
  "â€”",
  "â€œ",
  "â€",
] as const;

const publicSurfaceFiles = [
  "src/app/components/Breadcrumbs.tsx",
  "src/app/pages/TerritoryHomePage.tsx",
  "src/app/pages/EmpresasLandingPage.tsx",
  "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
  "src/modules/classifieds/pages/ClassificadosPage.tsx",
] as const;

describe("public territorial copy regression", () => {
  it("keeps public territorial surfaces free from common mojibake tokens", () => {
    for (const file of publicSurfaceFiles) {
      const content = read(file);
      for (const token of suspiciousMojibakeTokens) {
        expect(
          content.includes(token),
          `${file} should not contain ${token}`,
        ).toBe(false);
      }
    }
  });

  it("preserves canonical city and territorial Home labels", () => {
    const territoryHome = read("src/app/pages/TerritoryHomePage.tsx");
    expect(territoryHome).toContain("Hoje em ${territoryName}");
    expect(territoryHome).toContain("Panorama de ${territoryName}");
    expect(territoryHome).toContain("Vale saber em ${territoryName}");

    const breadcrumbs = read("src/app/components/Breadcrumbs.tsx");
    expect(breadcrumbs).toContain('configuracoes: "Configurações"');
    expect(breadcrumbs).toContain('services: "Serviços"');
  });
});
