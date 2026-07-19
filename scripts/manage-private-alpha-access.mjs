import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";
import { assertAuthorizedNonProductionTarget as assertAuthorizedNonProductionTargetImpl } from "./lib/non-production-target.mjs";
import { auditSupabaseAuthReadiness } from "./supabase-auth-readiness.mjs";
import { getSupabaseBackupReadiness } from "./supabase-backup-readiness.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];
const EMAIL_ACTIONS = new Set(["invite", "revoke"]);
const STATE_ACTIONS = new Set(["pause", "resume", "status"]);

function fail(message) {
  throw new Error(message);
}

function normalizeEmail(value) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    fail("Informe um e-mail valido.");
  }
  return email;
}

function assertAuthorizedNonProductionTarget() {
  const config = getSupabaseConfig({ envFiles: ENV_FILES });
  return assertAuthorizedNonProductionTargetImpl({ supabaseUrl: config.url });
}

export function requiresRestorableBackup(action) {
  return action === "invite" || action === "resume";
}

async function main() {
  loadSupabaseScriptEnv(ENV_FILES);

  const action = process.argv[2];

  if (!EMAIL_ACTIONS.has(action) && !STATE_ACTIONS.has(action)) {
    fail("Use invite, revoke, pause, resume ou status como acao.");
  }

  const email = EMAIL_ACTIONS.has(action)
    ? normalizeEmail(process.argv[3])
    : null;
  const target = assertAuthorizedNonProductionTarget();

  let admin = null;
  if (requiresRestorableBackup(action)) {
    const recovery = getSupabaseBackupReadiness(target.projectRef);
    if (!recovery.ready) {
      fail(
        "Alpha permanece fechada: nao existe backup COMPLETED recente nem PITR acessivel. Execute npm run alpha:backup:gate depois de habilitar a recuperacao.",
      );
    }
    admin = createServiceRoleClient({ envFiles: ENV_FILES });
    const authReadiness = await auditSupabaseAuthReadiness(admin);
    if (!authReadiness.ready) {
      fail(
        `Alpha permanece fechada: integridade do Auth reprovada (${authReadiness.failureCode ?? "unknown"}). Execute npm run alpha:auth:gate.`,
      );
    }
  }

  admin ??= createServiceRoleClient({ envFiles: ENV_FILES });

  if (action === "invite") {
    const { data, error } = await admin.rpc("alpha_access_issue_invite", {
      p_email: email,
    });
    if (error || !data) fail(error?.message ?? "Falha ao emitir convite.");
    console.log(`Convite de alpha emitido para ${email}.`);
  } else if (action === "revoke") {
    const { data, error } = await admin.rpc("alpha_access_revoke_invite", {
      p_email: email,
    });
    if (error) fail(error.message);
    console.log(
      data
        ? `Convite de alpha revogado para ${email}.`
        : `Nenhum convite ativo encontrado para ${email}.`,
    );
  } else if (action === "status") {
    const { data, error } = await admin.rpc("alpha_access_get_status");
    if (error || !data) fail(error?.message ?? "Falha ao consultar a alpha.");
    console.log(JSON.stringify(data));
  } else {
    const { data, error } = await admin.rpc("alpha_access_set_admissions", {
      p_enabled: action === "resume",
    });
    if (error || !data) fail(error?.message ?? "Falha ao alterar a admissao.");
    console.log(JSON.stringify(data));
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    await main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Falha na operacao da alpha.",
    );
    process.exitCode = 1;
  }
}
