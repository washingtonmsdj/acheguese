import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (filePath: string) => readFileSync(resolve(repoRoot, filePath), "utf8");

describe("Business edit persistence contract", () => {
  it("keeps the editor save awaitable until persistence completes", () => {
    const page = read("src/modules/business/pages/EditarEmpresaPage.tsx");
    const hook = read("src/modules/business/hooks/useBusinessEdit.ts");

    expect(page).toContain("await updateBusiness(");
    expect(hook).toContain("updateBusiness: mutation.mutateAsync");
    expect(hook).not.toContain("updateBusiness: mutation.mutate,");
    expect(hook).not.toContain("updateBusinessAsync:");
  });
});
