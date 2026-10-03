import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const contract = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "docs/09-reference/governance/privacy/LGPD_EXPORT_CERTIFICATION_CONTRACT.json",
    ),
    "utf8",
  ),
);
const handler = readFileSync(
  join(ROOT, "supabase/functions/user-export-data/index.ts"),
  "utf8",
);
const policy = readFileSync(
  join(ROOT, "supabase/functions/_shared/lgpdExportPolicy.ts"),
  "utf8",
);
const rollout = readFileSync(
  join(ROOT, "src/core/privacy/config/privacyRollout.ts"),
  "utf8",
);
const coverageTest = readFileSync(
  join(ROOT, "tests/security/lgpd-export-matrix-coverage.test.ts"),
  "utf8",
);
const heavyWorkflow = readFileSync(
  join(ROOT, ".github/workflows/certify-heavy-pr-auto.yml"),
  "utf8",
);

describe("LGPD export release certification contract", () => {
  it("separates complete source coverage from release promotion", () => {
    expect(contract.schemaVersion).toBe(
      "lgpd-export-certification-contract/v1",
    );
    expect(contract.sourceCoverageComplete).toBe(true);
    expect(contract.runtimeEnabled).toBe(false);
    expect(contract.releaseCertified).toBe(false);
    expect(contract.promotionAuthorized).toBe(false);
    expect(handler).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
    expect(rollout).toContain(
      "export const PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED = false;",
    );
  });

  it("requires the canonical integration and failure scenarios", () => {
    const ids = new Set(
      contract.requiredScenarios.map((entry: { id: string }) => entry.id),
    );
    for (const id of [
      "empty-subject",
      "multiple-profiles",
      "shared-row-redaction",
      "sent-messages-only",
      "required-section-failure",
      "section-overflow",
      "auth-user-unavailable",
      "secret-and-provider-redaction",
      "dpo-ledger-isolation",
      "audit-and-format-metadata",
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("requires exact-SHA and probe evidence before promotion", () => {
    expect(contract.evidenceRequired).toMatchObject({
      exactSourceSha: true,
      deployedRuntimeSha: true,
      edgeFunctionVersion: true,
      matrixVersion: true,
      testRunId: true,
      positiveProbe: true,
      negativeProbe: true,
      redactionProbe: true,
    });
    expect(contract.promotionRules).toMatchObject({
      implementationCompleteFlagMayChangeOnlyAfterAllEvidence: true,
      releaseCertifiedFlagMayChangeOnlyAfterAllEvidence: true,
      featureFlagMayEnableOnlyAfterReleaseCertified: true,
      productionDeployBeforeCertification: false,
      partialCertification: "forbidden",
    });
  });

  it("ratchets current fail-closed handler behavior", () => {
    expect(handler).toContain("EXPORT_SECTION_FAILED:");
    expect(policy).toContain("EXPORT_SECTION_TOO_LARGE:");
    expect(handler).toContain("EXPORT_AUTH_USER_UNAVAILABLE");
    expect(policy).toContain("export const MAX_ROWS_PER_SECTION = 50_000;");
    expect(coverageTest).toContain(".select('*')");
    expect(coverageTest).toContain('.select("*")');
    expect(coverageTest).toContain(".from('user_sessions')");
  });

  it("forbids promotion from source coverage alone", () => {
    expect(contract.forbidden).toEqual(
      expect.arrayContaining([
        "select-star",
        "silent-required-query-failure",
        "partial-export-on-required-section-error",
        "full-conversation-dump",
        "third-party-identifier-leak",
        "provider-token-export",
        "promote-on-source-coverage-alone",
        "production-only-certification",
      ]),
    );
  });

  it("is enforced by the Heavy LGPD gate", () => {
    expect(heavyWorkflow).toContain(
      "tests/security/lgpd-export-certification-contract.test.ts",
    );
  });
});