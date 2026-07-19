export const NON_PRODUCTION_REMOTE_CONFIRMATION =
  "NON_PRODUCTION_REMOTE_CONFIRMED";

const ALLOWED_TARGETS = new Set(["development", "staging"]);

export function assertAuthorizedNonProductionTarget({
  supabaseUrl,
  env = process.env,
} = {}) {
  const target = env.OPERATIONAL_TEST_TARGET?.trim().toLowerCase();
  const confirmation = env.OPERATIONAL_TEST_CONFIRM?.trim();
  const projectRef = env.OPERATIONAL_TEST_PROJECT_REF?.trim();

  if (!ALLOWED_TARGETS.has(target)) {
    throw new Error("OPERATIONAL_TEST_TARGET deve ser development ou staging.");
  }
  if (confirmation !== NON_PRODUCTION_REMOTE_CONFIRMATION) {
    throw new Error(
      `OPERATIONAL_TEST_CONFIRM deve ser ${NON_PRODUCTION_REMOTE_CONFIRMATION}.`,
    );
  }
  if (!supabaseUrl || !projectRef) {
    throw new Error(
      "URL do Supabase e OPERATIONAL_TEST_PROJECT_REF sao obrigatorios.",
    );
  }
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error("OPERATIONAL_TEST_PROJECT_REF possui formato invalido.");
  }

  let url;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error("URL do Supabase invalida.");
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.hostname !== `${projectRef}.supabase.co`
  ) {
    throw new Error(
      "O projeto declarado nao corresponde ao Supabase configurado.",
    );
  }

  return Object.freeze({ projectRef, target, url: url.toString() });
}
