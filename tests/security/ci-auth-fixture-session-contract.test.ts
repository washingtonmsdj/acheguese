import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const edgeFunction = read("supabase/functions/ci-auth-fixture-session/index.ts");
const config = read("supabase/config.toml");
const workflow = read(".github/workflows/ssot-tests.yml");
const deployWorkflow = read(".github/workflows/supabase-ci-auth-fixture-session-deploy.yml");
const authHelper = read("tests/e2e/helpers/auth.ts");
const oidcBroker = read("tests/e2e/helpers/fixtureAuthGithubOidcBroker.ts");
const policy = JSON.parse(
  read("docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json"),
) as {
  noJwtAllowlist: Record<
    string,
    { kind: string; label: string; requiredPatterns: string[] }
  >;
};

describe("CI Auth fixture session boundary", () => {
  it("keeps the broker behind GitHub OIDC claims instead of a long-lived CI secret", () => {
    expect(config).toContain("[functions.ci-auth-fixture-session]");
    expect(config).toMatch(
      /\[functions\.ci-auth-fixture-session\]\s*\nverify_jwt = false/,
    );

    expect(edgeFunction).toContain("createRemoteJWKSet");
    expect(edgeFunction).toContain("jwtVerify");
    expect(edgeFunction).toContain(
      '"https://token.actions.githubusercontent.com"',
    );
    expect(edgeFunction).toContain('EXPECTED_REPOSITORY_ID = "1211499732"');
    expect(edgeFunction).toContain(
      '"washingtonmsdj/acheguese/.github/workflows/ssot-tests.yml@refs/heads/main"',
    );
    expect(edgeFunction).toContain('EXPECTED_REF = "refs/heads/main"');
    expect(edgeFunction).toContain('EXPECTED_EVENT = "push"');
    expect(edgeFunction).toContain(
      'EXPECTED_RUNNER_ENVIRONMENT = "github-hosted"',
    );
    expect(edgeFunction).toContain("claims.sha !== expectedSha");
    expect(edgeFunction).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("only returns sessions for the canonical private E2E fixture provenance", () => {
    expect(edgeFunction).toContain(
      'FIXTURE_MARKER = "account-authenticated-e2e"',
    );
    expect(edgeFunction).toContain('FIXTURE_VERSION = "1"');
    expect(edgeFunction).toContain(
      "data.user?.app_metadata?.acheguese_fixture",
    );
    expect(edgeFunction).toContain(
      "data.user?.app_metadata?.fixture_version",
    );
    expect(edgeFunction).not.toContain(
      "data.user?.user_metadata?.acheguese_fixture",
    );
    expect(edgeFunction).toContain("signInWithPassword");
    expect(edgeFunction).toContain("rateLimitMiddleware");
    expect(edgeFunction).toContain('"fixture_credentials_rejected"');
    expect(edgeFunction).toContain('"fixture_account_unavailable"');
    expect(edgeFunction).toContain('"auth_upstream_unavailable"');
    expect(edgeFunction).toContain('"fixture_auth_failed"');
    expect(edgeFunction).toContain("return fixtureAuthFailureResponse(req, failure)");
    expect(edgeFunction).toContain("failure.status === 503");
    expect(edgeFunction).toContain(
      'return unauthorized(req, "fixture_provenance_rejected")',
    );
    expect(edgeFunction).toContain(
      'details: { reason: "github_oidc_rejected" }',
    );
    expect(edgeFunction).toContain("return unauthorized(req);");
  });

  it("forces the post-merge production smoke onto the OIDC broker", () => {
    const normalized = workflow.replace(/\r\n/g, "\n");
    const job =
      normalized.match(
        /\n  authenticated_account_e2e:[\s\S]*?(?=\n  [a-zA-Z0-9_-]+:\n)/,
      )?.[0] ?? "";

    expect(job).toContain("id-token: write");
    expect(job).toContain("contents: read");
    expect(job).toContain("E2E_AUTH_TRANSPORT: github-oidc-broker");
    expect(authHelper).toContain('authTransport === "github-oidc-broker"');
    expect(authHelper).toContain("direct Auth fallback is forbidden");
    expect(oidcBroker).toContain("ACTIONS_ID_TOKEN_REQUEST_URL");
    expect(oidcBroker).toContain("ACTIONS_ID_TOKEN_REQUEST_TOKEN");
    expect(oidcBroker).toContain("GITHUB_SHA");
    expect(oidcBroker).toContain("GITHUB_REPOSITORY_ID");
    expect(oidcBroker).toContain("GITHUB_WORKFLOW_REF");
    expect(oidcBroker).toContain("RUNNER_ENVIRONMENT");
    expect(oidcBroker).toContain("GitHub OIDC token claim mismatch");
    expect(oidcBroker).toContain("ci-auth-fixture-session");
  });

  it("keeps the no-JWT exception explicitly governed as an external OIDC broker", () => {
    const entry = policy.noJwtAllowlist["ci-auth-fixture-session"];
    expect(entry).toBeDefined();
    expect(entry.kind).toBe("external-oidc-broker");
    expect(entry.label).toContain("GitHub Actions OIDC");
    expect(entry.requiredPatterns.length).toBeGreaterThan(8);
  });

  it("deploys the broker only from an exact main SHA with remote verification", () => {
    expect(deployWorkflow).toContain("Supabase CI Auth Fixture Session Deploy");
    expect(deployWorkflow).toContain('branches: [main]');
    expect(deployWorkflow).toContain('"supabase/functions/ci-auth-fixture-session/**"');
    expect(deployWorkflow).toContain('"supabase/functions/_shared/security.ts"');
    expect(deployWorkflow).toContain("workflow_dispatch:");
    expect(deployWorkflow).toContain("contents: read");
    expect(deployWorkflow).toContain("runs-on: ubuntu-latest");
    expect(deployWorkflow).toContain(
      'SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}',
    );
    expect(deployWorkflow).toContain('ref: ${{ steps.target.outputs.sha }}');
    expect(deployWorkflow).toContain("persist-credentials: false");
    expect(deployWorkflow).toContain('SUPABASE_CLI_VERSION: "2.115.0"');
    expect(deployWorkflow).toContain(
      "functions deploy ci-auth-fixture-session --project-ref $env:SUPABASE_PROJECT_REF --use-api",
    );
    expect(deployWorkflow).toContain(
      "Remote ci-auth-fixture-session verify_jwt is not false.",
    );
    expect(deployWorkflow).toContain("createRemoteJWKSet");
    expect(deployWorkflow).toContain("jwtVerify");
    expect(deployWorkflow).toContain(
      'details: { reason: "github_oidc_rejected" }',
    );
    expect(deployWorkflow).not.toContain("--no-verify-jwt");
    expect(deployWorkflow).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
