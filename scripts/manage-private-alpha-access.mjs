import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];
const CONFIRMATION = "NON_PRODUCTION_REMOTE_CONFIRMED";

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
  const target = process.env.OPERATIONAL_TEST_TARGET?.trim().toLowerCase();
  const confirmation = process.env.OPERATIONAL_TEST_CONFIRM?.trim();
  const declaredProjectRef = process.env.OPERATIONAL_TEST_PROJECT_REF?.trim();
  const config = getSupabaseConfig({ envFiles: ENV_FILES });

  if (!new Set(["development", "staging"]).has(target)) {
    fail("OPERATIONAL_TEST_TARGET deve ser development ou staging.");
  }
  if (confirmation !== CONFIRMATION) {
    fail(`OPERATIONAL_TEST_CONFIRM deve ser ${CONFIRMATION}.`);
  }
  if (!config.url || !declaredProjectRef) {
    fail("URL do Supabase e OPERATIONAL_TEST_PROJECT_REF sao obrigatorios.");
  }

  const url = new URL(config.url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== `${declaredProjectRef}.supabase.co`
  ) {
    fail("O projeto declarado nao corresponde ao Supabase configurado.");
  }
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
