import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const script = readFileSync(
  resolve(root, "tools/security/supabase-edge-runtime-auth-drift.mjs"),
  "utf8",
);
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");
const policy = readFileSync(
  resolve(
    root,
    "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
  ),
  "utf8",
);

describe("remote Edge runtime auth drift preflight", () => {
  it("uses the official Supabase CLI and never a raw management endpoint", () => {
    expect(script).toContain("execFileSync(");
    expect(script).toContain("'supabase'");
    expect(script).toContain(
      "['functions', 'list', '--project-ref', projectRef, '--output', 'json']",
    );
    expect(script).toContain("SUPABASE_ACCESS_TOKEN: accessToken");
    expect(script).not.toContain("api.supabase.com");
    expect(script).not.toMatch(/\bfetch\s*\(/);
    expect(script).not.toContain("accessToken }));");
  });

  it("pins the remote project to the versioned project_id", () => {
    expect(config).toContain('project_id = "xhdowzacfujckjelqhtd"');
    expect(script).toContain("Project ref recusado:");
    expect(script).toContain("difere do project_id versionado");
  });

  it("fails on deployed verify_jwt drift and unclassified no-jwt functions", () => {
    expect(script).toContain("VERIFY_JWT_DRIFT");
    expect(script).toContain("REMOTE_NO_JWT_NOT_ALLOWLISTED");
    expect(script).toContain("REMOTE_FUNCTION_WITHOUT_CONFIG");
    expect(script).toContain("REMOTE_VERIFY_JWT_UNREADABLE");
    expect(script).toContain("policy.noJwtAllowlist");
  });

  it("reports configured-but-not-deployed functions and can make existence strict", () => {
    expect(script).toContain("configuredNotDeployed");
    expect(script).toContain("--strict-existence");
    expect(script).toContain("CONFIGURED_FUNCTION_NOT_DEPLOYED");
    expect(script).toContain("INFO configured-not-deployed");
  });

  it("keeps sitemap explicitly classified as a public no-jwt endpoint", () => {
    expect(config).toMatch(
      /\[functions\.sitemap\][\s\S]*?verify_jwt\s*=\s*false/,
    );
    expect(policy).toMatch(
      /"sitemap"\s*:\s*\{[\s\S]*?"kind"\s*:\s*"public-read"/,
    );
  });

  it("fails closed on CLI, config, policy, or token errors", () => {
    expect(script).toContain("EDGE_RUNTIME_AUTH_DRIFT_ERROR");
    expect(script).toContain("EDGE_RUNTIME_AUTH_DRIFT_BLOCKED");
    expect(script).toContain("if (!report.ready) process.exitCode = 1");
    expect(script).toContain("Token Supabase ausente");
    expect(script).toContain("Supabase CLI retornou JSON invalido");
  });
});
