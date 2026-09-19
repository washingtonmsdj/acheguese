import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("Gastronomy write SSOT", () => {
  it("keeps profile persistence owned only by the canonical core service", () => {
    const canonical = read(
      "src/core/business/services/GastronomyProfileService.ts",
    );
    const serviceBarrel = read("src/core/business/services/index.ts");

    expect(canonical).toContain("@/integrations/supabase");
    expect(canonical).toContain("ensureOperationalMenuSetup");

    expect(
      existsSync(
        resolve(
          repoRoot,
          "src/core/business/services/gastronomy.mutations.ts",
        ),
      ),
    ).toBe(false);
    expect(serviceBarrel).not.toContain("./gastronomy.mutations");
    expect(serviceBarrel).not.toContain("createGastronomyProfile");
    expect(serviceBarrel).not.toContain("updateGastronomyProfile");
    expect(serviceBarrel).not.toContain("deleteGastronomyProfile");
    expect(serviceBarrel).not.toContain("patchGastronomyProfile");
  });
});
