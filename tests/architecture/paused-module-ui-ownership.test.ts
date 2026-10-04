import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const BILLING_UI = [
  "src/modules/billing/pages/PricingPage.tsx",
  "src/modules/billing/pages/CheckoutSuccessPage.tsx",
  "src/modules/billing/pages/CheckoutCancelPage.tsx",
  "src/modules/billing/pages/SubscriptionManagementPage.tsx",
] as const;

describe("paused module UI ownership", () => {
  it("keeps future billing, gamification, community and virtual try-on UI versioned in their bounded contexts", () => {
    for (const relativePath of BILLING_UI) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);
    }
    expect(fs.existsSync(path.join(ROOT, "src/modules/gamification/pages/RankingPage.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/core/community/pages/CommunityIndicationPage.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/modules/ai/virtual-tryon/components/VirtualTryOnStudio.tsx"))).toBe(true);
    const ranking = read("src/modules/gamification/pages/RankingPage.tsx");
    expect(ranking).not.toContain("@/modules/mobility/");
  });

  it("keeps paused module pages outside the active app route graph", () => {
    const registry = read("src/app/config/productModuleRegistry.ts");
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const lazyImports = read("src/app/routes/activeLazyImports.ts");

    expect(registry).toContain('gamification: { status: "paused" }');
    expect(registry).toContain('billing: { status: "paused" }');
    expect(registry).toContain('community: { status: "paused" }');

    for (const pageName of [
      "PricingPage",
      "CheckoutSuccessPage",
      "CheckoutCancelPage",
      "SubscriptionManagementPage",
      "RankingPage",
      "CommunityIndicationPage",
      "VirtualTryOnStudio",
    ]) {
      expect(routes).not.toContain(pageName);
      expect(lazyImports).not.toContain(pageName);
    }
  });

  it("keeps obsolete app-level wrappers retired instead of duplicating module owners", () => {
    for (const relativePath of [
      "src/app/pages/PricingPage.tsx",
      "src/app/pages/CheckoutSuccessPage.tsx",
      "src/app/pages/CheckoutCancelPage.tsx",
      "src/app/pages/SubscriptionManagementPage.tsx",
      "src/app/pages/VirtualTryOnPage.tsx",
      "src/app/pages/gamification/RankingPage.tsx",
    ]) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }
  });
});
