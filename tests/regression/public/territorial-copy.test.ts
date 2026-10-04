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
  "Â·",
  "â€¦",
  "â€¢",
  "â˜…",
  "â€“",
  "â€”",
  "â€œ",
  "â€",
] as const;

const activeMvpCopyFiles = [
  "src/app/pages/TerritoryEntryPage.tsx",
  "src/app/pages/TerritoryHomePage.tsx",
  "src/app/pages/TerritoryPortalPage.tsx",
  "src/app/pages/EmpresasLandingPage.tsx",
  "src/core/maps/pages/MapaPageV4.tsx",
  "src/core/nearby/pages/NearbyPage.tsx",
  "src/app/pages/LoginPage.tsx",
  "src/app/pages/ResetPasswordPage.tsx",
  "src/app/pages/EmailChangeConfirmationPage.tsx",
  "src/app/features/onboarding/pages/CadastroPage.tsx",
  "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
  "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
  "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
  "src/modules/business/components/create/ExtrasStep.tsx",
] as const;

describe("active MVP copy regression", () => {
  it("keeps active MVP surfaces free from common mojibake tokens", () => {
    for (const file of activeMvpCopyFiles) {
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
    const territoryHome = [
      read("src/app/pages/TerritoryHomePage.tsx"),
      read("src/app/pages/TerritoryPortalPage.tsx"),
    ].join("\n");
    expect(territoryHome).toContain(
      "Empresas, mapa, busca e o que está perto de você",
    );
    expect(territoryHome).toContain('label: "Empresas"');
    expect(territoryHome).toContain('label: "Mapa"');
    expect(territoryHome).toContain('label: "Perto de mim"');
    expect(territoryHome).toContain('label: "Busca"');

    const entry = read("src/app/pages/TerritoryEntryPage.tsx");
    expect(entry).toContain("Empresas, mapa, busca e o que está perto de você");
    expect(entry).not.toContain("eventos");
    expect(entry).not.toContain("serviços e histórias");
  });
});