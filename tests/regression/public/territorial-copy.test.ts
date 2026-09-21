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
  "src/app/pages/TerritoryEntryPage.tsx",
  "src/app/pages/TerritoryHomePage.tsx",
  "src/app/pages/EmpresasLandingPage.tsx",
  "src/core/maps/pages/MapaPageV4.tsx",
  "src/core/nearby/pages/NearbyPage.tsx",
] as const;

describe("public territorial copy regression", () => {
  it("keeps active public territorial surfaces free from common mojibake tokens", () => {
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

  it("keeps canonical MVP copy aligned with the active product", () => {
    const territoryHome = read("src/app/pages/TerritoryHomePage.tsx");
    expect(territoryHome).toContain(
      "Descubra empresas e lugares ao seu redor.",
    );
    expect(territoryHome).toContain('title="Empresas"');
    expect(territoryHome).toContain('title="Mapa"');
    expect(territoryHome).toContain('title="Perto de mim"');

    const entry = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(entry).toContain("Encontre empresas, visualize o território no mapa");
    expect(entry).not.toContain("eventos");
    expect(entry).not.toContain("serviços e histórias");
  });
});
