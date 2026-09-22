import { describe, expect, it } from "vitest";
import {
  RELEASE_IDENTITY_SCHEMA_VERSION,
  buildReleaseIdentity,
  classifyReleaseIdentityMatch,
  isDeployRelevantReleasePath,
  listTrackedDeployEntries,
} from "../../tools/release/release-identity.mjs";

describe("production release identity", () => {
  it("uses the same deploy relevance boundary as the Vercel ignored-build policy", () => {
    expect(isDeployRelevantReleasePath("src/main.tsx")).toBe(true);
    expect(isDeployRelevantReleasePath("vercel.json")).toBe(true);
    expect(isDeployRelevantReleasePath("tools/release/release-identity.mjs")).toBe(true);

    expect(isDeployRelevantReleasePath(".github/workflows/ssot-tests.yml")).toBe(false);
    expect(isDeployRelevantReleasePath("tests/e2e/account-authenticated.spec.ts")).toBe(false);
    expect(isDeployRelevantReleasePath("docs/08-roadmap/NEXT-STEPS.md")).toBe(false);
  });

  it("builds a deterministic identity from tracked deploy-relevant Git blobs", () => {
    const identity = buildReleaseIdentity("a".repeat(40));
    expect(identity).toMatchObject({
      schemaVersion: RELEASE_IDENTITY_SCHEMA_VERSION,
      commitSha: "a".repeat(40),
    });
    expect(identity.deployFingerprint).toMatch(/^[0-9a-f]{64}$/);

    const entries = listTrackedDeployEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.path === "src/main.tsx")).toBe(true);
    expect(entries.some((entry) => entry.path.startsWith("tests/"))).toBe(false);
    expect(entries.some((entry) => entry.path.startsWith(".github/"))).toBe(false);
  });

  it("distinguishes exact deploys from runtime-equivalent non-deploy commits", () => {
    const fingerprint = "b".repeat(64);
    const expected = {
      schemaVersion: RELEASE_IDENTITY_SCHEMA_VERSION,
      commitSha: "a".repeat(40),
      deployFingerprint: fingerprint,
    };

    expect(classifyReleaseIdentityMatch(expected, expected)).toBe("exact");
    expect(
      classifyReleaseIdentityMatch(expected, {
        ...expected,
        commitSha: "c".repeat(40),
      }),
    ).toBe("equivalent");
    expect(
      classifyReleaseIdentityMatch(expected, {
        ...expected,
        deployFingerprint: "d".repeat(64),
      }),
    ).toBe("mismatch");
  });
});
