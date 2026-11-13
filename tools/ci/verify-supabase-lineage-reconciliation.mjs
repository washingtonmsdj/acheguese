import { readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseMigrationTable } from "./verify-supabase-migration-lineage.mjs";

const VERSION = /^\d{14}$/;
const MIGRATION_FILE = /^(\d{14})_(.+)\.sql$/;

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function executableSql(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("--"))
    .join("\n");
}

function same(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function verifyReconciliation({ output, directory, manifest, phase }) {
  if (!["before", "after-repair", "after-push"].includes(phase)) {
    throw new Error("Invalid reconciliation phase");
  }
  if (manifest?.schemaVersion !== "supabase-lineage-reconciliation/v1") {
    throw new Error("Unsupported reconciliation manifest");
  }

  const files = readdirSync(directory).filter((name) => name.endsWith(".sql"));
  const byVersion = new Map();
  const invalidSqlFiles = [];
  for (const file of files) {
    const match = file.match(MIGRATION_FILE);
    if (!match) {
      invalidSqlFiles.push(file);
      continue;
    }
    if (byVersion.has(match[1])) {
      throw new Error(`Duplicate local migration version: ${match[1]}`);
    }
    byVersion.set(match[1], file);
  }

  const aliases = Array.isArray(manifest.aliases) ? manifest.aliases : [];
  const retired = Array.isArray(manifest.retiredRetroactive) ? manifest.retiredRetroactive : [];
  const repair = Array.isArray(manifest.repairAppliedVersions)
    ? manifest.repairAppliedVersions.map(String)
    : [];
  const forward = Array.isArray(manifest.forwardPendingVersions)
    ? manifest.forwardPendingVersions.map(String)
    : [];
  const additionalForward = Array.isArray(manifest.additionalForwardMigrations)
    ? manifest.additionalForwardMigrations
    : [];

  const aliasRemote = aliases.map((entry) => String(entry.remoteVersion));
  const aliasCanonical = aliases.map((entry) => String(entry.canonicalVersion));
  const retiredVersions = retired.map((entry) => String(entry.version));
  const replacementVersions = retired.map((entry) => String(entry.replacement).slice(0, 14));
  const additionalForwardVersions = additionalForward.map((entry) => String(entry.version));
  const expectedForward = sortedUnique([...replacementVersions, ...additionalForwardVersions]);
  const expectedRepair = sortedUnique([...aliasCanonical, ...retiredVersions]);

  if (aliases.length !== 24 || sortedUnique(aliasRemote).length !== 24) {
    throw new Error("Reconciliation manifest must preserve exactly 24 unique remote aliases");
  }
  if (!same([...repair].sort(), expectedRepair)) {
    throw new Error("repairAppliedVersions must equal canonical alias versions plus retired retroactive slots");
  }
  if (!same([...forward].sort(), expectedForward)) {
    throw new Error("forwardPendingVersions must equal replacements plus approved additional forward migrations");
  }
  if (repair.some((version) => !VERSION.test(version)) || forward.some((version) => !VERSION.test(version))) {
    throw new Error("Invalid version in reconciliation manifest");
  }

  const fileViolations = [];
  for (const entry of aliases) {
    const remoteVersion = String(entry.remoteVersion);
    const canonicalVersion = String(entry.canonicalVersion);
    const remoteFile = String(entry.remoteTombstoneFile);
    const canonicalFile = String(entry.canonicalFile);
    if (byVersion.get(remoteVersion) !== remoteFile) {
      fileViolations.push(`remote tombstone mismatch: ${remoteVersion}`);
      continue;
    }
    if (byVersion.get(canonicalVersion) !== canonicalFile) {
      fileViolations.push(`canonical file mismatch: ${canonicalVersion}`);
      continue;
    }
    const remoteSql = readFileSync(resolve(directory, remoteFile), "utf8");
    const canonicalSql = readFileSync(resolve(directory, canonicalFile), "utf8");
    if (executableSql(remoteSql) !== "") {
      fileViolations.push(`remote tombstone became executable: ${remoteFile}`);
    }
    if (executableSql(canonicalSql) === "") {
      fileViolations.push(`canonical alias lost executable SQL: ${canonicalFile}`);
    }
  }

  for (const entry of retired) {
    const version = String(entry.version);
    const oldFile = String(entry.file);
    const replacement = String(entry.replacement);
    if (byVersion.get(version) !== oldFile) {
      fileViolations.push(`retired slot mismatch: ${version}`);
      continue;
    }
    const replacementVersion = replacement.slice(0, 14);
    if (byVersion.get(replacementVersion) !== replacement) {
      fileViolations.push(`forward replacement missing: ${replacement}`);
      continue;
    }
    if (executableSql(readFileSync(resolve(directory, oldFile), "utf8")) !== "") {
      fileViolations.push(`retired retroactive slot is executable: ${oldFile}`);
    }
    if (executableSql(readFileSync(resolve(directory, replacement), "utf8")) === "") {
      fileViolations.push(`forward replacement has no executable SQL: ${replacement}`);
    }
  }

  for (const entry of additionalForward) {
    const version = String(entry.version);
    const file = String(entry.file);
    if (byVersion.get(version) !== file) {
      fileViolations.push(`additional forward migration mismatch: ${version}`);
      continue;
    }
    if (executableSql(readFileSync(resolve(directory, file), "utf8")) === "") {
      fileViolations.push(`additional forward migration has no executable SQL: ${file}`);
    }
  }

  const rows = parseMigrationTable(output);
  const local = new Set();
  const remote = new Set();
  const localOnly = new Set();
  const remoteOnly = new Set();
  const duplicateLocalRows = new Set();
  const duplicateRemoteRows = new Set();
  const mispaired = [];

  for (const row of rows) {
    if (row.local && local.has(row.local)) duplicateLocalRows.add(row.local);
    if (row.remote && remote.has(row.remote)) duplicateRemoteRows.add(row.remote);
    if (row.local) local.add(row.local);
    if (row.remote) remote.add(row.remote);
    if (row.local && !row.remote) localOnly.add(row.local);
    if (row.remote && !row.local) remoteOnly.add(row.remote);
    if (row.local && row.remote && row.local !== row.remote) mispaired.push(row);
  }

  const checkoutVersions = new Set(byVersion.keys());
  const missingFromCheckout = [...local].filter((version) => !checkoutVersions.has(version)).sort();
  const missingFromCli = [...checkoutVersions].filter((version) => !local.has(version)).sort();
  const latestRemoteVersion = [...remote].sort().at(-1) ?? null;

  const expectedLocalOnly = phase === "before"
    ? sortedUnique([...repair, ...forward])
    : phase === "after-repair"
      ? [...forward].sort()
      : [];

  const state = {
    phase,
    latestRemoteVersion,
    localOnly: [...localOnly].sort(),
    remoteOnly: [...remoteOnly].sort(),
    expectedLocalOnly,
    invalidSqlFiles: invalidSqlFiles.sort(),
    fileViolations,
    duplicateLocalRows: [...duplicateLocalRows].sort(),
    duplicateRemoteRows: [...duplicateRemoteRows].sort(),
    mispaired,
    missingFromCheckout,
    missingFromCli,
    missingExpectedLocalOnly: expectedLocalOnly.filter((version) => !localOnly.has(version)),
    unexpectedLocalOnly: [...localOnly].filter((version) => !expectedLocalOnly.includes(version)).sort(),
    missingRemoteAliases: aliasRemote.filter((version) => !remote.has(version)).sort(),
    forwardNotActuallyForward: forward.filter(
      (version) => latestRemoteVersion !== null && version <= latestRemoteVersion,
    ),
  };

  state.ok =
    state.remoteOnly.length === 0 &&
    state.invalidSqlFiles.length === 0 &&
    state.fileViolations.length === 0 &&
    state.duplicateLocalRows.length === 0 &&
    state.duplicateRemoteRows.length === 0 &&
    state.mispaired.length === 0 &&
    state.missingFromCheckout.length === 0 &&
    state.missingFromCli.length === 0 &&
    state.missingExpectedLocalOnly.length === 0 &&
    state.unexpectedLocalOnly.length === 0 &&
    state.missingRemoteAliases.length === 0 &&
    state.forwardNotActuallyForward.length === 0;

  return state;
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!["--list", "--directory", "--manifest", "--phase"].includes(key) || !value) {
      throw new Error(`Invalid or missing argument: ${key}`);
    }
    args.set(key, value);
  }
  for (const key of ["--list", "--directory", "--manifest", "--phase"]) {
    if (!args.has(key)) throw new Error(`Required: ${key}`);
  }
  return args;
}

export function run(argv) {
  const args = parseArgs(argv);
  const state = verifyReconciliation({
    output: readFileSync(resolve(args.get("--list")), "utf8"),
    directory: resolve(args.get("--directory")),
    manifest: JSON.parse(readFileSync(resolve(args.get("--manifest")), "utf8")),
    phase: args.get("--phase"),
  });
  console.log(JSON.stringify(state, null, 2));
  if (!state.ok) throw new Error("SUPABASE_LINEAGE_RECONCILIATION_MISMATCH");
  return state;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    run(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
