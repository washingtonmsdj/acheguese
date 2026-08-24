#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LGPD_PURGE_POLICY_SCHEMA = "lgpd-purge-policy/v1";
export const DEFAULT_POLICY_PATH = resolve(
  process.cwd(),
  "docs/09-reference/governance/privacy/LGPD_PURGE_POLICY.json",
);

const COLUMN_PATTERN = /^(?:public|private)\.[a-z0-9_]+\.[a-z0-9_]+$/;
const ALLOWED_NON_FK_CLASSIFICATIONS = new Set([
  "retain-anonymize-reference",
  "retention-decision-required",
  "explicit-subject-cleanup-required",
]);
const ALLOWED_PROFILE_HARD_BLOCKER_DELETE_ACTIONS = new Set([
  "RESTRICT",
  "SET NULL",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireBoolean(value, field) {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean`);
}

function requireInteger(value, field, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${field} must be an integer >= ${minimum}`);
  }
}

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function requireUniqueColumns(values, field) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }
  const seen = new Set();
  for (const value of values) {
    requireNonEmptyString(value, `${field}[]`);
    if (!COLUMN_PATTERN.test(value)) {
      throw new Error(`${field} contains invalid column path: ${value}`);
    }
    if (seen.has(value)) throw new Error(`${field} contains duplicate: ${value}`);
    seen.add(value);
  }
  return seen;
}

function validateProfileDeletionFanout(profileDeletionFanout) {
  if (!isObject(profileDeletionFanout)) {
    throw new Error("profileDeletionFanout must be an object");
  }
  if (!isObject(profileDeletionFanout.snapshot)) {
    throw new Error("profileDeletionFanout.snapshot must be an object");
  }

  const snapshot = profileDeletionFanout.snapshot;
  for (const field of [
    "totalForeignKeys",
    "cascade",
    "noAction",
    "restrict",
    "setNull",
    "setNullOnNotNullColumn",
  ]) {
    requireInteger(snapshot[field], `profileDeletionFanout.snapshot.${field}`);
  }
  if (snapshot.totalForeignKeys !==
      snapshot.cascade + snapshot.noAction + snapshot.restrict + snapshot.setNull) {
    throw new Error("profile deletion FK snapshot totals do not reconcile");
  }
  if (snapshot.setNullOnNotNullColumn > snapshot.setNull) {
    throw new Error("profile SET NULL mismatch count exceeds SET NULL count");
  }

  if (!Array.isArray(profileDeletionFanout.hardBlockers) ||
      profileDeletionFanout.hardBlockers.length === 0) {
    throw new Error("profileDeletionFanout.hardBlockers must be non-empty");
  }
  const hardBlockerColumns = new Set();
  for (const blocker of profileDeletionFanout.hardBlockers) {
    if (!isObject(blocker)) throw new Error("profile hard blocker must be an object");
    requireNonEmptyString(blocker.column, "profile hard blocker column");
    if (!COLUMN_PATTERN.test(blocker.column)) {
      throw new Error(`Invalid profile hard blocker column: ${blocker.column}`);
    }
    if (hardBlockerColumns.has(blocker.column)) {
      throw new Error(`Duplicate profile hard blocker: ${blocker.column}`);
    }
    hardBlockerColumns.add(blocker.column);
    if (!ALLOWED_PROFILE_HARD_BLOCKER_DELETE_ACTIONS.has(blocker.onDelete)) {
      throw new Error(`Invalid profile hard blocker delete action: ${blocker.column}`);
    }
    requireBoolean(blocker.nullable, `${blocker.column}.nullable`);
    requireNonEmptyString(blocker.classification, `${blocker.column}.classification`);
  }

  requireUniqueColumns(
    profileDeletionFanout.nullableNoActionReferences,
    "profileDeletionFanout.nullableNoActionReferences",
  );
  if (profileDeletionFanout.nullableNoActionReferences.length !== snapshot.noAction) {
    throw new Error("profile NO ACTION reference count drifted from snapshot");
  }

  if (!isObject(profileDeletionFanout.cascadeReview)) {
    throw new Error("profileDeletionFanout.cascadeReview must be an object");
  }
  if (profileDeletionFanout.cascadeReview.count !== snapshot.cascade) {
    throw new Error("profile cascade review count drifted from snapshot");
  }
  requireNonEmptyString(
    profileDeletionFanout.cascadeReview.status,
    "profileDeletionFanout.cascadeReview.status",
  );
  requireNonEmptyString(
    profileDeletionFanout.cascadeReview.reason,
    "profileDeletionFanout.cascadeReview.reason",
  );
  requireUniqueColumns(
    profileDeletionFanout.cascadeReview.highRiskExamples,
    "profileDeletionFanout.cascadeReview.highRiskExamples",
  );

  return hardBlockerColumns;
}

