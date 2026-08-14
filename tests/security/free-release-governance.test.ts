import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  governanceFingerprint,
  validateFreeReleaseGovernance,
  validateRemoteRecoveryFreshness,
} from "../../scripts/security/validate-free-release-governance.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const canonicalPolicy = JSON.parse(
  readFileSync(
    join(
      repoRoot,
      "docs/09-reference/governance/security/FREE_RELEASE_GOVERNANCE.json",
    ),
    "utf8",
  ),
);
const exceptionRegister = readFileSync(
  join(repoRoot, "docs/09-reference/governance/security/EXCEPTIONS.md"),
  "utf8",
);
const validNow = new Date(
  Date.parse(canonicalPolicy.controls.recovery.capturedAt) + 60_000,
);
const expiredRecoveryNow = new Date(
  Date.parse(canonicalPolicy.controls.recovery.validUntil) + 1_000,
);

function policyCopy() {
  return structuredClone(canonicalPolicy);
}

function issuesFor(policy: typeof canonicalPolicy, now = validNow) {
  return validateFreeReleaseGovernance(policy, { now }).issues;
}

describe("controlled Supabase Free release governance", () => {
  it("A: permits only the two specifically accepted exception scopes", () => {
    expect(
      validateFreeReleaseGovernance(policyCopy(), {
        now: validNow,
        exceptionRegister,
      }).issues,
    ).toEqual([]);
    const policy = policyCopy();
    policy.technicalGatePolicy.exceptionsCoverOnly.push(
      "GENERIC_TECHNICAL_CHANGE",
    );
    expect(issuesFor(policy)).toContain("GENERIC_EXCEPTION_SCOPE_FORBIDDEN");
  });

  it("B: rejects an expired active exception", () => {
    const policy = policyCopy();
    policy.exceptions[0].validUntil = "2026-08-10";
    expect(issuesFor(policy)).toContain(
      "EXPIRED_EXCEPTION:EXC-2026-08-11-AUTH-HIBP-FREE-PLAN",
    );
  });

  it("C: rejects missing canonical human owner", () => {
    const policy = policyCopy();
    policy.owner.name = "";
    expect(issuesFor(policy)).toContain("GOVERNANCE_OWNER_REQUIRED");
  });

  it("D: rejects missing recovery evidence", () => {
    const policy = policyCopy();
    delete policy.controls.recovery;
    expect(issuesFor(policy)).toContain("RECOVERY_SNAPSHOT_REQUIRED");
  });

  it("E: rejects a stale recovery snapshot", () => {
    expect(issuesFor(policyCopy(), expiredRecoveryNow)).toContain(
      "RECOVERY_SNAPSHOT_STALE",
    );
  });

  it("F: rejects recovery without off-device readback verification", () => {
    const policy = policyCopy();
    policy.controls.recovery.offDevice.readbackHashMatch = false;
    expect(issuesFor(policy)).toContain("OFF_DEVICE_RECOVERY_NOT_VERIFIED");
  });

  it("G: keeps native HIBP explicitly unavailable on the Free plan", () => {
    expect(policyCopy().controls.hibp.nativeControl).toBe(
      "HIBP_UNAVAILABLE_ON_PLAN",
    );
    const policy = policyCopy();
    policy.controls.hibp.nativeControl = "CONTROL_IMPLEMENTED";
    expect(issuesFor(policy)).toContain("HIBP_STATE_MUST_REMAIN_UNAVAILABLE");
  });

  it("H: rejects a new or changed material PostGIS finding", () => {
    const policy = policyCopy();
    policy.controls.postgis.observedMaterialState.extensions[2].version =
      "3.4.0";
    expect(issuesFor(policy)).toContain(
      "POSTGIS_GOVERNANCE_REASSESSMENT_REQUIRED",
    );
    policy.controls.postgis.acceptedStateSha256 = governanceFingerprint(
      policy.controls.postgis.observedMaterialState,
    );
    policy.controls.postgis.newMaterialFindings.push("NEW_HIGH_FINDING");
    expect(issuesFor(policy)).toContain("POSTGIS_NEW_MATERIAL_FINDING");
  });

  it("I: never lets a generic exception override technical gates", () => {
    const policy = policyCopy();
    policy.release.technicalGateOverride = true;
    policy.technicalGatePolicy.genericTechnicalOverride = true;
    expect(issuesFor(policy)).toEqual(
      expect.arrayContaining([
        "TECHNICAL_GATE_OVERRIDE_FORBIDDEN",
        "GENERIC_TECHNICAL_OVERRIDE_FORBIDDEN",
      ]),
    );
  });
});

