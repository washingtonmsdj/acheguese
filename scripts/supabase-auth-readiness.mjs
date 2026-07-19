#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client.mjs";
import { assertAuthorizedNonProductionTarget } from "./lib/non-production-target.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_MAX_USERS = 10_000;

function result(fields) {
  return Object.freeze({
    checkedAt: new Date().toISOString(),
    checkedUsers: 0,
    failedPage: null,
    failureCode: null,
    permanentUsersWithoutIdentity: 0,
    ready: false,
    reportedTotal: null,
    ...fields,
  });
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function auditSupabaseAuthReadiness(admin, options = {}) {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const maxUsers = options.maxUsers ?? DEFAULT_MAX_USERS;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    throw new Error("pageSize deve ser um inteiro entre 1 e 1000.");
  }
  if (!Number.isInteger(maxUsers) || maxUsers < pageSize) {
    throw new Error("maxUsers deve ser um inteiro maior ou igual a pageSize.");
  }

  const seenUserIds = new Set();
  let checkedUsers = 0;
  let reportedTotal = null;

  for (let page = 1; ; page += 1) {
    const response = await admin.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });
    if (response.error) {
      return result({
        checkedUsers,
        failedPage: page,
        failureCode: "auth_admin_list_failed",
        reportedTotal,
      });
    }

    const users = response.data?.users;
    if (!Array.isArray(users)) {
      return result({
        checkedUsers,
        failedPage: page,
        failureCode: "invalid_auth_admin_response",
        reportedTotal,
      });
    }

    const responseTotal = Number(response.data?.total);
    if (Number.isSafeInteger(responseTotal) && responseTotal >= 0) {
      reportedTotal = responseTotal;
      if (reportedTotal > maxUsers) {
        return result({
          checkedUsers,
          failedPage: page,
          failureCode: "auth_audit_limit_exceeded",
          reportedTotal,
        });
      }
    }

    let permanentUsersWithoutIdentity = 0;
    for (const user of users) {
      if (!isRecord(user) || typeof user.id !== "string") {
        return result({
          checkedUsers,
          failedPage: page,
          failureCode: "invalid_auth_user_record",
          reportedTotal,
        });
      }
      if (seenUserIds.has(user.id)) {
        return result({
          checkedUsers,
          failedPage: page,
          failureCode: "duplicate_auth_user_record",
          reportedTotal,
        });
      }

      seenUserIds.add(user.id);
      checkedUsers += 1;
      const identitiesProvided = Object.prototype.hasOwnProperty.call(
        user,
        "identities",
      );
      if (
        identitiesProvided &&
        user.identities !== null &&
        !Array.isArray(user.identities)
      ) {
        return result({
          checkedUsers,
          failedPage: page,
          failureCode: "invalid_auth_user_record",
          reportedTotal,
        });
      }
      if (
        user.is_anonymous !== true &&
        Array.isArray(user.identities) &&
        user.identities.length === 0
      ) {
        permanentUsersWithoutIdentity += 1;
      }
    }

    if (permanentUsersWithoutIdentity > 0) {
      return result({
        checkedUsers,
        failedPage: page,
        failureCode: "permanent_user_without_identity",
        permanentUsersWithoutIdentity,
        reportedTotal,
      });
    }
    if (reportedTotal !== null && checkedUsers >= reportedTotal) break;
    if (users.length < pageSize) break;
    if (checkedUsers >= maxUsers) {
      return result({
        checkedUsers,
        failedPage: page,
        failureCode: "auth_audit_limit_exceeded",
        reportedTotal,
      });
    }
  }

  return result({ checkedUsers, ready: true, reportedTotal });
}

async function main() {
  loadSupabaseScriptEnv(ENV_FILES);
  const requireReady = process.argv.includes("--require-ready");
  const config = getSupabaseConfig({ envFiles: ENV_FILES });
  assertAuthorizedNonProductionTarget({ supabaseUrl: config.url });
  const admin = createServiceRoleClient({ envFiles: ENV_FILES });
  const status = await auditSupabaseAuthReadiness(admin);

  console.log(JSON.stringify(status, null, 2));
  if (requireReady && !status.ready) {
    throw new Error(
      `Gate bloqueado: integridade do Auth reprovada (${status.failureCode ?? "unknown"}).`,
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Falha ao auditar o Auth.",
    );
    process.exitCode = 1;
  });
}
