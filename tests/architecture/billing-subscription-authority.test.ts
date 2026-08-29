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
const businessSubscription = read("src/core/billing/BusinessSubscriptionService.ts");
const legacyBusinessBridge = read("src/core/billing/SubscriptionService.ts");
const userSubscription = read("src/core/billing/services/SubscriptionService.ts");
const subscriptionStatus = read("src/core/billing/services/SubscriptionStatusService.ts");
const entitlementResolver = read("src/core/billing/services/EntitlementResolver.ts");
const billingIndex = read("src/core/billing/index.ts");
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

const directTableWrite = (table: string) =>
  new RegExp(
    `\\.from(?:<[^;]{0,500}>)?\\(\\s*["']${table}["']\\s*\\)\\s*\\.(?:insert|update|upsert|delete)\\s*\\(`,
    "m",
  );

describe("Billing subscription authority", () => {
  it("keeps billing as the only core subscription namespace", () => {
    expect(existsSync(resolve(root, "src/core/subscription"))).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/billing/services/SubscriptionContractService.ts")),
    ).toBe(false);
  });

  it("retires orphan browser catalog administration surfaces", () => {
    expect(
      existsSync(resolve(root, "src/core/billing/services/CatalogAdminService.ts")),
    ).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/billing/services/CatalogVersionService.ts")),
    ).toBe(false);
    expect(
      existsSync(resolve(root, "src/core/billing/services/ImpactAnalysisService.ts")),
    ).toBe(false);
    expect(existsSync(resolve(root, "src/core/billing/types/admin.types.ts"))).toBe(false);
  });

  it("names business subscription authority explicitly and keeps old path bridge-only", () => {
    expect(businessSubscription).toContain("export class BusinessSubscriptionService");
    expect(billingIndex).toContain("export * from './BusinessSubscriptionService'");
    expect(legacyBusinessBridge).toContain(
      'BusinessSubscriptionService as SubscriptionService',
    );
    expect(legacyBusinessBridge).not.toContain("@/integrations/supabase");
    expect(legacyBusinessBridge).not.toContain("user_subscriptions");
  });

  it("keeps browser runtime free of direct user_subscriptions writes", () => {
    const offenders = runtimeSources
      .filter((path) => directTableWrite("user_subscriptions").test(readFileSync(path, "utf8")))
      .map((path) => path.slice(root.length + 1));

    expect(offenders).toEqual([]);
  });

  it("keeps canonical catalog tables read-only in browser runtime", () => {
    const catalogTables = [
      "commercial_catalog_version",
      "catalog_item",
      "catalog_entitlement_policy",
      "catalog_eligibility_rule",
      "catalog_pricing_policy",
    ];

    const offenders = runtimeSources.flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return catalogTables
        .filter((table) => directTableWrite(table).test(source))
        .map((table) => `${path.slice(root.length + 1)} -> ${table}`);
    });

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

  it("scopes user subscription reads and prefers canonical status_v2", () => {
    expect(userSubscription).toContain(".eq('subscription_scope', 'user')");
    expect(userSubscription).toContain("status_v2");
    expect(userSubscription).toContain(".order('updated_at'");
    expect(subscriptionStatus).toContain("subscription.status_v2");
  });

  it("uses one entitlement baseline behind published catalog resolution", () => {
    expect(billingPlanService).toContain("getBaselineEntitlements");
    expect(entitlementResolver).toContain("BillingPlanService.getPlanByCode");
    expect(entitlementResolver).toContain("getBaselineEntitlements");
    expect(entitlementResolver).not.toContain("DEFAULT_FREE_ENTITLEMENTS");
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
