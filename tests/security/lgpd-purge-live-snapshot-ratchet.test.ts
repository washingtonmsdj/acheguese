import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readJson(relative: string) {
  return JSON.parse(readFileSync(join(ROOT, relative), "utf8"));
}

describe("LGPD purge live snapshot ratchet", () => {
  const policy = readJson(
    "docs/09-reference/governance/privacy/LGPD_PURGE_POLICY.json",
  );
  const matrix = readJson(
    "docs/09-reference/governance/privacy/LGPD_PURGE_MATRIX.json",
  );

  it("keeps rollout fail-closed while recording the live deletion foundation", () => {
    expect(policy.catalogSnapshotDate).toBe("2026-10-02");
    expect(policy.rolloutReady).toBe(false);
    expect(matrix.implementationComplete).toBe(false);
    expect(policy.remoteFoundation).toMatchObject({
      accountDeletionRequestsExists: true,
      requestRpcExists: true,
      cancelRpcExists: true,
      pgCronInstalled: true,
      pgNetInstalled: true,
    });
  });

  it("records the current profile FK fanout without hiding required blockers", () => {
    expect(policy.profileDeletionFanout.snapshot).toEqual({
      totalForeignKeys: 172,
      cascade: 114,
      noAction: 5,
      restrict: 3,
      setNull: 50,
      setNullOnNotNullColumn: 1,
    });

    const hardBlockers = new Map(
      policy.profileDeletionFanout.hardBlockers.map((entry: { column: string }) => [
        entry.column,
        entry,
      ]),
    );
    expect(hardBlockers.get("public.vagas.owner_profile_id")).toMatchObject({
      onDelete: "NO ACTION",
      nullable: false,
      classification: "schema-or-retention-resolution-required",
    });
    expect(policy.profileDeletionFanout.nullableNoActionReferences).not.toContain(
      "public.vagas.owner_profile_id",
    );
  });

  it("keeps the blocking matrix classified but marks vagas as required", () => {
    expect(matrix.observedAt).toBe("2026-10-02");
    expect(matrix.snapshot).toMatchObject({
      blockingReferenceCount: 28,
      authUsersBlockingReferenceCount: 20,
      profilesBlockingReferenceCount: 8,
      nullableBlockingReferenceCount: 24,
      requiredBlockingReferenceCount: 4,
      classifiedReferenceCount: 28,
      unclassifiedReferenceCount: 0,
    });

    expect(
      matrix.blockingReferences.find(
        (entry: { constraint: string }) =>
          entry.constraint === "vagas_owner_profile_id_fkey",
      ),
    ).toMatchObject({
      source: "public.vagas",
      target: "public.profiles",
      deleteAction: "NO ACTION",
      nullable: false,
      decision: "block-purge",
    });
  });
});
