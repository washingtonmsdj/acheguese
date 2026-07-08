import { spawnSync } from "node:child_process";

interface MigrationDriftRow {
  local: string | null;
  remote: string | null;
  timeUtc: string;
}

function runSupabaseMigrationList(): string {
  const command = process.platform === "win32" ? "cmd.exe" : "supabase";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "supabase", "migration", "list", "--linked"]
      : ["migration", "list", "--linked"];
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  if (result.error) {
    throw new Error(`Falha ao executar Supabase CLI: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      [
        "Falha ao consultar migrations remotas com `supabase migration list --linked`.",
        output.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return output;
}

function parseMigrationRows(output: string): MigrationDriftRow[] {
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
    .filter((row) => /^\d{14}$/.test(row.local ?? "") || /^\d{14}$/.test(row.remote ?? ""));
}

function formatVersions(rows: MigrationDriftRow[], side: "local" | "remote"): string {
  const versions = rows
    .map((row) => row[side])
    .filter((version): version is string => Boolean(version));

  return versions.length > 0 ? versions.join(", ") : "nenhuma";
}

function main() {
  const output = runSupabaseMigrationList();
  const rows = parseMigrationRows(output);
  const localOnly = rows.filter((row) => row.local && !row.remote);
  const remoteOnly = rows.filter((row) => row.remote && !row.local);

  if (localOnly.length === 0 && remoteOnly.length === 0) {
    console.log("Historico de migrations local/remoto esta sincronizado.");
    return;
  }

  console.error("Drift de migrations Supabase detectado contra o projeto remoto linkado.\n");
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
