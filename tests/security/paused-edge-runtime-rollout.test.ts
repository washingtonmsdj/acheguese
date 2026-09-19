import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("paused Edge runtime rollout", () => {
  it("keeps Billing checkout fail-closed on both UI and Edge runtime", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const productionEnv = read(".env.production");
    const checkout = read(
      "supabase/functions/billing-create-checkout/index.ts",
    );

    expect(launchScope).toContain("billing: false");
    expect(productionEnv).toMatch(
      /^BILLING_CHECKOUT_ROLLOUT_ENABLED=false$/m,
    );
    expect(checkout).toContain(
      "Deno.env.get('BILLING_CHECKOUT_ROLLOUT_ENABLED')",
    );
    expect(checkout).toContain("if (!BILLING_CHECKOUT_ROLLOUT_ENABLED)");
    expect(checkout).toContain(
      "Billing checkout is temporarily unavailable",
    );

    const gate = checkout.indexOf("if (!BILLING_CHECKOUT_ROLLOUT_ENABLED)");
    const stripeMutation = checkout.indexOf("stripe.checkout.sessions.create");
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(stripeMutation).toBeGreaterThan(gate);
  });

  it("keeps Virtual Try-On fail-closed on both UI and Edge runtime", () => {
    const productionEnv = read(".env.production");
    const tryOn = read("supabase/functions/tryon-generate/index.ts");

    expect(productionEnv).toMatch(
      /^VITE_FEATURE_AI_VIRTUAL_TRYON=false$/m,
    );
    expect(productionEnv).toMatch(/^TRYON_ROLLOUT_ENABLED=false$/m);
    expect(tryOn).toContain('Deno.env.get("TRYON_ROLLOUT_ENABLED")');
    expect(tryOn).toContain("if (!TRYON_ROLLOUT_ENABLED)");
    expect(tryOn).toContain(
      "Virtual Try-On is temporarily unavailable",
    );

    const gate = tryOn.indexOf("if (!TRYON_ROLLOUT_ENABLED)");
    const providerCall = tryOn.indexOf('replicateRequest("/predictions"');
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(providerCall).toBeGreaterThan(gate);
  });
});
