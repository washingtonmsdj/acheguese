import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const contract = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "docs/09-reference/governance/privacy/LGPD_PURGE_CLAIM_SCHEMA_CONTRACT.json",
    ),
    "utf8",
  ),
);

const worker = JSON.parse(
  readFileSync(
    join(
      ROOT,
      "docs/09-reference/governance/privacy/LGPD_PURGE_WORKER_CONTRACT.json",
    ),
    "utf8",
  ),
);

const heavyWorkflow = readFileSync(
  join(ROOT, ".github/workflows/certify-heavy-pr-auto.yml"),
  "utf8",
);

describe("LGPD purge claim schema contract", () => {
  it("stays contract-only and cannot authorize migration or runtime", () => {
    expect(contract.schemaVersion).toBe(
      "lgpd-purge-claim-schema-contract/v1",
    );
    expect(contract.implementationStatus).toBe("contract-only");
    expect(contract.runtimeEnabled).toBe(false);
    expect(contract.migrationAuthorized).toBe(false);
  });

  it("requires lease and persisted attempt state matching the worker contract", () => {
    expect(contract.requiredColumns).toMatchObject({
      lease_token: { type: "uuid", nullable: true, browserWritable: false },
      lease_expires_at: {
        type: "timestamptz",
        nullable: true,
        browserWritable: false,
      },
      attempt_count: {
        type: "integer",
        nullable: false,
        default: 0,
        minimum: 0,
        browserWritable: false,
      },
      last_attempt_at: {
        type: "timestamptz",
        nullable: true,
        browserWritable: false,
      },
      last_failure_code: {
        type: "text",
        nullable: true,
        maxLength: 120,
        browserWritable: false,
      },
    });

    expect(worker.claim).toMatchObject({
      requiresLeaseToken: true,
      requiresLeaseExpiry: true,
      requiresAttemptCounter: true,
      requiresLastAttemptTimestamp: true,
    });
  });

  it("requires an atomic one-row claim with row locking and SKIP LOCKED", () => {
    expect(contract.claimRpc).toMatchObject({
      schema: "private",
      browserExecutable: false,
      serviceRoleExecutable: true,
      mustBeAtomic: true,
      eligibility: {
        status: "scheduled",
        scheduledPurgeAtLteNow: true,
        leaseMissingOrExpired: true,
      },
      mutation: {
        status: "processing",
        setsLeaseToken: true,
        setsLeaseExpiry: true,
        incrementsAttemptCount: true,
        setsLastAttemptAt: true,
        clearsFailureCode: true,
      },
      concurrency: {
        doubleClaimForbidden: true,
        rowLockRequired: true,
        skipLockedRequired: true,
        singleRowPerClaim: true,
      },
    });
  });

  it("requires lease-token ownership for failure and completion transitions", () => {
    expect(contract.failureRpc).toMatchObject({
      schema: "private",
      requiresMatchingLeaseToken: true,
      statusAfterFailure: "failed",
      persistsFailureCode: true,
      clearsLease: true,
    });
    expect(contract.completionRpc).toMatchObject({
      schema: "private",
      requiresMatchingLeaseToken: true,
      statusAfterCompletion: "completed",
      clearsLease: true,
    });
  });

  it("keeps failed requests out of automatic retry loops", () => {
    expect(contract.retryPolicy).toMatchObject({
      failedRequestAutoRetry: false,
      expiredProcessingLeaseCanBeReclaimed: true,
      silentLoopForbidden: true,
      manualOrExplicitPolicyRequiredForFailed: true,
    });
  });

  it("keeps destructive work out of the claim primitive", () => {
    expect(contract.hardGuards).toEqual(
      expect.arrayContaining([
        "no-browser-grants",
        "no-public-execute",
        "no-auth-delete-in-claim-rpc",
        "no-profile-delete-in-claim-rpc",
        "no-storage-delete-in-claim-rpc",
        "no-scheduler-while-rollout-disabled",
      ]),
    );
  });

  it("is enforced by the authoritative Heavy LGPD gate", () => {
    expect(heavyWorkflow).toContain(
      "tests/security/lgpd-purge-claim-schema-contract.test.ts",
    );
  });
});
