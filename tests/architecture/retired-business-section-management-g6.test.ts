import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 retired Business section management surface", () => {
  const retiredFiles = [
    "src/core/business/services/BusinessManagementService.ts",
    "src/core/business/hooks/useBusinessManagement.ts",
    "src/modules/business/hooks/useBusinessManagement.ts",
  ];

  it("keeps the retired management facade out of the source tree", () => {
    for (const path of retiredFiles) {
      expect(existsSync(resolve(ROOT, path))).toBe(false);
    }
  });

  it("keeps the removed secoes_ativas column out of generated schema and runtime owners", () => {
    const generated = read("src/integrations/supabase/types.generated.ts");
    const owners = [
      read("src/core/business/services/BusinessService.ts"),
      read("src/core/business/services/business.mutations.ts"),
      read("src/modules/business/index.ts"),
      read("src/modules/business/hooks/index.ts"),
      read("src/modules/business/types/index.ts"),
    ].join("\n");

    expect(generated).not.toContain("secoes_ativas");
    expect(owners).not.toContain("secoes_ativas");
    expect(owners).not.toContain("updateActiveSections");
    expect(owners).not.toContain("BusinessManagementService");
    expect(owners).not.toContain("useBusinessManagement");
  });
});
