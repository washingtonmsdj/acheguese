import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  governanceFingerprint,
  validateFreeReleaseGovernance,
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
const validNow = new Date("2026-08-11T23:00:00.000Z");

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
    expect(
      issuesFor(policyCopy(), new Date("2026-08-12T21:26:38.000Z")),
    ).toContain("RECOVERY_SNAPSHOT_STALE");
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
