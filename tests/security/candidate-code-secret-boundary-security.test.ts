import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const ssotWorkflow = read(".github/workflows/ssot-tests.yml");
const heavyPrWorkflow = read(".github/workflows/certify-heavy-pr-auto.yml");
const heavyManualWorkflow = read(".github/workflows/certify-heavy.yml");

describe("candidate-controlled certification secret boundary", () => {
  it("keeps authenticated SSOT E2E on the trusted main ref", () => {
    const job = ssotWorkflow.slice(
      ssotWorkflow.indexOf("  authenticated_account_e2e:"),
      ssotWorkflow.indexOf("  regression-check:"),
    );

    expect(job).toContain("if: github.ref == 'refs/heads/main'");
    expect(job).toContain("secrets.E2E_USER_EMAIL");
    expect(job).toContain("secrets.E2E_USER_PASSWORD");
    expect(ssotWorkflow).toContain(
      'if [ "${{ needs.authenticated_account_e2e.result }}" != "skipped" ]; then',
    );
    expect(ssotWorkflow).toContain(
      'elif [ "${{ needs.authenticated_account_e2e.result }}" != "success" ]; then',
    );
  });

  it("does not expose account or Preview bypass secrets to the PR certification job", () => {
    expect(heavyPrWorkflow).not.toContain("secrets.E2E_USER_EMAIL");
    expect(heavyPrWorkflow).not.toContain("secrets.E2E_USER_PASSWORD");
    expect(heavyPrWorkflow).not.toContain(
      "secrets.VERCEL_AUTOMATION_BYPASS_SECRET",
    );
    expect(heavyPrWorkflow).toContain(
      "Authenticated logout E2E=deferred to trusted manual certification",
    );
  });

  it("restricts manual secret-bearing certification to a SHA contained in main", () => {
    const ancestryCheck = heavyManualWorkflow.indexOf(
      "/compare/$targetSha...main",
    );
    const checkout = heavyManualWorkflow.indexOf("Checkout attested SHA only");
    const secretUse = heavyManualWorkflow.indexOf("secrets.E2E_USER_EMAIL");

    expect(ancestryCheck).toBeGreaterThan(-1);
    expect(heavyManualWorkflow).toContain(
      '$comparison.status -notin @("ahead", "identical")',
    );
    expect(heavyManualWorkflow).toContain(
      "$mainSha = [string]$comparison.head_commit.sha",
    );
    expect(checkout).toBeGreaterThan(ancestryCheck);
    expect(secretUse).toBeGreaterThan(checkout);
    expect(heavyManualWorkflow).toContain(
      "tests/e2e/logout-authenticated.spec.ts",
    );
  });
});
