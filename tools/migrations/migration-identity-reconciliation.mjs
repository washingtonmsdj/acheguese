export function parseLocalMigrationFileName(fileName) {
  const match = /^(\d{14})_(.+)\.sql$/.exec(fileName);
  if (!match) return null;
  return {
    version: match[1],
    name: match[2],
    fileName,
  };
}

export function normalizeMigrationSqlForIdentity(sql) {
  return String(sql ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .trim();
}

export function findDuplicateLocalVersions(localMigrations) {
  const byVersion = new Map();
  for (const migration of localMigrations) {
    const files = byVersion.get(migration.version) ?? [];
    files.push(migration.fileName);
    byVersion.set(migration.version, files);
  }

  return [...byVersion.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([version, files]) => ({ version, files: [...files].sort() }))
    .sort((a, b) => a.version.localeCompare(b.version));
}

function normalizedRemoteSql(remoteMigration) {
  const statements = Array.isArray(remoteMigration.statements)
    ? remoteMigration.statements.filter((statement) => typeof statement === "string")
    : [];
  if (statements.length === 0) return null;
  return normalizeMigrationSqlForIdentity(statements.join("\n"));
}

export function reconcileMigrationIdentities(localMigrations, remoteMigrations) {
  const exact = [];
  const aliases = [];
  const conflicts = [];
  const localOnly = [];
  const remoteOnly = [];

  const remoteByVersion = new Map(
    remoteMigrations.map((migration) => [migration.version, migration]),
  );
  const remoteByName = new Map();
  for (const migration of remoteMigrations) {
    const records = remoteByName.get(migration.name) ?? [];
    records.push(migration);
    remoteByName.set(migration.name, records);
  }

  const matchedRemoteVersions = new Set();
  const unmatchedLocal = [];

  for (const local of localMigrations) {
    const remote = remoteByVersion.get(local.version);
    if (!remote) {
      unmatchedLocal.push(local);
      continue;
    }

    matchedRemoteVersions.add(remote.version);
    if (remote.name !== local.name) {
      conflicts.push({
        kind: "version_name_mismatch",
        local,
        remote,
      });
      continue;
    }

    exact.push({ local, remote });
  }

  for (const local of unmatchedLocal) {
    const candidates = (remoteByName.get(local.name) ?? []).filter(
      (remote) => !matchedRemoteVersions.has(remote.version),
    );

    if (candidates.length !== 1) {
      localOnly.push(local);
      if (candidates.length > 1) {
        conflicts.push({
          kind: "ambiguous_remote_name",
          local,
          remoteCandidates: candidates,
        });
      }
      continue;
    }

    const remote = candidates[0];
    const remoteSql = normalizedRemoteSql(remote);
    const localSql = normalizeMigrationSqlForIdentity(local.sql);
    if (!remoteSql || remoteSql !== localSql) {
      conflicts.push({
        kind: "name_content_mismatch",
        local,
        remote,
      });
      continue;
    }

    matchedRemoteVersions.add(remote.version);
    aliases.push({ local, remote });
  }

  for (const remote of remoteMigrations) {
    if (!matchedRemoteVersions.has(remote.version)) {
      remoteOnly.push(remote);
    }
  }

  return {
    exact,
    aliases,
    conflicts,
    localOnly,
    remoteOnly,
  };
}
