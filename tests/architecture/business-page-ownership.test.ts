import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Business page ownership", () => {
  it("keeps retired standalone and module category page aliases absent", () => {
    expect(
      existsSync(join(ROOT, "src/modules/business/pages/BusinessStandalonePage.tsx")),
    ).toBe(false);
    expect(
      existsSync(join(ROOT, "src/modules/business/pages/CategoryBusinessPage.tsx")),
    ).toBe(false);
  });

  it("keeps category routing on the canonical core owner", () => {
    const territorial = readFileSync(
      join(ROOT, "src/app/routes/territorial/TerritorialModulePages.tsx"),
      "utf8",
    );
    const moduleBarrel = readFileSync(
      join(ROOT, "src/modules/business/index.ts"),
      "utf8",
    );

    expect(territorial).toContain(
      'import("@/core/business/pages/CategoryBusinessPage")',
    );
    expect(moduleBarrel).not.toContain("BusinessStandalonePage");
  });
});
