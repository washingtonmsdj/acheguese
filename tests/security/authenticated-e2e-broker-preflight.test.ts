import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const WORKFLOW = readFileSync(
  join(ROOT, ".github/workflows/ssot-tests.yml"),
  "utf8",
);
const PREFLIGHT = readFileSync(
  join(ROOT, "tools/release/preflight-authenticated-e2e-broker.ts"),
  "utf8",
);

describe("authenticated E2E broker preflight", () => {
  it("fails closed through the existing GitHub OIDC broker without exposing session material", () => {
    expect(PREFLIGHT).toContain("resolveGithubOidcEnvironment");
    expect(PREFLIGHT).toContain("signInFixtureViaGithubOidcBroker");
    expect(PREFLIGHT).toContain('requiredEnv("E2E_SUPABASE_URL")');
    expect(PREFLIGHT).toContain('requiredEnv("E2E_USER_EMAIL")');
    expect(PREFLIGHT).toContain('requiredEnv("E2E_USER_PASSWORD")');
    expect(PREFLIGHT).not.toContain("direct-password-grant");
    expect(PREFLIGHT).not.toContain("access_token");
    expect(PREFLIGHT).not.toContain("refresh_token");
    expect(PREFLIGHT).not.toContain("service_role");
  });

  it("runs once before browser installation and preserves the full authenticated smoke", () => {
    const preflight = WORKFLOW.indexOf("Preflight authenticated fixture broker");
    const browser = WORKFLOW.indexOf(
      "Install Playwright browser",
      WORKFLOW.indexOf("authenticated_account_e2e:"),
    );
    const smoke = WORKFLOW.indexOf(
      "Run authenticated Account and Business lifecycle E2E",
    );

    expect(preflight).toBeGreaterThan(
      WORKFLOW.indexOf("authenticated_account_e2e:"),
    );
    expect(preflight).toBeLessThan(browser);
    expect(browser).toBeLessThan(smoke);
    expect(WORKFLOW).toContain(
      "npx tsx tools/release/preflight-authenticated-e2e-broker.ts",
    );
    expect(WORKFLOW).toContain("npm run test:e2e:account-authenticated");
  });
});
