import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community canonical routes", () => {
  it("uses only :territorySlug for community local routes", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");

    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug"');
    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug/feed"');
    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug/grupos"');
    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug/grupos/:id"');
    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug/problemas"');
    expect(routesSource).toContain('path="/comunidade/:state/:city/:territorySlug/achados-e-perdidos"');
  });

  it("does not keep legacy community paths", () => {
    const routesSource = readProjectFile("src/app/routes/AppRoutes.tsx");

    expect(routesSource).not.toContain('path="/comunidade/:state/:city/area/:groupSlug/*"');
    expect(routesSource).not.toContain('path="/comunidade/:state/:city"');
    expect(routesSource).not.toContain('path="/comunidade"');
    expect(routesSource).not.toContain('path="/comunidade/grupos"');
    expect(routesSource).not.toContain('path="/comunidade/problemas"');
    expect(routesSource).not.toContain("CommunityLegacyAreaRedirect");
  });
});
