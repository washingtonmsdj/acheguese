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
  "retention-decision-required",
  "explicit-subject-cleanup-required",
]);

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireBoolean(value, field) {
  if (typeof value !== "boolean") throw new Error(`${field} must be boolean`);
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
    "storageCleanupMustPrecedeAuthDelete",
    "existingJwtMayRemainValidUntilExp",
    "directAuthDeleteFromBrowser",
  ]) {
    requireBoolean(policy.rules[field], `rules.${field}`);
  }
  if (policy.rules.authUserHardDeleteMustBeLast !== true) {
    throw new Error("Auth hard delete must remain the final destructive step");
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
  requireUniqueColumns(
    policy.authUserForeignKeyBlockers.columns,
    "authUserForeignKeyBlockers.columns",
  );

  if (!isObject(policy.nonForeignKeyUserIdentifiers)) {
    throw new Error("nonForeignKeyUserIdentifiers must be an object");
  }
  if (!Array.isArray(policy.nonForeignKeyUserIdentifiers.columns) ||
      policy.nonForeignKeyUserIdentifiers.columns.length === 0) {
    throw new Error("nonForeignKeyUserIdentifiers.columns must be non-empty");
  }
  const nonFkSeen = new Set();
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
    console.error(`User-like columns without auth FK: ${status.nonForeignKeyUserIdentifiers}`);
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
