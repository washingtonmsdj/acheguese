import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("public module URL contracts", () => {
  it("keeps education listing and detail URLs on the public module surface", () => {
    const serviceSource = readProjectFile(
      "src/modules/business/education/services/EducationUrlService.ts",
    );
    const explorerSource = readProjectFile(
      "src/modules/business/education/pages/EducationExplorerPage.tsx",
    );

    expect(serviceSource).toContain("buildModuleTerritoryUrlFromSegments");
    expect(serviceSource).toContain("buildModuleTerritoryEntityUrl");
    expect(explorerSource).toContain("EducationUrlService.buildListingUrl");
    expect(`${serviceSource}\n${explorerSource}`).not.toContain("buildCommunity");
  });

  it("keeps classifieds listing and detail URLs on the public marketplace surface", () => {
    const hookSource = readProjectFile(
      "src/modules/classifieds/hooks/useClassifiedUrls.ts",
    );
    const serviceSource = readProjectFile(
      "src/core/classifieds/services/ClassifiedUrlService.ts",
    );

    expect(hookSource).toContain("buildModuleTerritoryUrl");
    expect(serviceSource).toContain("`/classificados/${uf}/${cidade}/${bairro}");
    expect(`${hookSource}\n${serviceSource}`).not.toContain("buildCommunity");
  });

  it("keeps services discovery out of community URL builders", () => {
    const landingSource = readProjectFile(
      "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
    );

    expect(landingSource).not.toContain("buildCommunity");
    expect(landingSource).not.toContain("communityBaseUrl");
    expect(landingSource).not.toContain("communityAlias");
  });
});
