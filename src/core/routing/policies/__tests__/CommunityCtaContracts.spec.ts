import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community CTA contracts on public surfaces", () => {
  it("keeps Community CTAs out of the active territorial home while Community is paused", () => {
    const territoryHome = readProjectFile("src/app/pages/TerritoryHomePage.tsx");

    expect(territoryHome).not.toContain("MODULE_SLUGS.community");
    expect(territoryHome).not.toContain("Abrir portal comunitario");
    expect(territoryHome).not.toContain("Entrar na comunidade");
  });

  it("keeps the active home focused on the MVP discovery capabilities", () => {
    const territoryHome = readProjectFile("src/app/pages/TerritoryHomePage.tsx");

    expect(territoryHome).toContain("Empresas");
    expect(territoryHome).toContain("Mapa");
    expect(territoryHome).toContain("Perto de mim");
    expect(territoryHome).toContain("Busca");
  });
});
