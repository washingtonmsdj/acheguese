import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function collectRuntimeSources(directory: string): string[] {
  const absolute = resolve(root, directory);
  if (!existsSync(absolute)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(absolute)) {
    const path = resolve(absolute, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...collectRuntimeSources(path.slice(root.length + 1)));
      continue;
    }
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files;
}

const runtimeSources = collectRuntimeSources("src");
const businessSubscription = read("src/core/billing/SubscriptionService.ts");
const billingPlanService = read("src/core/billing/services/BillingPlanService.ts");
const billingService = read("src/core/billing/services/BillingService.ts");
const checkout = read("supabase/functions/billing-create-checkout/index.ts");
const webhook = read("supabase/functions/billing-webhook/index.ts");
const writeAuthorityMigration = read(
  "supabase/migrations/20260829173833_harden_user_subscription_write_authority.sql",
);
const entitlementBackfillMigration = read(
  "supabase/migrations/20260829175638_backfill_catalog_extra_entitlements.sql",
);

const directTableCall = (table: string) =>
  new RegExp(`\\.from(?:<[^;]{0,500}>)?\\(\\s*["']${table}["']\\s*\\)`, "m");

const directSubscriptionWrite = new RegExp(
  `\\.from(?:<[^;]{0,500}>)?\\(\\s*["']user_subscriptions["']\\s*\\)\\s*\\.(?:insert|update|upsert|delete)\\s*\\(`,
  "m",
);

describe("Billing subscription authority", () => {
  it("keeps billing as the only core subscription namespace", () => {
    expect(existsSync(resolve(root, "src/core/subscription"))).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/billing/services/SubscriptionContractService.ts")),
    ).toBe(false);
  });

  it("keeps browser runtime free of direct user_subscriptions writes", () => {
    const offenders = runtimeSources
      .filter((path) => directSubscriptionWrite.test(readFileSync(path, "utf8")))
      .map((path) => path.slice(root.length + 1));

    expect(offenders).toEqual([]);
  });

  it("keeps the browser business subscription gateway on Stripe authority", () => {
    expect(businessSubscription).toContain(
      '.from<CanonicalBusinessSubscriptionRow>("user_subscriptions")',
    );
    expect(businessSubscription).toContain("BillingService.redirectToCheckout");
    expect(businessSubscription).toContain("BillingService.redirectToPortal");
    expect(businessSubscription).not.toContain(".insert(");
    expect(businessSubscription).not.toContain(".update(");
    expect(businessSubscription).not.toContain(".delete(");
  });

  it("revokes authenticated self-service writes while preserving own reads", () => {
    expect(writeAuthorityMigration).toContain(
      'DROP POLICY IF EXISTS "Users manage own subscriptions"',
    );
    expect(writeAuthorityMigration).toContain(
      'CREATE POLICY "Users can view own subscriptions"',
    );
    expect(writeAuthorityMigration).toContain("FOR SELECT");
    expect(writeAuthorityMigration).toContain("TO authenticated");
    expect(writeAuthorityMigration).toContain("user_id = (SELECT auth.uid())");
  });

  it("keeps published catalog as the runtime source of plan data", () => {
    expect(billingPlanService).toContain("CatalogService.getPublishedBasePlans");
    expect(billingPlanService).toContain("CatalogService.getPlanByCode");
    expect(billingService).toContain("BillingPlanService.getActivePlans");
    expect(billingService).toContain("BillingPlanService.getPlanByCode");

    const legacyTables = [
      "billing_plans",
      "subscription_plans",
      "business_subscriptions",
      "gastronomy_subscriptions",
    ];
    const offenders = runtimeSources.flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return legacyTables
        .filter((table) => directTableCall(table).test(source))
        .map((table) => `${path.slice(root.length + 1)} -> ${table}`);
    });

    expect(offenders).toEqual([]);
  });

  it("preserves extension entitlements in the canonical catalog policy", () => {
    expect(entitlementBackfillMigration).toContain("catalog_entitlement_policy");
    expect(entitlementBackfillMigration).toContain("additional_entitlements");
    expect(entitlementBackfillMigration).toContain("billing_plans");
  });

  it("routes paid plan acquisition through published catalog and Stripe", () => {
    expect(checkout).toContain(".from('catalog_item')");
    expect(checkout).toContain("commercial_catalog_version!inner(status)");
    expect(checkout).toContain("catalog_pricing_policy");
    expect(checkout).toContain("stripe.checkout.sessions.create");
  });

  it("keeps Stripe webhook as server-side subscription materializer", () => {
    expect(webhook).toContain("stripe.webhooks.constructEvent");
    expect(webhook).toContain(".from('user_subscriptions')");
    expect(webhook).toContain(".update(subscriptionPayload)");
    expect(webhook).toContain(".insert(subscriptionPayload)");
  });
});
