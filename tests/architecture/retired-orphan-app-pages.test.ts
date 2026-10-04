import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RETIRED_APP_PAGES = [
  "src/app/pages/CheckoutCancelPage.tsx",
  "src/app/pages/CheckoutSuccessPage.tsx",
  "src/app/pages/PricingPage.tsx",
  "src/app/pages/SubscriptionManagementPage.tsx",
  "src/app/pages/VirtualTryOnPage.tsx",
  "src/app/pages/CommunityIndicationPage.tsx",
  "src/app/pages/gamification/RankingPage.tsx",
] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("retired orphan app pages", () => {
  it("keeps callerless legacy shells out of the active app layer", () => {
    for (const relativePath of RETIRED_APP_PAGES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }

    const routes = [
      read("src/app/routes/AppRoutes.tsx"),
      read("src/app/routes/sections/AppLayoutRoutes.tsx"),
      read("src/app/routes/activeLazyImports.ts"),
    ].join("\n");

    for (const retiredName of [
      "CheckoutCancelPage",
      "CheckoutSuccessPage",
      "PricingPage",
      "SubscriptionManagementPage",
      "VirtualTryOnPage",
      "CommunityIndicationPage",
      "RankingPage",
    ]) {
      expect(routes).not.toContain(retiredName);
    }

    for (const retiredRoute of [
      'path="/planos"',
      'path="/checkout/success"',
      'path="/checkout/cancel"',
      'path="/settings/subscription"',
      'path="/indicar-comunidade"',
    ]) {
      expect(routes).not.toContain(retiredRoute);
    }
  });

  it("preserves bounded contexts while paused UI shells stay retired", () => {
    expect(fs.existsSync(path.join(ROOT, "src/core/billing"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "src/modules/ai/virtual-tryon"))).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          ROOT,
          "src/core/routing/services/CommunityInterestRegistrationService.ts",
        ),
      ),
    ).toBe(true);

    const registry = read("src/app/config/productModuleRegistry.ts");
    const waitlist = read("src/app/pages/PreLaunchWaitlist.tsx");
    expect(registry).toContain('community: { status: "paused" }');
    expect(registry).toContain('billing: { status: "paused" }');
    expect(waitlist).toContain("registerCommunityInterest");
  });
});
