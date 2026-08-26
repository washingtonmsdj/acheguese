import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("Gastronomy module boundary ratchet", () => {
  it("keeps runtime integration debt at zero", () => {
    const validator = read("scripts/validate-gastronomy-module-boundaries.ts");
    const readme = read("src/modules/business/gastronomy/README.md");

    expect(validator).toContain(
      "const ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES = new Set<string>();",
    );
    expect(readme).toContain(
      "baseline runtime de acesso direto a `@/integrations/*` dentro de `src/modules/business/gastronomy` é **zero**",
    );
    expect(readme).not.toContain("baseline atual possui **5 arquivos runtime**");
  });

  it("keeps menu contracts and persistence owned by core", () => {
    const moduleMenuTypes = read("src/modules/business/gastronomy/types/menu.ts");
    const moduleMenuQueries = read(
      "src/modules/business/gastronomy/services/menu.queries.ts",
    );
    const coreMenuTypes = read("src/core/business/types/gastronomyMenu.ts");
    const coreMenuQueries = read("src/core/business/services/menu.queries.ts");

    expect(moduleMenuTypes).toContain("@/core/business/types/gastronomyMenu");
    expect(moduleMenuQueries).toContain("@/core/business/services/menu.queries");
    expect(moduleMenuQueries).not.toContain("@/integrations/");
    expect(coreMenuTypes).toContain("export interface MenuItem");
    expect(coreMenuQueries).toContain("@/integrations/supabase");
  });

  it("keeps pizza and niche persistence behind core bridges", () => {
    const pizza = read(
      "src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts",
    );
    const versioning = read(
      "src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts",
    );

    expect(pizza).toContain("@/core/business/niches/pizzaria/PizzaAdminService");
    expect(versioning).toContain(
      "@/core/business/niches/versioning/NicheVersioningService",
    );
    expect(pizza).not.toContain("@/integrations/");
    expect(versioning).not.toContain("@/integrations/");
  });
});