describe("remote recovery freshness", () => {
  function matchingRemoteEvidence() {
    return structuredClone(canonicalPolicy.controls.recovery.remoteState);
  }

  it("A: passes when snapshot 344 matches remote 344", () => {
    const result = validateRemoteRecoveryFreshness(
      policyCopy(),
      matchingRemoteEvidence(),
      { operation: "mutable" },
    );
    expect(result.ok).toBe(true);
    expect(result.state).toBe("REMOTE_RECOVERY_FRESHNESS_GATE_PASS");
  });

  it("B: fails when snapshot 339 is compared with remote 344", () => {
    const policy = policyCopy();
    policy.controls.recovery.remoteState.migrationCount = 339;
    const result = validateRemoteRecoveryFreshness(
      policy,
      matchingRemoteEvidence(),
      { operation: "mutable" },
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        "REMOTE_MIGRATION_COUNT_CHANGED",
        "FRESH_RECOVERY_REQUIRED",
      ]),
    );
  });

  it("C: fails when latest migration differs", () => {
    const remote = matchingRemoteEvidence();
    remote.latestMigration = "20260810151942";
    expect(
      validateRemoteRecoveryFreshness(policyCopy(), remote, {
        operation: "mutable",
      }).issues,
    ).toContain("REMOTE_LATEST_MIGRATION_CHANGED");
  });

  it("D: local NO_KNOWN declaration cannot override migration drift", () => {
    const policy = policyCopy();
    policy.controls.recovery.localDeclaration.sourceStateMutationAttestation =
      "NO_KNOWN_MATERIAL_CHANGE";
    const remote = matchingRemoteEvidence();
    remote.migrationCount += 1;
    expect(
      validateRemoteRecoveryFreshness(policy, remote, {
        operation: "mutable",
      }).issues,
    ).toEqual(
      expect.arrayContaining([
        "REMOTE_MIGRATION_COUNT_CHANGED",
        "FRESH_RECOVERY_REQUIRED",
      ]),
    );
  });

  it("E: local gate still rejects an expired snapshot", () => {
    expect(issuesFor(policyCopy(), expiredRecoveryNow)).toContain(
      "RECOVERY_SNAPSHOT_STALE",
    );
  });

  it("F: local gate rejects missing off-device evidence", () => {
    const policy = policyCopy();
    policy.controls.recovery.offDevice.status = "MISSING";
    expect(issuesFor(policy)).toContain("OFF_DEVICE_RECOVERY_NOT_VERIFIED");
  });

  it("G: detects Auth and Storage changes and applies canonical fail-closed policy", () => {
    const authRemote = matchingRemoteEvidence();
    authRemote.authUsers += 1;
    expect(
      validateRemoteRecoveryFreshness(policyCopy(), authRemote, {
        operation: "mutable",
      }).issues,
    ).toEqual(
      expect.arrayContaining([
        "REMOTE_AUTH_STATE_CHANGED_SINCE_RECOVERY",
        "FRESH_RECOVERY_REQUIRED",
      ]),
    );

    const storageRemote = matchingRemoteEvidence();
    storageRemote.storageTotalBytes += 1;
    expect(
      validateRemoteRecoveryFreshness(policyCopy(), storageRemote, {
        operation: "mutable",
      }).issues,
    ).toEqual(
      expect.arrayContaining([
        "REMOTE_STORAGE_STATE_CHANGED_SINCE_RECOVERY",
        "FRESH_RECOVERY_REQUIRED",
      ]),
    );
  });

  it("H: fails closed without remote evidence for a mutable operation", () => {
    expect(
      validateRemoteRecoveryFreshness(policyCopy(), undefined, {
        operation: "mutable",
      }).issues,
    ).toEqual(
      expect.arrayContaining([
        "REMOTE_RECOVERY_EVIDENCE_REQUIRED",
        "FRESH_RECOVERY_REQUIRED",
      ]),
    );
  });

  it("I: local validation explicitly reports remote freshness as not proven", () => {
    const local = validateFreeReleaseGovernance(policyCopy(), {
      now: validNow,
    });
    expect(local.ok).toBe(true);
    expect(local.states.remoteFreshness).toBe("NOT_PROVEN_BY_LOCAL_VALIDATION");
    expect(local.states.remoteFreshness).not.toBe(
      "REMOTE_RECOVERY_FRESHNESS_GATE_PASS",
    );
  });
});
