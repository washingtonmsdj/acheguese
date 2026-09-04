import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CORE_COUPON = join(
  ROOT,
  "src",
  "core",
  "business",
  "components",
  "CouponManager.tsx",
);
const MODULE_COUPON = join(
  ROOT,
  "src",
  "modules",
  "business",
  "components",
  "CouponManager.tsx",
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

describe("G6 Business coupon manager ownership", () => {
  it("keeps the active coupon surface on the canonical core owner", () => {
    const pageSource = readFileSync(ACTIVE_PAGE, "utf8");
    const coreSource = readFileSync(CORE_COUPON, "utf8");

    expect(pageSource).toContain(
      'import("@/core/business/components/CouponManager")',
    );
    expect(coreSource).toContain("Gestão de cupons por empresa indisponível");
    expect(coreSource).toContain("business_id");
    expect(coreSource).not.toContain("Gerenciador de cupons em breve");
  });

  it("does not recreate the retired module coupon manager", () => {
    expect(existsSync(MODULE_COUPON)).toBe(false);
    expect(readFileSync(MODULE_BARREL, "utf8")).not.toContain(
      '"./CouponManager"',
    );
  });
});
