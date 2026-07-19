#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";
import { assertAuthorizedNonProductionTarget } from "./lib/non-production-target.mjs";
import { evaluateSupabaseAuthEmailReadiness } from "./private-alpha-email-readiness.mjs";
import {
  requestAuthConfig,
  resolveAccessToken,
  resolveProjectRef,
  validateTokenEnvName,
} from "./security/supabase-auth-hibp.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];
const SMTP_APPLY_CONFIRMATION = "CONFIGURE_SUPABASE_AUTH_SMTP_CONFIRMED";

const REQUIRED_SMTP_ENV = [
  "SUPABASE_AUTH_SMTP_ADMIN_EMAIL",
  "SUPABASE_AUTH_SMTP_HOST",
  "SUPABASE_AUTH_SMTP_PORT",
  "SUPABASE_AUTH_SMTP_USER",
  "SUPABASE_AUTH_SMTP_PASS",
  "SUPABASE_AUTH_SMTP_SENDER_NAME",
];

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseArgs(args) {
  const parsed = {
    action: "check",
    projectRef: undefined,
    requireReady: false,
    tokenEnv: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--check") {
      parsed.action = "check";
      continue;
    }
    if (arg === "--apply") {
      parsed.action = "apply";
      continue;
    }
    if (arg === "--require-ready") {
      parsed.requireReady = true;
      continue;
    }
    if (arg === "--project-ref") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--project-ref exige um valor.");
      }
      parsed.projectRef = value.trim();
      index += 1;
      continue;
    }
    if (arg === "--token-env") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--token-env exige um valor.");
      }
      validateTokenEnvName(value.trim());
      parsed.tokenEnv = value.trim();
      index += 1;
      continue;
    }
    throw new Error(`Argumento desconhecido: ${arg}.`);
  }

  return parsed;
}

function isValidEmail(value) {
  const email = cleanString(value);
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function getMissingSmtpEnv(env = process.env) {
  return REQUIRED_SMTP_ENV.filter((key) => !cleanString(env[key]));
}

export function evaluateSmtpOperatorEnv(env = process.env) {
  const missing = getMissingSmtpEnv(env);
  const port = Number(cleanString(env.SUPABASE_AUTH_SMTP_PORT));
  const validPort = Number.isInteger(port) && port > 0 && port <= 65535;
  const validAdminEmail = isValidEmail(env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL);

  let failureCode = null;
  if (missing.length > 0) failureCode = "missing_smtp_env";
  else if (!validPort) failureCode = "invalid_smtp_port";
  else if (!validAdminEmail) failureCode = "invalid_smtp_admin_email";

  return Object.freeze({
    configured: !failureCode,
    failureCode,
    missingKeys: missing,
    validAdminEmail,
    validPort,
  });
}

export function createAuthSmtpPatchPayload(env = process.env) {
  const status = evaluateSmtpOperatorEnv(env);
  if (!status.configured) {
    throw new Error(status.failureCode ?? "smtp_env_invalid");
  }

  return Object.freeze({
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_admin_email: cleanString(env.SUPABASE_AUTH_SMTP_ADMIN_EMAIL),
    smtp_host: cleanString(env.SUPABASE_AUTH_SMTP_HOST),
    smtp_pass: cleanString(env.SUPABASE_AUTH_SMTP_PASS),
    smtp_port: Number(cleanString(env.SUPABASE_AUTH_SMTP_PORT)),
    smtp_sender_name: cleanString(env.SUPABASE_AUTH_SMTP_SENDER_NAME),
    smtp_user: cleanString(env.SUPABASE_AUTH_SMTP_USER),
  });
}

function createStatus(fields) {
  return Object.freeze({
    action: "check",
    authEmail: null,
    checkedAt: new Date().toISOString(),
    operatorEnv: null,
    projectRef: null,
    ready: false,
    ...fields,
  });
}

export async function checkSupabaseAuthSmtp({ projectRef, token }) {
  const authConfig = await requestAuthConfig(projectRef, token);
  const authEmail = evaluateSupabaseAuthEmailReadiness(authConfig);
  return createStatus({
    action: "check",
    authEmail,
    projectRef,
    ready: authEmail.ready,
  });
}

export async function applySupabaseAuthSmtp({
  env = process.env,
  projectRef,
  token,
}) {
  const operatorEnv = evaluateSmtpOperatorEnv(env);
  if (!operatorEnv.configured) {
    return createStatus({
      action: "apply",
      operatorEnv,
      projectRef,
      ready: false,
    });
  }

  await requestAuthConfig(projectRef, token, {
    method: "PATCH",
    body: JSON.stringify(createAuthSmtpPatchPayload(env)),
  });
  const check = await checkSupabaseAuthSmtp({ projectRef, token });
  return createStatus({
    action: "apply",
    authEmail: check.authEmail,
    operatorEnv,
    projectRef,
    ready: check.ready,
  });
}

async function main() {
  loadSupabaseScriptEnv(ENV_FILES);
  const options = parseArgs(process.argv.slice(2));
  const config = getSupabaseConfig({ envFiles: ENV_FILES });
  const target = assertAuthorizedNonProductionTarget({
    supabaseUrl: config.url,
  });
  const projectRef = resolveProjectRef(options.projectRef ?? target.projectRef);
  if (projectRef !== target.projectRef) {
    throw new Error("Project ref explicito diverge do alvo operacional.");
  }
  const token = resolveAccessToken(options.tokenEnv);

  if (!token.value) {
    const status = createStatus({
      action: options.action,
      authEmail: {
        failureCode: "missing_management_pat",
        ready: false,
      },
      projectRef,
    });
    console.log(JSON.stringify(status, null, 2));
    if (options.requireReady) {
      throw new Error("Gate bloqueado: PAT de Management API ausente.");
    }
    return;
  }

  if (options.action === "apply") {
    if (
      process.env.SUPABASE_AUTH_SMTP_APPLY_CONFIRM !== SMTP_APPLY_CONFIRMATION
    ) {
      const status = createStatus({
        action: "apply",
        operatorEnv: evaluateSmtpOperatorEnv(),
        projectRef,
        ready: false,
      });
      console.log(JSON.stringify(status, null, 2));
      throw new Error(
        `Defina SUPABASE_AUTH_SMTP_APPLY_CONFIRM=${SMTP_APPLY_CONFIRMATION} para aplicar SMTP Auth.`,
      );
    }

    let status;
    try {
      status = await applySupabaseAuthSmtp({
        projectRef,
        token: token.value,
      });
    } catch {
      status = createStatus({
        action: "apply",
        authEmail: {
          failureCode: "auth_smtp_apply_failed",
          ready: false,
        },
        operatorEnv: evaluateSmtpOperatorEnv(),
        projectRef,
      });
    }

    console.log(JSON.stringify(status, null, 2));
    if (options.requireReady && !status.ready) {
      throw new Error("Gate bloqueado: SMTP Auth nao ficou pronto.");
    }
    return;
  }

  let status;
  try {
    status = await checkSupabaseAuthSmtp({
      projectRef,
      token: token.value,
    });
  } catch {
    status = createStatus({
      action: "check",
      authEmail: {
        failureCode: "auth_config_access_failed",
        ready: false,
      },
      projectRef,
    });
  }
  console.log(JSON.stringify(status, null, 2));
  if (options.requireReady && !status.ready) {
    throw new Error("Gate bloqueado: SMTP Auth nao esta pronto.");
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Falha ao operar SMTP Auth.",
    );
    process.exitCode = 1;
  });
}
