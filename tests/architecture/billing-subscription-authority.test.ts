import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const businessSubscription = read("src/core/billing/SubscriptionService.ts");
const checkout = read("supabase/functions/billing-create-checkout/index.ts");
const webhook = read("supabase/functions/billing-webhook/index.ts");
const writeAuthorityMigration = read(
  "supabase/migrations/20260829173833_harden_user_subscription_write_authority.sql",
);

describe("Billing subscription authority", () => {
  it("keeps billing as the only core subscription namespace", () => {
    expect(existsSync(resolve(root, "src/core/subscription"))).toBe(false);
  });

  it("keeps the browser business subscription service read-only", () => {
    expect(businessSubscription).toContain('.from<CanonicalBusinessSubscriptionRow>("user_subscriptions")');
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
