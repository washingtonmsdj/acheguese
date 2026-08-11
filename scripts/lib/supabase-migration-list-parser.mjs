import { parseSupabaseCliJsonValues } from "./supabase-cli-json.mjs";

const MIGRATION_VERSION_PATTERN = /^\d{14}$/;

export function parseSupabaseMigrationListOutput(output) {
  const jsonEnvelope = parseSupabaseCliJsonValues(output).find(
    (value) => value && Array.isArray(value.migrations),
  );

  if (jsonEnvelope) {
    return jsonEnvelope.migrations
      .map((row) => ({
        local:
          typeof row?.local === "string" &&
          MIGRATION_VERSION_PATTERN.test(row.local)
            ? row.local
            : null,
        remote:
          typeof row?.remote === "string" &&
          MIGRATION_VERSION_PATTERN.test(row.remote)
            ? row.remote
            : null,
        timeUtc: typeof row?.time === "string" ? row.time : "",
      }))
      .filter((row) => row.local || row.remote);
  }

  const tableRows = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("|"))
    .map((line) => line.replace(/\|$/, ""))
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 3)
    .map(([local, remote, timeUtc]) => ({
      local: local || null,
      remote: remote || null,
      timeUtc,
    }))
    .filter(
      (row) =>
        MIGRATION_VERSION_PATTERN.test(row.local ?? "") ||
        MIGRATION_VERSION_PATTERN.test(row.remote ?? ""),
    );

  if (
    tableRows.length > 0 ||
    /LOCAL\s*\|\s*REMOTE\s*\|\s*TIME(?:\s*\(UTC\))?/i.test(output)
  ) {
    return tableRows;
  }

  throw new Error(
    "Supabase CLI migration list output format is not recognized.",
  );
}

export function classifyMigrationDrift(rows) {
  return {
    localOnly: rows.filter((row) => row.local && !row.remote),
    remoteOnly: rows.filter((row) => row.remote && !row.local),
  };
}
