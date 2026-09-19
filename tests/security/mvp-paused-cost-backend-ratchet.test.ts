import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const launchScope = read("src/app/config/launchScope.ts");
const billingCheckout = read(
  "supabase/functions/billing-create-checkout/index.ts",
);
const tryOnGenerate = read("supabase/functions/tryon-generate/index.ts");

function expectPrivateFailClosedRolloutGate(
  source: string,
  envName: string,
  unavailableMessage: string,
  firstCostMarker: string,
) {
  const envRead = source.indexOf(`Deno.env.get("${envName}")`);
  const envReadSingleQuote = source.indexOf(`Deno.env.get('${envName}')`);
  const gateDeclaration = Math.max(envRead, envReadSingleQuote);
  const defaultFalse = source.indexOf('?? "false"');
  const defaultFalseSingleQuote = source.indexOf("?? 'false'");
  const defaultIndex = Math.max(defaultFalse, defaultFalseSingleQuote);
  const gateCheck = source.indexOf("if (!", gateDeclaration);
  const unavailable = source.indexOf(unavailableMessage);
  const costMarker = source.indexOf(firstCostMarker);

  expect(gateDeclaration).toBeGreaterThanOrEqual(0);
  expect(defaultIndex).toBeGreaterThan(gateDeclaration);
  expect(gateCheck).toBeGreaterThan(defaultIndex);
  expect(unavailable).toBeGreaterThan(gateCheck);
  expect(costMarker).toBeGreaterThan(unavailable);
}

describe("MVP paused cost backends", () => {
  it("keeps public billing paused for the MVP", () => {
    expect(launchScope).toMatch(/billing:\s*false/);
  });

  it("keeps Stripe checkout fail-closed behind a private backend rollout flag", () => {
    expectPrivateFailClosedRolloutGate(
      billingCheckout,
      "BILLING_CHECKOUT_ROLLOUT_ENABLED",
      "Billing checkout is temporarily unavailable",
      "stripe.checkout.sessions.create",
    );
  });

  it("keeps Replicate Try-On fail-closed behind a private backend rollout flag", () => {
    expectPrivateFailClosedRolloutGate(
      tryOnGenerate,
      "TRYON_ROLLOUT_ENABLED",
      "Virtual Try-On is temporarily unavailable",
      'replicateRequest("/predictions"',
    );
  });

  it("does not use a public VITE flag as the server-side cost authority", () => {
    expect(billingCheckout).not.toContain("VITE_");
    expect(tryOnGenerate).not.toContain("VITE_");
  });
});
