import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

describe("Gastronomy write SSOT", () => {
  it("keeps profile persistence owned by the canonical core service", () => {
    const canonical = read(
      "src/core/business/services/GastronomyProfileService.ts",
    );
    const compatibilityMutations = read(
      "src/core/business/services/gastronomy.mutations.ts",
    );
    const moduleBridge = read(
      "src/modules/business/gastronomy/services/GastronomyProfileService.ts",
    );

    expect(canonical).toContain("@/integrations/supabase");
    expect(compatibilityMutations).toContain("./GastronomyProfileService");
    expect(compatibilityMutations).not.toContain("@/integrations/");
    expect(compatibilityMutations).not.toContain(".from('gastronomy_profiles')");
    expect(moduleBridge).toContain(
      "@/core/business/services/GastronomyProfileService",
    );
    expect(moduleBridge).not.toContain("@/integrations/");
  });
});
