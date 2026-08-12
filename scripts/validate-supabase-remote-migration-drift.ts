import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { classifySupabaseCliFailure } from "./lib/supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "./lib/supabase-cli-query-json.mjs";
import { runSupabaseCli } from "./lib/supabase-cli-runner.mjs";
import {
  classifyMigrationDrift,
  parseSupabaseMigrationListOutput,
} from "./lib/supabase-migration-list-parser.mjs";

interface MigrationDriftRow {
  local: string | null;
  remote: string | null;
  timeUtc: string;
}

function runSupabaseMigrationList(): string {
  const result = runSupabaseCli(["migration", "list", "--linked"], {
    cwd: process.cwd(),
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (result.error) {
    throw new Error(
      `LOCAL_FAILURE: falha ao executar Supabase CLI: ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    const validationState = classifySupabaseCliFailure(output);
    throw new Error(
      [
        `${validationState}: nao foi possivel consultar migrations com \`supabase migration list --linked\`.`,
        output.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return output;
}

function readLocalMigrationVersions(): Set<string> {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  return new Set(
    readdirSync(migrationsDir)
      .map((fileName) => fileName.match(/^(\d{14})_.+\.sql$/)?.[1])
      .filter((version): version is string => Boolean(version)),
  );
}

function runSupabaseMigrationQuery(): Set<string> {
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-migration-drift-"));
  const sqlPath = join(tempDir, "remote-migrations.sql");
  writeFileSync(
    sqlPath,
    "select version::text as version from supabase_migrations.schema_migrations order by version;",
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
          `${classifySupabaseCliFailure(output)}: fallback read-only migration query failed.`,
          output.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    const rows = parseSupabaseQueryRows(output);
    const versions = rows
      .map((row) => (typeof row?.version === "string" ? row.version : ""))
      .filter((version) => /^\d{14}$/.test(version));
    if (versions.length === 0) {
      throw new Error(
        "REMOTE_VALIDATION_REQUIRED: fallback returned no migration versions.",
      );
    }
    return new Set(versions);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function formatVersions(
  rows: MigrationDriftRow[],
  side: "local" | "remote",
): string {
  const versions = rows
    .map((row) => row[side])
    .filter((version): version is string => Boolean(version));

  return versions.length > 0 ? versions.join(", ") : "nenhuma";
}

function main() {
  let localOnly: MigrationDriftRow[];
  let remoteOnly: MigrationDriftRow[];

  try {
    const output = runSupabaseMigrationList();
    const rows = parseSupabaseMigrationListOutput(output);
    ({ localOnly, remoteOnly } = classifyMigrationDrift(rows));
  } catch (migrationListError) {
    try {
      const localVersions = readLocalMigrationVersions();
      const remoteVersions = runSupabaseMigrationQuery();
      const versions = new Set([...localVersions, ...remoteVersions]);
      localOnly = [...versions]
        .filter(
          (version) =>
            localVersions.has(version) && !remoteVersions.has(version),
        )
        .map((version) => ({ local: version, remote: null, timeUtc: "" }));
      remoteOnly = [...versions]
        .filter(
          (version) =>
            remoteVersions.has(version) && !localVersions.has(version),
        )
        .map((version) => ({ local: null, remote: version, timeUtc: "" }));
      console.warn(
        "WARN: `supabase migration list --linked` indisponivel; drift reconciliado por query read-only do historico remoto.",
      );
    } catch (fallbackError) {
      throw new Error(
        [
          migrationListError instanceof Error
            ? migrationListError.message
            : String(migrationListError),
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
        ].join("\n"),
      );
    }
  }

  if (localOnly.length === 0 && remoteOnly.length === 0) {
    console.log(
      "PASS: historico de migrations local/remoto esta sincronizado.",
    );
    return;
  }

  console.error(
    "LOCAL_FAILURE: drift de migrations Supabase detectado contra o projeto remoto linkado.\n",
  );
  console.error(`Remotas ausentes localmente (${remoteOnly.length}):`);
  console.error(formatVersions(remoteOnly, "remote"));
  console.error("");
  console.error(`Locais ausentes no remoto (${localOnly.length}):`);
  console.error(formatVersions(localOnly, "local"));
  console.error("");
  if (remoteOnly.length > 0) {
    console.error(
      [
        "Nao execute `supabase db push --linked` enquanto o drift nao for revisado.",
        "Primeiro recupere ou reconcilie as migrations remotas ausentes localmente,",
        "depois rode `supabase db push --linked --dry-run` novamente.",
      ].join(" "),
    );
  } else {
    console.error(
      [
        "Nao execute release enquanto houver migrations locais pendentes no remoto.",
        "Revise o plano com `supabase db push --linked --dry-run --include-all`",
        "e aplique ou reconcilie o lote pelo processo de deploy aprovado.",
      ].join(" "),
    );
  }

  process.exit(1);
}

main();
