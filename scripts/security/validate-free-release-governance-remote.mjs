#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { classifySupabaseCliFailure } from "../lib/supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "../lib/supabase-cli-query-json.mjs";
import { runSupabaseCli } from "../lib/supabase-cli-runner.mjs";
import {
  loadFreeReleaseGovernance,
  validateFreeReleaseGovernance,
  validateRemoteRecoveryFreshness,
} from "./validate-free-release-governance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const EXCEPTION_REGISTER_PATH = join(
  ROOT,
  "docs/09-reference/governance/security/EXCEPTIONS.md",
);

export function buildRemoteRecoveryEvidenceSql() {
  return `
select
  (select count(*)::bigint from supabase_migrations.schema_migrations) as migration_count,
  (select max(version)::text from supabase_migrations.schema_migrations) as latest_migration,
  (select count(*)::bigint from auth.users) as auth_users,
  (select count(*)::bigint from auth.identities) as auth_identities,
  (select count(*)::bigint from storage.objects) as storage_objects,
  (
    select coalesce(sum(
      case
        when metadata ->> 'size' ~ '^[0-9]+$'
          then (metadata ->> 'size')::bigint
        else 0
      end
    ), 0)::bigint
    from storage.objects
  ) as storage_total_bytes;
`.trim();
}

function finiteCount(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`REMOTE_RECOVERY_EVIDENCE_INVALID:${field}`);
  }
  return parsed;
}

export function normalizeRemoteRecoveryEvidence(row) {
  const latestMigration = String(row?.latest_migration ?? "");
  if (!/^\d{14}$/.test(latestMigration)) {
    throw new Error("REMOTE_RECOVERY_EVIDENCE_INVALID:latestMigration");
  }
  return {
    migrationCount: finiteCount(row?.migration_count, "migrationCount"),
    latestMigration,
    authUsers: finiteCount(row?.auth_users, "authUsers"),
    authIdentities: finiteCount(row?.auth_identities, "authIdentities"),
    storageObjects: finiteCount(row?.storage_objects, "storageObjects"),
    storageTotalBytes: finiteCount(
      row?.storage_total_bytes,
      "storageTotalBytes",
    ),
  };
}

function queryRemoteRecoveryEvidence() {
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-recovery-freshness-"));
  const sqlPath = join(tempDir, "remote-recovery-evidence.sql");
  writeFileSync(sqlPath, buildRemoteRecoveryEvidenceSql(), "utf8");

  try {
    const result = runSupabaseCli(
      ["db", "query", "--linked", "--output", "json", "--file", sqlPath],
      { cwd: ROOT },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.error) {
      throw new Error(
        `LOCAL_FAILURE: falha ao executar Supabase CLI: ${result.error.message}`,
      );
    }
    if (result.status !== 0) {
      throw new Error(
        [
          `${classifySupabaseCliFailure(output)}: remote recovery freshness evidence indisponivel.`,
          "Comando: supabase db query --linked --output json --file <readonly-query>",
          output.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    const rows = parseSupabaseQueryRows(output);
    if (rows.length !== 1) {
      throw new Error("REMOTE_RECOVERY_EVIDENCE_INVALID:rowCount");
    }
    return normalizeRemoteRecoveryEvidence(rows[0]);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function main() {
  const policy = loadFreeReleaseGovernance();
  const exceptionRegister = readFileSync(EXCEPTION_REGISTER_PATH, "utf8");
  const localResult = validateFreeReleaseGovernance(policy, {
    exceptionRegister,
  });
  if (!localResult.ok) {
    console.error("FREE_RELEASE_GOVERNANCE_BLOCKED");
    for (const issue of localResult.issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  const remoteEvidence = queryRemoteRecoveryEvidence();
  const result = validateRemoteRecoveryFreshness(policy, remoteEvidence, {
    operation: "mutable",
  });
  if (!result.ok) {
    console.error("REMOTE_RECOVERY_FRESHNESS_BLOCKED");
    for (const issue of result.issues) console.error(`- ${issue}`);
    if (result.differences.length > 0) {
      console.error(JSON.stringify({ differences: result.differences }));
    }
    process.exit(1);
  }

  console.log("REMOTE_RECOVERY_FRESHNESS_GATE_PASS");
  console.log(
    JSON.stringify({
      snapshotId: policy.controls.recovery.snapshotId,
      compared: remoteEvidence,
    }),
  );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  try {
    main();
  } catch (error) {
    console.error("REMOTE_RECOVERY_FRESHNESS_BLOCKED");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
