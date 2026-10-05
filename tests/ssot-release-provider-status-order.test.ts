import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const workflow = readFileSync(
  resolve(root, ".github/workflows/ssot-tests.yml"),
  "utf8",
);

function authenticatedReleaseJob(): string {
  return (
    workflow.match(
      /\n  authenticated_account_e2e:[\s\S]*?(?=\n  [a-zA-Z0-9_-]+:\n)/,
    )?.[0] ?? ""
  );
}

describe("production release authority order", () => {
  it("proves deployed runtime identity before consulting provider commit status", () => {
    const job = authenticatedReleaseJob();
    const identity = job.indexOf("- name: Wait for deployed runtime identity");
    const provider = job.indexOf("- name: Check production deployment status");

    expect(identity).toBeGreaterThanOrEqual(0);
    expect(provider).toBeGreaterThan(identity);
  });

  it("requires provider commit status only for an exact deployment", () => {
    const job = authenticatedReleaseJob();
    const providerStep =
      job.match(
        /- name: Check production deployment status[\s\S]*?(?=\n      - name:)/,
      )?.[0] ?? "";

    expect(providerStep).toContain(
      "if: steps.release_identity.outputs.mode == 'exact'",
    );
    expect(providerStep).toContain(
      "run: node tools/release/check-production-deployment-status.mjs",
    );
  });

  it("keeps release identity itself strict: only exact or equivalent fingerprints can proceed", () => {
    const waitScript = readFileSync(
      resolve(root, "tools/release/wait-for-production-release.mjs"),
      "utf8",
    );

    expect(waitScript).toContain(
      'if (match === "exact" || match === "equivalent")',
    );
    expect(waitScript).toContain(
      "Production release identity did not converge within",
    );
  });
});
