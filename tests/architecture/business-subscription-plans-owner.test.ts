import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CORE_PLANS = join(ROOT, "src", "core", "business", "components", "SubscriptionPlans.tsx");
const MODULE_PLANS = join(ROOT, "src", "modules", "business", "components", "SubscriptionPlans.tsx");
const ACTIVE_PAGE = join(ROOT, "src", "app", "pages", "DashboardEmpresaPage.tsx");
const MODULE_BARREL = join(ROOT, "src", "modules", "business", "components", "index.ts");

describe("G6 Business subscription plans ownership", () => {
  it("renders billing-backed plans from the canonical core owner", () => {
    const pageSource = readFileSync(ACTIVE_PAGE, "utf8");
    const coreSource = readFileSync(CORE_PLANS, "utf8");

    expect(pageSource).toContain(
      'import SubscriptionPlans from \'@/core/business/components/SubscriptionPlans\'',
    );
    expect(coreSource).toContain("useBillingPlans");
    expect(coreSource).toContain("Planos carregados do billing");
    expect(coreSource).not.toContain("Planos de assinatura em breve");
  });

  it("does not recreate the retired module subscription plans component", () => {
    expect(existsSync(MODULE_PLANS)).toBe(false);
    expect(readFileSync(MODULE_BARREL, "utf8")).not.toContain(
      '"./SubscriptionPlans"',
    );
  });
});