export function validateLgpdPurgePolicy(policy) {
  if (!isObject(policy)) throw new Error("LGPD purge policy must be an object");
  if (policy.schemaVersion !== LGPD_PURGE_POLICY_SCHEMA) {
    throw new Error("Invalid LGPD purge policy schema version");
  }
  requireBoolean(policy.rolloutReady, "rolloutReady");

  if (!isObject(policy.rules)) throw new Error("rules must be an object");
  for (const field of [
    "authUserHardDeleteMustBeLast",
    "profileDeletionMustBeClassifiedBeforeAuthDelete",
    "storageCleanupMustPrecedeAuthDelete",
    "existingJwtMayRemainValidUntilExp",
    "directAuthDeleteFromBrowser",
  ]) {
    requireBoolean(policy.rules[field], `rules.${field}`);
  }
  if (policy.rules.authUserHardDeleteMustBeLast !== true) {
    throw new Error("Auth hard delete must remain the final destructive step");
  }
  if (policy.rules.profileDeletionMustBeClassifiedBeforeAuthDelete !== true) {
    throw new Error("Profile deletion fanout must be classified before Auth deletion");
  }
  if (policy.rules.storageCleanupMustPrecedeAuthDelete !== true) {
    throw new Error("Storage cleanup must precede Auth deletion");
  }
  if (policy.rules.storageOwnershipColumn !== "owner_id") {
    throw new Error("Storage ownership must use canonical owner_id");
  }
  if (policy.rules.deprecatedStorageOwnershipColumn !== "owner") {
    throw new Error("Deprecated Storage owner column marker drifted");
  }
  if (policy.rules.authDeleteMethod !== "supabase.auth.admin.deleteUser(userId)") {
    throw new Error("Auth delete method must stay server-side and explicit");
  }
  if (policy.rules.unknownUserReferenceBehavior !== "block") {
    throw new Error("Unknown user references must fail closed");
  }
  if (policy.rules.unknownCascadeBehavior !== "block") {
    throw new Error("Unknown cascade behavior must fail closed");
  }
  if (policy.rules.requiredQueryFailure !== "fail-closed") {
    throw new Error("Required purge queries must fail closed");
  }
  if (policy.rules.directAuthDeleteFromBrowser !== false) {
    throw new Error("Browser Auth deletion must remain forbidden");
  }

  if (!isObject(policy.remoteFoundation)) {
    throw new Error("remoteFoundation must be an object");
  }
  for (const field of [
    "accountDeletionRequestsExists",
    "requestRpcExists",
    "cancelRpcExists",
    "pgCronInstalled",
    "pgNetInstalled",
  ]) {
    requireBoolean(policy.remoteFoundation[field], `remoteFoundation.${field}`);
  }

  if (!isObject(policy.authUserForeignKeyBlockers)) {
    throw new Error("authUserForeignKeyBlockers must be an object");
  }
  const authNoActionColumns = requireUniqueColumns(
    policy.authUserForeignKeyBlockers.columns,
    "authUserForeignKeyBlockers.columns",
  );
  if (policy.authUserForeignKeyBlockers.strategy !== "nullify-reference-before-auth-delete") {
    throw new Error("direct Auth NO ACTION references must use nullify-before-delete strategy");
  }
  if (policy.authUserForeignKeyBlockers.migrationStatus !== "not-implemented") {
    throw new Error("Auth NO ACTION nullification cannot be marked implemented in policy-only PR");
  }

  const profileHardBlockers = validateProfileDeletionFanout(policy.profileDeletionFanout);
  for (const column of profileHardBlockers) {
    if (authNoActionColumns.has(column)) {
      throw new Error(`Column cannot be both direct Auth and profile blocker: ${column}`);
    }
  }

  if (!isObject(policy.nonForeignKeyUserIdentifiers)) {
    throw new Error("nonForeignKeyUserIdentifiers must be an object");
  }
  if (!Array.isArray(policy.nonForeignKeyUserIdentifiers.columns) ||
      policy.nonForeignKeyUserIdentifiers.columns.length === 0) {
    throw new Error("nonForeignKeyUserIdentifiers.columns must be non-empty");
  }
  const nonFkSeen = new Set();
  const nonFkByClassification = new Map();
  for (const entry of policy.nonForeignKeyUserIdentifiers.columns) {
    if (!isObject(entry)) throw new Error("non-FK identifier entry must be an object");
    requireNonEmptyString(entry.column, "nonForeignKeyUserIdentifiers.columns[].column");
    if (!COLUMN_PATTERN.test(entry.column)) {
      throw new Error(`Invalid non-FK column path: ${entry.column}`);
    }
    if (nonFkSeen.has(entry.column)) {
      throw new Error(`Duplicate non-FK column: ${entry.column}`);
    }
    nonFkSeen.add(entry.column);
    requireBoolean(entry.nullable, `${entry.column}.nullable`);
    if (!ALLOWED_NON_FK_CLASSIFICATIONS.has(entry.classification)) {
      throw new Error(`Invalid non-FK classification for ${entry.column}`);
    }
    const set = nonFkByClassification.get(entry.classification) ?? new Set();
    set.add(entry.column);
    nonFkByClassification.set(entry.classification, set);
  }

  const explicitCleanup = requireUniqueColumns(
    policy.explicitSubjectCleanupBeforeAuth,
    "explicitSubjectCleanupBeforeAuth",
  );
  const classifiedExplicitCleanup =
    nonFkByClassification.get("explicit-subject-cleanup-required") ?? new Set();
  if (explicitCleanup.size !== classifiedExplicitCleanup.size ||
      [...explicitCleanup].some((column) => !classifiedExplicitCleanup.has(column))) {
    throw new Error("explicit subject cleanup list drifted from non-FK classifications");
  }

  const retainedAudit = requireUniqueColumns(
    policy.retainedAuditAnonymizationRequired,
    "retainedAuditAnonymizationRequired",
  );
  const classifiedRetainedAudit =
    nonFkByClassification.get("retain-anonymize-reference") ?? new Set();
  if (retainedAudit.size !== classifiedRetainedAudit.size ||
      [...retainedAudit].some((column) => !classifiedRetainedAudit.has(column))) {
    throw new Error("retained audit anonymization list drifted from classifications");
  }

  if (!Array.isArray(policy.unresolved)) {
    throw new Error("unresolved must be an array");
  }
  const ids = new Set();
  for (const blocker of policy.unresolved) {
    if (!isObject(blocker)) throw new Error("unresolved entry must be an object");
    requireNonEmptyString(blocker.id, "unresolved[].id");
    requireNonEmptyString(blocker.reason, `${blocker.id}.reason`);
    if (blocker.severity !== "critical") {
      throw new Error(`${blocker.id} must remain critical until resolved`);
    }
    if (ids.has(blocker.id)) throw new Error(`Duplicate blocker id: ${blocker.id}`);
    ids.add(blocker.id);
  }

  if (policy.rolloutReady && policy.unresolved.length > 0) {
    throw new Error("rolloutReady cannot be true while blockers remain");
  }
  if (!policy.rolloutReady && policy.unresolved.length === 0) {
    throw new Error("rolloutReady=false requires an explicit unresolved reason");
  }

  return policy;
}

