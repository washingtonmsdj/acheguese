import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const exists = (path: string) => existsSync(resolve(repoRoot, path));

describe("Gastronomy module boundary ratchet", () => {
  it("keeps runtime integration debt at zero", () => {
    const validator = read("tools/architecture/validate-gastronomy-module-boundaries.ts");
    const readme = read("src/modules/business/gastronomy/README.md");

    expect(validator).toContain(
      "const ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES = new Set<string>();",
    );
    expect(readme).toContain(
      "baseline runtime de acesso direto a `@/integrations/*` dentro de `src/modules/business/gastronomy` é **zero**",
    );
    expect(readme).not.toContain("baseline atual possui **5 arquivos runtime**");
  });

  it("forbids product callers of remaining compatibility bridges", () => {
    const validator = read("tools/architecture/validate-gastronomy-module-boundaries.ts");
    const legacyImports = [
      "@/modules/business/gastronomy/services/gastronomy-runtime.queries",
      "@/modules/business/gastronomy/services/GastronomyProfileService",
      "@/modules/business/gastronomy/services/MenuService",
      "@/modules/business/gastronomy/niches/types",
      "@/modules/business/gastronomy/niches/pizzaria/PizzaAdminService",
    ];

    expect(validator).toContain("const FORBIDDEN_COMPATIBILITY_IMPORTS = new Map([");
    for (const legacyImport of legacyImports) {
      expect(validator).toContain(legacyImport);
    }
  });

  it("keeps mixed module contracts explicit instead of misclassifying them as bridges", () => {
    const validator = read("tools/architecture/validate-gastronomy-module-boundaries.ts");
    const gastronomyTypes = read(
      "src/modules/business/gastronomy/types/gastronomy/index.ts",
    );
    const menuTypes = read("src/modules/business/gastronomy/types/menu.ts");
    const pizzaTypes = read(
      "src/modules/business/gastronomy/niches/pizzaria/types.ts",
    );

    expect(validator).toContain("const MODULE_LOCAL_CONTRACT_SURFACES = new Map([");
    expect(gastronomyTypes).toContain("@/core/business/types/gastronomy");
    expect(gastronomyTypes).toContain("CuisineType");
    expect(menuTypes).toContain("@/core/business/types/gastronomyMenu");
    expect(menuTypes).toContain("export interface CartItem");
    expect(pizzaTypes).toContain("@/core/business/niches/pizzaria/types");
    expect(pizzaTypes).toContain("export interface PizzaBuildSelection");
  });

  it("keeps menu persistence owned by core", () => {
    const coreMenuTypes = read("src/core/business/types/gastronomyMenu.ts");
    const coreMenuQueries = read("src/core/business/services/menu.queries.ts");

    expect(coreMenuTypes).toContain("export interface MenuItem");
    expect(coreMenuQueries).toContain("@/integrations/supabase");
  });

  it("does not recreate retired Gastronomy read/resolver bridges", () => {
    const retiredBridges = [
      "src/modules/business/gastronomy/services/gastronomy.queries.ts",
      "src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts",
      "src/modules/business/gastronomy/services/resolveGastronomyBusinessId.ts",
      "src/modules/business/gastronomy/services/activity.queries.ts",
      "src/modules/business/gastronomy/services/favorites.queries.ts",
      "src/modules/business/gastronomy/services/review.queries.ts",
      "src/modules/business/gastronomy/services/menu.queries.ts",
      "src/modules/business/gastronomy/services/DeliveryAreaService.ts",
      "src/modules/business/gastronomy/niches/versioning/types.ts",
      "src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts",
    ];

    for (const bridge of retiredBridges) {
      expect(exists(bridge), bridge).toBe(false);
    }

    const validator = read(
      "tools/architecture/validate-gastronomy-module-boundaries.ts",
    );
    expect(validator).toContain("const RETIRED_CORE_BRIDGES = new Set([");
    for (const bridge of retiredBridges) {
      expect(validator).toContain(bridge);
    }
  });

  it("keeps pizza persistence behind its remaining core bridge", () => {
    const pizza = read(
      "src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts",
    );
    const versioning = read(
      "src/core/business/niches/versioning/NicheVersioningService.ts",
    );

    expect(pizza).toContain("@/core/business/niches/pizzaria/PizzaAdminService");
    expect(versioning).toContain("@/integrations/supabase");
    expect(pizza).not.toContain("@/integrations/");
  });
});
