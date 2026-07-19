#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";
import { assertAuthorizedNonProductionTarget } from "./lib/non-production-target.mjs";
import { auditPrivateAlphaEmailReadiness } from "./private-alpha-email-readiness.mjs";
import { auditSupabaseAuthReadiness } from "./supabase-auth-readiness.mjs";
import { getSupabaseBackupReadiness } from "./supabase-backup-readiness.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];

function createBlockedStatus(failureCode) {
  return Object.freeze({
    failureCode,
    ready: false,
  });
}

function collectBlockers({ admission, auth, backup, email }) {
  const blockers = [];

  if (!backup?.ready) {
    blockers.push({
      area: "recovery",
      code: backup?.failureCode ?? "backup_not_restorable",
      command: "npm run alpha:backup:gate",
    });
  }

  if (!email?.ready) {
    blockers.push({
      area: "email",
      code: "email_not_ready",
      command: "npm run alpha:email:gate",
    });
    if (email?.resend?.failureCode) {
      blockers.push({
        area: "email.resend",
        code: email.resend.failureCode,
        command: "npm run alpha:email:gate",
      });
    }
    if (email?.supabaseAuth?.failureCode) {
      blockers.push({
        area: "email.supabase_auth",
        code: email.supabaseAuth.failureCode,
        command: "npm run alpha:email:gate",
      });
    }
  }

  if (!auth?.ready) {
    blockers.push({
      area: "auth",
      code: auth?.failureCode ?? "auth_not_ready",
      command: "npm run alpha:auth:gate",
    });
  }

  if (!admission?.ready) {
    blockers.push({
      area: "alpha_access",
      code: admission?.failureCode ?? "alpha_status_unavailable",
      command: "npm run alpha:status",
    });
  }

  return blockers;
}

export function summarizePrivateAlphaReadiness(parts) {
  const blockers = collectBlockers(parts);
  const admission = parts.admission ?? createBlockedStatus("not_checked");
  const containment = Object.freeze({
    activeInvites: Number.isSafeInteger(admission.activeInvites)
      ? admission.activeInvites
      : null,
    admissionsEnabled:
      typeof admission.admissionsEnabled === "boolean"
        ? admission.admissionsEnabled
        : null,
    closed:
      admission.ready === true &&
      admission.activeInvites === 0 &&
      admission.admissionsEnabled === false,
  });

  return Object.freeze({
    blockers,
    checkedAt: new Date().toISOString(),
    containment,
    ready: blockers.length === 0,
  });
}

async function readAdmissionStatus(admin) {
  const { data, error } = await admin.rpc("alpha_access_get_status");
  if (error || !data || typeof data !== "object") {
    return createBlockedStatus("alpha_status_unavailable");
  }

  return Object.freeze({
    activeInvites: Number.isSafeInteger(data.active_invites)
      ? data.active_invites
      : null,
    admissionsEnabled:
      typeof data.admissions_enabled === "boolean"
        ? data.admissions_enabled
        : null,
    failureCode: null,
    ready:
      Number.isSafeInteger(data.active_invites) &&
      typeof data.admissions_enabled === "boolean",
  });
}

export async function auditPrivateAlphaReadiness() {
  loadSupabaseScriptEnv(ENV_FILES);
  const config = getSupabaseConfig({ envFiles: ENV_FILES });
  const target = assertAuthorizedNonProductionTarget({
    supabaseUrl: config.url,
  });

  let backup;
  try {
    backup = getSupabaseBackupReadiness(target.projectRef);
  } catch {
    backup = createBlockedStatus("backup_readiness_unavailable");
  }

  let email;
  try {
    email = await auditPrivateAlphaEmailReadiness({
      projectRef: target.projectRef,
    });
  } catch {
    email = createBlockedStatus("email_readiness_unavailable");
  }

  let admin;
  try {
    admin = createServiceRoleClient({ envFiles: ENV_FILES });
  } catch {
    const auth = createBlockedStatus("service_role_unavailable");
    const admission = createBlockedStatus("service_role_unavailable");
    return Object.freeze({
      admission,
      auth,
      backup,
      email,
      projectRef: target.projectRef,
      summary: summarizePrivateAlphaReadiness({
        admission,
        auth,
        backup,
        email,
      }),
      target: target.target,
    });
  }

  let auth;
  try {
    auth = await auditSupabaseAuthReadiness(admin);
  } catch {
    auth = createBlockedStatus("auth_readiness_unavailable");
  }

  const admission = await readAdmissionStatus(admin);
  return Object.freeze({
    admission,
    auth,
    backup,
    email,
    projectRef: target.projectRef,
    summary: summarizePrivateAlphaReadiness({
      admission,
      auth,
      backup,
      email,
    }),
    target: target.target,
  });
}

async function main() {
  const requireReady = process.argv.includes("--require-ready");
  const status = await auditPrivateAlphaReadiness();
  console.log(JSON.stringify(status, null, 2));
  if (requireReady && !status.summary.ready) {
    throw new Error(
      `Gate bloqueado: alpha privada possui ${status.summary.blockers.length} bloqueio(s).`,
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Falha ao auditar prontidao da alpha.",
    );
    process.exitCode = 1;
  });
}
