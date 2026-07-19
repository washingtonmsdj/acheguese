import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";
import { assertAuthorizedNonProductionTarget as assertAuthorizedNonProductionTargetImpl } from "./lib/non-production-target.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];

loadSupabaseScriptEnv(ENV_FILES);

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

async function main() {
  const action = process.argv[2];
  const emailActions = new Set(["invite", "revoke"]);
  const stateActions = new Set(["pause", "resume", "status"]);

  if (!emailActions.has(action) && !stateActions.has(action)) {
    fail("Use invite, revoke, pause, resume ou status como acao.");
  }

  assertAuthorizedNonProductionTarget();
  const admin = createServiceRoleClient({ envFiles: ENV_FILES });
  const email = emailActions.has(action)
    ? normalizeEmail(process.argv[3])
    : null;

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

try {
  await main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Falha na operacao da alpha.",
  );
  process.exitCode = 1;
}
