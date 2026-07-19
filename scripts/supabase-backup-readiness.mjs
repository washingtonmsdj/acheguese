#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getSupabaseConfig } from "./lib/supabase-client.mjs";

export const MAX_COMPLETED_BACKUP_AGE_HOURS = 36;

export function parseArguments(args) {
  const parsed = {
    json: false,
    projectRef: undefined,
    requireRestorable: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--json") parsed.json = true;
    else if (argument === "--require-restorable")
      parsed.requireRestorable = true;
    else if (argument === "--project-ref") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--project-ref exige um valor.");
      }
      parsed.projectRef = value;
      index += 1;
    } else throw new Error(`Argumento desconhecido: ${argument}.`);
  }

  if (parsed.projectRef !== undefined) validateProjectRef(parsed.projectRef);
  return parsed;
}

export function validateProjectRef(projectRef) {
  if (typeof projectRef !== "string" || !/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error("Project ref do Supabase possui formato invalido.");
  }
}

export function parseSupabaseBackupListJson(output) {
  const value = String(output ?? "").trim();
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Supabase CLI nao retornou JSON de backups.");
  }

  let parsed;
  try {
    parsed = JSON.parse(value.slice(start, end + 1));
  } catch (error) {
    throw new Error(
      `JSON de backups invalido: ${error instanceof Error ? error.message : "erro desconhecido"}.`,
    );
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.backups)) {
    throw new Error("Resposta de backups nao possui o contrato esperado.");
  }
  return parsed;
}

function getBackupTimestamp(backup) {
  if (!backup || typeof backup !== "object") return null;
  for (const key of ["inserted_at", "created_at", "started_at", "date"]) {
    const candidate = backup[key];
    if (
      typeof candidate === "string" &&
      Number.isFinite(Date.parse(candidate))
    ) {
      return new Date(candidate).toISOString();
    }
  }
  return null;
}

export function evaluateBackupReadiness(
  payload,
  projectRef,
  checkedAt = new Date(),
) {
  validateProjectRef(projectRef);
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(payload.backups)
  ) {
    throw new Error("Payload de backups invalido.");
  }

  const completedBackups = payload.backups.filter(
    (backup) => backup?.status === "COMPLETED",
  );
  const timestamps = completedBackups
    .map(getBackupTimestamp)
    .filter(Boolean)
    .sort();
  const pitrEnabled = payload.pitr_enabled === true;
  const backupCount = payload.backups.length;
  const latestBackupAt = timestamps.at(-1) ?? null;
  const latestBackupAgeHours = latestBackupAt
    ? (checkedAt.getTime() - Date.parse(latestBackupAt)) / 3_600_000
    : null;
  const recentCompletedBackup =
    latestBackupAgeHours !== null &&
    latestBackupAgeHours >= -1 &&
    latestBackupAgeHours <= MAX_COMPLETED_BACKUP_AGE_HOURS;

  return {
    backupCount,
    checkedAt: checkedAt.toISOString(),
    completedBackupCount: completedBackups.length,
    latestBackupAgeHours,
    latestBackupAt,
    pitrEnabled,
    projectRef,
    ready: pitrEnabled || recentCompletedBackup,
    region: typeof payload.region === "string" ? payload.region : null,
    walgEnabled: payload.walg_enabled === true,
  };
}

function projectRefFromUrl(urlValue) {
  if (!urlValue) return undefined;
  try {
    const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(
      new URL(urlValue).hostname,
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}

function resolveProjectRef(explicitProjectRef) {
  const config = getSupabaseConfig();
  const projectRef =
    explicitProjectRef ??
    process.env.SUPABASE_PROJECT_REF?.trim() ??
    process.env.OPERATIONAL_TEST_PROJECT_REF?.trim() ??
    config.projectId ??
    projectRefFromUrl(config.url);
  validateProjectRef(projectRef);
  return projectRef;
}

function runBackupList(projectRef) {
  const args = [
    "backups",
    "list",
    "--project-ref",
    projectRef,
    "--output",
    "json",
  ];
  const result = spawnSync("supabase", args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
    shell: false,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error(
      "Supabase CLI nao encontrada. Instale uma versao oficial antes da auditoria.",
    );
  }
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const diagnostic = `${result.stdout ?? ""}\n${result.stderr ?? ""}`
      .trim()
      .split(/\r?\n/)
      .slice(-12)
      .join("\n");
    throw new Error(`Falha ao consultar backups do Supabase.\n${diagnostic}`);
  }
  return parseSupabaseBackupListJson(result.stdout);
}

export function getSupabaseBackupReadiness(projectRef) {
  validateProjectRef(projectRef);
  return evaluateBackupReadiness(runBackupList(projectRef), projectRef);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const projectRef = resolveProjectRef(args.projectRef);
  const status = getSupabaseBackupReadiness(projectRef);

  if (args.json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(`Projeto: ${status.projectRef}`);
    console.log(`Regiao: ${status.region ?? "nao informada"}`);
    console.log(`Registros de backup: ${status.backupCount}`);
    console.log(`Backups concluidos: ${status.completedBackupCount}`);
    console.log(
      `Backup concluido mais recente: ${status.latestBackupAt ?? "nenhum"}`,
    );
    console.log(`PITR: ${status.pitrEnabled ? "ativo" : "inativo"}`);
    console.log(`Restore disponivel: ${status.ready ? "sim" : "nao"}`);
  }

  if (args.requireRestorable && !status.ready) {
    throw new Error(
      "Gate bloqueado: nao existe backup acessivel nem PITR para restauracao.",
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Falha ao auditar backups.",
    );
    process.exitCode = 1;
  });
}
