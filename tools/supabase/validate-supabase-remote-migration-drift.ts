import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { classifySupabaseCliFailure } from "./supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "./supabase-cli-query-json.mjs";
import { runSupabaseCli } from "./supabase-cli-runner.mjs";
import {
  findDuplicateLocalVersions,
  parseLocalMigrationFileName,
  reconcileMigrationIdentities,
} from "../migrations/migration-identity-reconciliation.mjs";

interface LocalMigration {
  version: string;
  name: string;
  fileName: string;
  sql: string;
}

interface RemoteMigration {
  version: string;
  name: string;
  statements: string[];
}

function readLocalMigrations(): LocalMigration[] {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  return readdirSync(migrationsDir)
    .map((fileName) => {
      const parsed = parseLocalMigrationFileName(fileName);
      if (!parsed) return null;
      return {
        ...parsed,
        sql: readFileSync(join(migrationsDir, fileName), "utf8"),
      };
    })
    .filter((migration): migration is LocalMigration => Boolean(migration))
    .sort((a, b) =>
      a.version.localeCompare(b.version) || a.name.localeCompare(b.name),
    );
}

function parseStatements(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((statement): statement is string => typeof statement === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (statement): statement is string => typeof statement === "string",
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}

function runSupabaseMigrationQuery(): RemoteMigration[] {
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-migration-drift-"));
  const sqlPath = join(tempDir, "remote-migrations.sql");
  writeFileSync(
    sqlPath,
    [
      "select version::text as version, name, statements",
      "from supabase_migrations.schema_migrations",
      "order by version;",
    ].join("\n"),
    "utf8",
  );

  try {
    const result = runSupabaseCli(
      ["db", "query", "--linked", "--output", "json", "--file", sqlPath],
      { cwd: process.cwd() },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.error || result.status !== 0) {
      throw new Error(
        [
          `${classifySupabaseCliFailure(output)}: nao foi possivel consultar o historico detalhado de migrations.`,
          output.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    const rows = parseSupabaseQueryRows(output);
    const migrations = rows
      .map((row): RemoteMigration | null => {
        const version = typeof row?.version === "string" ? row.version : "";
        const name = typeof row?.name === "string" ? row.name : "";
        if (!/^\d{14}$/.test(version) || !name) return null;
        return {
          version,
          name,
          statements: parseStatements(row?.statements),
        };
      })
      .filter((migration): migration is RemoteMigration => Boolean(migration));

    if (migrations.length === 0) {
      throw new Error(
        "REMOTE_VALIDATION_REQUIRED: consulta remota nao retornou migrations validas.",
      );
    }

    return migrations;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function printAliases(aliases: Array<{ local: LocalMigration; remote: RemoteMigration }>) {
  if (aliases.length === 0) return;
  console.error(`Aliases de versao comprovados por nome + SQL (${aliases.length}):`);
  for (const { local, remote } of aliases) {
    console.error(
      `- ${local.fileName} -> ${remote.version}_${remote.name}.sql`,
    );
  }
  console.error("");
}

function printConflicts(conflicts: Array<Record<string, any>>) {
  if (conflicts.length === 0) return;
  console.error(`Conflitos de identidade/conteudo (${conflicts.length}):`);
  for (const conflict of conflicts) {
    const local = conflict.local as LocalMigration | undefined;
    const remote = conflict.remote as RemoteMigration | undefined;
    console.error(
      `- ${conflict.kind}: local=${local?.fileName ?? "?"} remote=${remote ? `${remote.version}_${remote.name}` : "?"}`,
    );
  }
  console.error("");
}

function main() {
  const localMigrations = readLocalMigrations();
  const duplicateLocalVersions = findDuplicateLocalVersions(localMigrations);
  const remoteMigrations = runSupabaseMigrationQuery();
  const reconciliation = reconcileMigrationIdentities(
    localMigrations,
    remoteMigrations,
  ) as {
    exact: Array<{ local: LocalMigration; remote: RemoteMigration }>;
    aliases: Array<{ local: LocalMigration; remote: RemoteMigration }>;
    conflicts: Array<Record<string, any>>;
    localOnly: LocalMigration[];
    remoteOnly: RemoteMigration[];
  };

  const clean =
    duplicateLocalVersions.length === 0 &&
    reconciliation.aliases.length === 0 &&
    reconciliation.conflicts.length === 0 &&
    reconciliation.localOnly.length === 0 &&
    reconciliation.remoteOnly.length === 0;

  if (clean) {
    console.log(
      `PASS: ${reconciliation.exact.length} migrations locais/remotas estao em paridade de versao e nome.`,
    );
    return;
  }

  console.error(
    "LOCAL_FAILURE: drift de identidade de migrations Supabase detectado.\n",
  );

  if (duplicateLocalVersions.length > 0) {
    console.error(
      `Versoes locais duplicadas (${duplicateLocalVersions.length}):`,
    );
    for (const duplicate of duplicateLocalVersions) {
      console.error(`- ${duplicate.version}: ${duplicate.files.join(", ")}`);
    }
    console.error("");
  }

  printAliases(reconciliation.aliases);
  printConflicts(reconciliation.conflicts);

  if (reconciliation.remoteOnly.length > 0) {
    console.error(
      `Remotas sem identidade local reconciliada (${reconciliation.remoteOnly.length}):`,
    );
    for (const migration of reconciliation.remoteOnly) {
      console.error(`- ${migration.version}_${migration.name}`);
    }
    console.error("");
  }

  if (reconciliation.localOnly.length > 0) {
    console.error(
      `Locais sem identidade remota reconciliada (${reconciliation.localOnly.length}):`,
    );
    for (const migration of reconciliation.localOnly) {
      console.error(`- ${migration.fileName}`);
    }
    console.error("");
  }

  console.error(
    [
      "Nao execute `supabase db push --linked` enquanto este validator falhar.",
      "Aliases comprovados devem ser reconciliados alinhando o filename local a versao registrada no remoto, sem alterar o SQL.",
      "Conflitos de conteudo, nomes ambiguos e objetos local/remote-only exigem revisao manual de provenance.",
    ].join(" "),
  );

  process.exit(1);
}

main();
