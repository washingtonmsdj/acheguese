const MIGRATION_VERSION_PATTERN = /^\d{14}$/;

export function parseSupabaseMigrationListOutput(output) {
  return output
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
}

export function classifyMigrationDrift(rows) {
  return {
    localOnly: rows.filter((row) => row.local && !row.remote),
    remoteOnly: rows.filter((row) => row.remote && !row.local),
  };
}
