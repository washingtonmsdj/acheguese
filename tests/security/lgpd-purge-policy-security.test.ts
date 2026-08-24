import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  inspectLgpdPurgeReadiness,
  loadLgpdPurgePolicy,
  validateLgpdPurgePolicy,
} from "../../scripts/security/lgpd-purge-policy.mjs";

const ROOT = process.cwd();
const POLICY_PATH = join(
  ROOT,
  "docs/09-reference/governance/privacy/LGPD_PURGE_POLICY.json",
);
const SCRIPT_PATH = join(ROOT, "scripts/security/lgpd-purge-policy.mjs");

const policy = loadLgpdPurgePolicy(POLICY_PATH);

describe("LGPD irreversible purge policy", () => {
  it("remains fail-closed until every destructive-phase blocker is resolved", () => {
    const readiness = inspectLgpdPurgeReadiness(policy);

    expect(policy.schemaVersion).toBe("lgpd-purge-policy/v1");
    expect(policy.rolloutReady).toBe(false);
    expect(readiness.ready).toBe(false);
    expect(readiness.blockerIds).toEqual([
      "PURGE-001",
      "PURGE-002",
      "PURGE-003",
      "PURGE-004",
      "PURGE-005",
      "PURGE-006",
      "PURGE-007",
    ]);
  });

  it("locks the remotely observed auth-delete blockers instead of assuming CASCADE", () => {
    expect(policy.authUserForeignKeyBlockers.columns).toHaveLength(20);
    expect(policy.authUserForeignKeyBlockers.columns).toContain(
      "public.education_leads.owner_user_id",
    );
    expect(policy.authUserForeignKeyBlockers.columns).toContain(
      "public.pii_access_log.accessed_by",
    );
    expect(policy.authUserForeignKeyBlockers.columns).toContain(
      "public.user_sessions.revoked_by",
    );
  });

  it("locks user-like identifiers that Auth deletion cannot clean automatically", () => {
    const entries = policy.nonForeignKeyUserIdentifiers.columns as Array<{
      column: string;
      nullable: boolean;
      classification: string;
    }>;

    expect(entries).toHaveLength(15);
    expect(entries).toContainEqual({
      column: "public.ai_image_generations.user_id",
      nullable: false,
      classification: "explicit-subject-cleanup-required",
    });
    expect(entries).toContainEqual({
      column: "private.notification_preferences_audit_log.user_id",
      nullable: false,
      classification: "retain-anonymize-reference",
    });
  });

  it("locks the profile purge fanout and the classified report schema drift", () => {
    expect(policy.profileDeletionFanout.snapshot).toEqual({
      totalForeignKeys: 157,
      cascade: 106,
      noAction: 5,
      restrict: 3,
      setNull: 43,
      setNullOnNotNullColumn: 1,
    });
    expect(policy.profileDeletionFanout.hardBlockers).toContainEqual(
      expect.objectContaining({
        column: "public.classified_reports.reporter_id",
        onDelete: "SET NULL",
        nullable: false,
        constraint: "classified_reports_reporter_id_fkey",
      }),
    );
  });

  it("requires canonical Storage ownership cleanup before Auth hard-delete", () => {
    expect(policy.rules.storageCleanupMustPrecedeAuthDelete).toBe(true);
    expect(policy.rules.storageOwnershipColumn).toBe("owner_id");
    expect(policy.rules.deprecatedStorageOwnershipColumn).toBe("owner");
    expect(policy.rules.authUserHardDeleteMustBeLast).toBe(true);
    expect(policy.rules.authDeleteMethod).toBe(
      "supabase.auth.admin.deleteUser(userId)",
    );
    expect(policy.rules.directAuthDeleteFromBrowser).toBe(false);
  });

  it("records current remote foundation without pretending unapplied migrations exist", () => {
    expect(policy.remoteFoundation).toEqual({
      accountDeletionRequestsExists: false,
      requestRpcExists: false,
      cancelRpcExists: true,
      pgCronInstalled: true,
      pgNetInstalled: true,
    });
  });

  it("rejects promotion while unresolved blockers remain", () => {
    const promoted = structuredClone(policy);
    promoted.rolloutReady = true;

    expect(() => validateLgpdPurgePolicy(promoted)).toThrow(
      "rolloutReady cannot be true while blockers remain",
    );
  });

  it("rejects weakening the canonical Storage owner column", () => {
    const weakened = structuredClone(policy);
    weakened.rules.storageOwnershipColumn = "owner";

    expect(() => validateLgpdPurgePolicy(weakened)).toThrow(
      "Storage ownership must use canonical owner_id",
    );
  });

  it("is a pure local gate and never reads secrets, contacts Supabase or deploys", () => {
    const source = readFileSync(SCRIPT_PATH, "utf8");

    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("SUPABASE_ACCESS_TOKEN");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain("functions deploy");
    expect(source).not.toContain("apply_migration");
    expect(source).toContain("LGPD_PURGE_POLICY_BLOCKED");
    expect(source).toContain("if (!status.ready) process.exitCode = 1");
  });
});
