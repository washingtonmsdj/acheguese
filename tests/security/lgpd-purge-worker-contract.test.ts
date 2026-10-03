import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

const contract = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/09-reference/governance/privacy/LGPD_PURGE_WORKER_CONTRACT.json",
    ),
    "utf8",
  ),
) as {
  schemaVersion: string;
  runtimeEnabled: boolean;
  deployAuthorized: boolean;
  schedulerAuthorized: boolean;
  claim: Record<string, unknown>;
  idempotency: Record<string, unknown>;
  failureHandling: Record<string, unknown>;
  orderedPhases: string[];
  hardPreconditions: Record<string, boolean>;
  forbidden: string[];
};

const policy = JSON.parse(
  readFileSync(
    join(root, "docs/09-reference/governance/privacy/LGPD_PURGE_POLICY.json"),
    "utf8",
  ),
) as {
  rolloutReady: boolean;
  unresolved: Array<{ id: string; reason: string }>;
};

const matrix = JSON.parse(
  readFileSync(
    join(root, "docs/09-reference/governance/privacy/LGPD_PURGE_MATRIX.json"),
    "utf8",
  ),
) as {
  implementationComplete: boolean;
  snapshot: {
    unclassifiedReferenceCount: number;
    decisionCounts: Record<string, number>;
  };
};

const config = readFileSync(join(root, "supabase/config.toml"), "utf8");

describe("LGPD purge worker safety contract", () => {
  it("keeps the irreversible worker source-only and rollout-disabled", () => {
    expect(contract.schemaVersion).toBe("lgpd-purge-worker-contract/v1");
    expect(contract.runtimeEnabled).toBe(false);
    expect(contract.deployAuthorized).toBe(false);
    expect(contract.schedulerAuthorized).toBe(false);
    expect(config).not.toContain("[functions.account-deletion-purge-worker]");
  });

  it("requires atomic claim, lease and persisted retry state before worker implementation", () => {
    expect(contract.claim).toMatchObject({
      mustBeAtomic: true,
      requiresDueAtOrBeforeNow: true,
      requiresLeaseToken: true,
      requiresLeaseExpiry: true,
      requiresAttemptCounter: true,
      requiresLastAttemptTimestamp: true,
      concurrentDoubleClaim: "forbidden",
    });
    expect(contract.failureHandling).toMatchObject({
      persistFailureCode: true,
      persistAttemptCount: true,
      persistLastAttemptAt: true,
      partialFailureBehavior:
        "persist-failed-state-and-require-idempotent-retry",
      silentRetryLoop: "forbidden",
    });
  });

  it("keeps Auth deletion last and cleanup/revalidation before it", () => {
    const authDelete = contract.orderedPhases.indexOf("delete-auth-user-last");
    expect(authDelete).toBeGreaterThan(
      contract.orderedPhases.indexOf("cleanup-storage-by-owner-id"),
    );
    expect(authDelete).toBeGreaterThan(
      contract.orderedPhases.indexOf("resolve-profile-fanout"),
    );
    expect(authDelete).toBeGreaterThan(
      contract.orderedPhases.indexOf("revoke-auth-sessions"),
    );
    expect(contract.idempotency.authDeleteMustBeLast).toBe(true);
  });

  it("cannot be promoted while current purge SSOT remains blocked", () => {
    expect(policy.rolloutReady).toBe(false);
    expect(matrix.implementationComplete).toBe(false);
    expect(matrix.snapshot.unclassifiedReferenceCount).toBe(0);
    expect(matrix.snapshot.decisionCounts["block-purge"]).toBeGreaterThan(0);
    expect(policy.unresolved.some((entry) => entry.id === "PURGE-005")).toBe(
      true,
    );
    expect(contract.hardPreconditions).toMatchObject({
      purgePolicyRolloutReady: true,
      purgeMatrixImplementationComplete: true,
      zeroUnclassifiedReferences: true,
      zeroBlockPurgeReferences: true,
      liveCatalogRevalidation: true,
      nonProductionRecoveryCertified: true,
    });
  });

  it("forbids legacy destructive shortcuts", () => {
    expect(contract.forbidden).toContain("reuse-user-delete-account-as-worker");
    expect(contract.forbidden).toContain("direct-browser-auth-delete");
    expect(contract.forbidden).toContain("retry-without-persisted-attempt-state");
    expect(contract.forbidden).toContain(
      "delete-auth-user-before-dependent-cleanup",
    );
  });
});
