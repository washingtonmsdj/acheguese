import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const ACTIVE_NETWORK_TAB = join(
  ROOT,
  "src",
  "core",
  "business",
  "components",
  "NetworkTab.tsx",
);
const LEGACY_NETWORK_BRIDGE = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "NetworkTab.tsx",
);
const ACTIVE_PAGE = join(ROOT, "src", "app", "pages", "DashboardEmpresaPage.tsx");
const CORE_BARREL = join(ROOT, "src", "core", "business", "index.ts");
const MODULE_BARREL = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "index.ts",
);

describe("G6 Business network ownership", () => {
  it("keeps the rendered network tab on the canonical core owner", () => {
    expect(existsSync(ACTIVE_NETWORK_TAB)).toBe(true);

    const page = readFileSync(ACTIVE_PAGE, "utf8");
    const coreBarrel = readFileSync(CORE_BARREL, "utf8");

    expect(page).toContain("import { NetworkTab } from '@/core/business'");
    expect(coreBarrel).toContain(
      "export { default as NetworkTab } from './components/NetworkTab'",
    );
  });

  it("does not recreate the retired modules bridge", () => {
    expect(existsSync(LEGACY_NETWORK_BRIDGE)).toBe(false);

    const moduleBarrel = readFileSync(MODULE_BARREL, "utf8");
    expect(moduleBarrel).not.toContain('"./NetworkTab"');
  });
});
