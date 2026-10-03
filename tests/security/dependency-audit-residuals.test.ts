import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const manifest = JSON.parse(
  readFileSync(
    join(ROOT, "docs/09-reference/governance/security/DEPENDENCY_AUDIT_RESIDUALS.json"),
    "utf8",
  ),
);
const workflow = readFileSync(
  join(ROOT, ".github/workflows/security-scan.yml"),
  "utf8",
);
const validator = readFileSync(
  join(ROOT, "tools/security/validate-npm-audit-residuals.mjs"),
  "utf8",
);

describe("dependency audit governed residual", () => {
  it("keeps the exception exact, temporary and dev-only", () => {
    expect(manifest.schemaVersion).toBe("dependency-audit-residuals/v1");
    expect(manifest.residuals).toHaveLength(1);
    expect(manifest.residuals[0]).toMatchObject({
      id: "EXC-2026-10-02-BRACES-TAILWIND3-DEV-ONLY",
      package: "braces",
      installedVersion: "3.0.3",
      advisory: "GHSA-vfj7-8cjw-p6xm",
      severity: "high",
      scope: "development-only",
      productionAuditMustPass: true,
      validUntil: "2026-10-17",
    });
  });

  it("preserves a strict production audit and makes full-tree residual validation authoritative", () => {
    expect(workflow).toContain("npm audit --omit=dev --audit-level=moderate");
    expect(workflow).toContain("npm audit --audit-level=high --json > npm-audit-full.json");
    expect(workflow).toContain("validate-npm-audit-residuals.mjs npm-audit-full.json");
    expect(workflow).toContain("NPM_FULL_RESIDUAL_OUTCOME");
  });

  it("fails on advisory drift, package drift, expiry or production reachability", () => {
    expect(validator).toContain("Unexpected high/critical dependency findings");
    expect(validator).toContain("Residual package is not dev-only in lockfile");
    expect(validator).toContain("Expected braces advisory is not present");
    expect(validator).toContain("Dependency audit residual expired");
  });
});
