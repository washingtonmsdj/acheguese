#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadSupabaseScriptEnv } from "./lib/supabase-client.mjs";
import {
  requestAuthConfig,
  resolveAccessToken,
  resolveProjectRef,
} from "./security/supabase-auth-hibp.mjs";

const ENV_FILES = [".env.local", ".env.remote", ".env.test", ".env"];
const RESEND_DOMAINS_URL = "https://api.resend.com/domains";

function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEmailDomain(value) {
  const email = cleanString(value);
  if (!email) return null;
  const match = email.match(/(?:<)?[^<>\s@]+@([^<>\s@]+)>?$/);
  return match?.[1]?.toLowerCase() ?? null;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function evaluateResendEmailReadiness(payload, fromEmail) {
  const fromDomain = getEmailDomain(fromEmail);
  const domains = Array.isArray(payload?.data)
    ? payload.data.filter(isRecord)
    : null;

  if (!domains) {
    return {
      domainCount: 0,
      failedRecordCount: 0,
      failureCode: "resend_invalid_response",
      fromConfigured: Boolean(fromDomain),
      matchingDomainFound: false,
      matchingDomainStatus: null,
      ready: false,
      verifiedDomainCount: 0,
    };
  }

  const matchingDomain = fromDomain
    ? domains.find(
        (domain) => cleanString(domain.name)?.toLowerCase() === fromDomain,
      )
    : undefined;
  const records = Array.isArray(matchingDomain?.records)
    ? matchingDomain.records.filter(isRecord)
    : [];
  const failedRecordCount = records.filter(
    (record) => record.status !== "verified",
  ).length;
  const matchingDomainStatus = cleanString(matchingDomain?.status);
  const verifiedDomainCount = domains.filter(
    (domain) => domain.status === "verified",
  ).length;
  const ready =
    Boolean(fromDomain) &&
    matchingDomainStatus === "verified" &&
    failedRecordCount === 0;

  let failureCode = null;
  if (!fromDomain) failureCode = "from_email_missing_or_invalid";
  else if (!matchingDomain) failureCode = "resend_domain_not_found";
  else if (matchingDomainStatus !== "verified")
    failureCode = "resend_domain_not_verified";
  else if (failedRecordCount > 0)
    failureCode = "resend_dns_records_not_verified";

  return {
    domainCount: domains.length,
    failedRecordCount,
    failureCode,
    fromConfigured: Boolean(fromDomain),
    matchingDomainFound: Boolean(matchingDomain),
    matchingDomainStatus,
    ready,
    verifiedDomainCount,
  };
}

export function evaluateSupabaseAuthEmailReadiness(authConfig) {
  if (!isRecord(authConfig)) {
    return {
      autoConfirmDisabled: false,
      customSmtpConfigured: false,
      externalEmailEnabled: false,
      failureCode: "invalid_auth_config",
      ready: false,
      senderConfigured: false,
    };
  }

  const externalEmailEnabled = authConfig.external_email_enabled === true;
  const autoConfirmDisabled = authConfig.mailer_autoconfirm === false;
  const senderConfigured = Boolean(
    getEmailDomain(authConfig.smtp_admin_email) &&
    cleanString(authConfig.smtp_sender_name),
  );
  const customSmtpConfigured = Boolean(
    cleanString(authConfig.smtp_host) &&
    cleanString(authConfig.smtp_user) &&
    Number.isInteger(authConfig.smtp_port) &&
    authConfig.smtp_port > 0 &&
    senderConfigured,
  );
  const ready =
    externalEmailEnabled && autoConfirmDisabled && customSmtpConfigured;

  let failureCode = null;
  if (!externalEmailEnabled) failureCode = "auth_email_disabled";
  else if (!autoConfirmDisabled) failureCode = "auth_email_autoconfirm_enabled";
  else if (!customSmtpConfigured)
    failureCode = "auth_custom_smtp_not_configured";

  return {
    autoConfirmDisabled,
    customSmtpConfigured,
    externalEmailEnabled,
    failureCode,
    ready,
    senderConfigured,
  };
}

async function requestResendDomains(apiKey, fetchImpl) {
  const response = await fetchImpl(RESEND_DOMAINS_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) {
    const error = new Error("Resend domains request failed.");
    error.code = "resend_access_failed";
    throw error;
  }
  try {
    return await response.json();
  } catch {
    const error = new Error("Resend domains response is invalid.");
    error.code = "resend_invalid_response";
    throw error;
  }
}

function blockedResendStatus(failureCode, fromEmail) {
  return {
    domainCount: 0,
    failedRecordCount: 0,
    failureCode,
    fromConfigured: Boolean(getEmailDomain(fromEmail)),
    matchingDomainFound: false,
    matchingDomainStatus: null,
    ready: false,
    verifiedDomainCount: 0,
  };
}

function blockedAuthStatus(failureCode) {
  return {
    autoConfirmDisabled: false,
    customSmtpConfigured: false,
    externalEmailEnabled: false,
    failureCode,
    ready: false,
    senderConfigured: false,
  };
}

export async function auditPrivateAlphaEmailReadiness(options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const resendManagementApiKey = cleanString(
    options.resendManagementApiKey ?? process.env.RESEND_MANAGEMENT_API_KEY,
  );
  const fromEmail = options.fromEmail ?? process.env.FROM_EMAIL;
  const token = options.managementToken
    ? { value: options.managementToken }
    : resolveAccessToken(options.tokenEnv);
  const projectRef = resolveProjectRef(options.projectRef);

  let resend;
  if (!resendManagementApiKey) {
    resend = blockedResendStatus(
      "missing_resend_management_api_key",
      fromEmail,
    );
  } else {
    try {
      const payload = await requestResendDomains(
        resendManagementApiKey,
        fetchImpl,
      );
      resend = evaluateResendEmailReadiness(payload, fromEmail);
    } catch (error) {
      resend = blockedResendStatus(
        error?.code === "resend_invalid_response"
          ? "resend_invalid_response"
          : "resend_access_failed",
        fromEmail,
      );
    }
  }

  let supabaseAuth;
  if (!token.value) {
    supabaseAuth = blockedAuthStatus("missing_management_pat");
  } else {
    try {
      const authConfig = await requestAuthConfig(projectRef, token.value);
      supabaseAuth = evaluateSupabaseAuthEmailReadiness(authConfig);
    } catch {
      supabaseAuth = blockedAuthStatus("auth_config_access_failed");
    }
  }

  return Object.freeze({
    checkedAt: new Date().toISOString(),
    projectRef,
    ready: resend.ready && supabaseAuth.ready,
    resend,
    supabaseAuth,
  });
}

async function main() {
  loadSupabaseScriptEnv(ENV_FILES);
  const requireReady = process.argv.includes("--require-ready");
  const status = await auditPrivateAlphaEmailReadiness();
  console.log(JSON.stringify(status, null, 2));
  if (requireReady && !status.ready) {
    throw new Error(
      `Gate bloqueado: e-mail da alpha reprovado (Resend: ${status.resend.failureCode ?? "ok"}; Auth: ${status.supabaseAuth.failureCode ?? "ok"}).`,
    );
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Falha ao auditar e-mail.",
    );
    process.exitCode = 1;
  });
}
