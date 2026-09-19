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
  variableName: string,
  unavailableMessage: string,
  firstCostInvocation: string,
) {
  const doubleQuotedEnv = source.indexOf(`Deno.env.get("${envName}")`);
  const singleQuotedEnv = source.indexOf(`Deno.env.get('${envName}')`);
  const envRead = Math.max(doubleQuotedEnv, singleQuotedEnv);

  const doubleQuotedDefault = source.indexOf('?? "false"', envRead);
  const singleQuotedDefault = source.indexOf("?? 'false'", envRead);
  const defaultFalse = Math.max(doubleQuotedDefault, singleQuotedDefault);

  const gateCheck = source.indexOf(`if (!${variableName})`, defaultFalse);
  const unavailable = source.indexOf(unavailableMessage, gateCheck);
  const costInvocation = source.indexOf(firstCostInvocation, gateCheck);

  expect(envRead).toBeGreaterThanOrEqual(0);
  expect(defaultFalse).toBeGreaterThan(envRead);
  expect(gateCheck).toBeGreaterThan(defaultFalse);
  expect(unavailable).toBeGreaterThan(gateCheck);
  expect(costInvocation).toBeGreaterThan(unavailable);
}

describe("MVP paused cost backends", () => {
  it("keeps public billing paused for the MVP", () => {
    expect(launchScope).toMatch(/billing:\s*false/);
  });

  it("keeps Stripe checkout fail-closed behind a private backend rollout flag", () => {
    expectPrivateFailClosedRolloutGate(
      billingCheckout,
      "BILLING_CHECKOUT_ROLLOUT_ENABLED",
      "BILLING_CHECKOUT_ROLLOUT_ENABLED",
      "Billing checkout is temporarily unavailable",
      "const session = await stripe.checkout.sessions.create",
    );
  });

  it("keeps Replicate Try-On fail-closed behind a private backend rollout flag", () => {
    expectPrivateFailClosedRolloutGate(
      tryOnGenerate,
      "TRYON_ROLLOUT_ENABLED",
      "TRYON_ROLLOUT_ENABLED",
      "Virtual Try-On is temporarily unavailable",
      "const imageRef = await callReplicateTryOn",
    );
  });

  it("does not use a public VITE flag as the server-side cost authority", () => {
    expect(billingCheckout).not.toContain("VITE_");
    expect(tryOnGenerate).not.toContain("VITE_");
  });
});
