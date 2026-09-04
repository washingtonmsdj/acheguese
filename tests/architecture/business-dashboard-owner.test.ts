import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const ACTIVE_DASHBOARD = join(
  ROOT,
  "src",
  "core",
  "business",
  "components",
  "EmpresaDashboardTab.tsx",
);
const LEGACY_DASHBOARD = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "EmpresaDashboardTab.tsx",
);
const LEGACY_WRAPPER = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "tabs",
  "DashboardTab.tsx",
);
const ACTIVE_PAGE = join(ROOT, "src", "app", "pages", "DashboardEmpresaPage.tsx");
const MODULE_BARREL = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "index.ts",
);

describe("G6 Business dashboard ownership", () => {
  it("keeps the rendered dashboard on the canonical core owner", () => {
    expect(existsSync(ACTIVE_DASHBOARD)).toBe(true);
    expect(readFileSync(ACTIVE_PAGE, "utf8")).toContain(
      "@/core/business/components/EmpresaDashboardTab",
    );
  });

  it("does not recreate the retired module dashboard implementation or wrapper", () => {
    expect(existsSync(LEGACY_DASHBOARD)).toBe(false);
    expect(existsSync(LEGACY_WRAPPER)).toBe(false);

    const barrel = readFileSync(MODULE_BARREL, "utf8");
    expect(barrel).not.toContain('"./EmpresaDashboardTab"');
    expect(barrel).not.toContain('"./tabs/DashboardTab"');
  });
});