export function loadLgpdPurgePolicy(path = DEFAULT_POLICY_PATH) {
  if (!existsSync(path)) throw new Error(`LGPD purge policy not found: ${path}`);
  const policy = JSON.parse(readFileSync(path, "utf8"));
  return validateLgpdPurgePolicy(policy);
}

export function inspectLgpdPurgeReadiness(policy = loadLgpdPurgePolicy()) {
  return {
    ready: policy.rolloutReady === true && policy.unresolved.length === 0,
    blockerIds: policy.unresolved.map((entry) => entry.id),
    noActionForeignKeyBlockers: policy.authUserForeignKeyBlockers.columns.length,
    nonForeignKeyUserIdentifiers: policy.nonForeignKeyUserIdentifiers.columns.length,
    profileForeignKeys: policy.profileDeletionFanout.snapshot.totalForeignKeys,
    profileCascadeForeignKeys: policy.profileDeletionFanout.snapshot.cascade,
    profileHardBlockers: policy.profileDeletionFanout.hardBlockers.length,
    storageOwnershipColumn: policy.rules.storageOwnershipColumn,
  };
}

function runCli() {
  const json = process.argv.includes("--json");
  const policy = loadLgpdPurgePolicy();
  const status = inspectLgpdPurgeReadiness(policy);

  if (json) {
    console.log(JSON.stringify(status, null, 2));
  } else if (status.ready) {
    console.log("LGPD_PURGE_POLICY_READY");
  } else {
    console.error("LGPD_PURGE_POLICY_BLOCKED");
    console.error(`Blockers: ${status.blockerIds.join(", ")}`);
    console.error(`NO ACTION auth FKs: ${status.noActionForeignKeyBlockers}`);
    console.error(`User identifiers without auth FK: ${status.nonForeignKeyUserIdentifiers}`);
    console.error(`Profile FKs: ${status.profileForeignKeys}`);
    console.error(`Profile CASCADE FKs: ${status.profileCascadeForeignKeys}`);
    console.error(`Profile hard blockers: ${status.profileHardBlockers}`);
  }

  if (!status.ready) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    console.error(
      `LGPD_PURGE_POLICY_ERROR: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    process.exitCode = 1;
  }
}
