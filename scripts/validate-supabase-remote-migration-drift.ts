import { classifySupabaseCliFailure } from "./lib/supabase-cli-validation-state.mjs";
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
  const output = runSupabaseMigrationList();
  const rows = parseSupabaseMigrationListOutput(output);
  const { localOnly, remoteOnly } = classifyMigrationDrift(rows);

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
