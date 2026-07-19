#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { auditPrivateAlphaReadiness } from "./private-alpha-readiness.mjs";

function formatBlockers(blockers) {
  if (!Array.isArray(blockers) || blockers.length === 0) {
    return "- No active readiness blockers reported.";
  }

  return blockers
    .map((blocker) => `- ${blocker.area}: ${blocker.code} (${blocker.command})`)
    .join("\n");
}

function formatBoolean(value) {
  if (typeof value !== "boolean") return "unknown";
  return value ? "true" : "false";
}

function formatNumber(value) {
  return Number.isSafeInteger(value) ? String(value) : "unknown";
}

export function createPrivateAlphaSupportPacket(status) {
  const summary = status?.summary ?? {};
  const auth = status?.auth ?? {};
  const backup = status?.backup ?? {};
  const containment = summary.containment ?? {};

  return [
    "# Achegue-se Private Alpha Support Packet",
    "",
    "## Scope",
    "",
    `- Target: ${status?.target ?? "unknown"}`,
    `- Project ref: ${status?.projectRef ?? "unknown"}`,
    `- Readiness checked at: ${summary.checkedAt ?? "unknown"}`,
    `- Alpha readiness: ${formatBoolean(summary.ready)}`,
    `- Alpha containment closed: ${formatBoolean(containment.closed)}`,
    `- Active invites: ${formatNumber(containment.activeInvites)}`,
    `- Admissions enabled: ${formatBoolean(containment.admissionsEnabled)}`,
    "",
    "## Current Blockers",
    "",
    formatBlockers(summary.blockers),
    "",
    "## Auth Admin Finding",
    "",
    "- Supabase Auth Admin `listUsers` is the canonical failing API.",
    `- Reported total users: ${formatNumber(auth.reportedTotal)}`,
    `- Checked users before failure: ${formatNumber(auth.checkedUsers)}`,
    `- Failed page: ${formatNumber(auth.failedPage)}`,
    `- Failure code: ${auth.failureCode ?? "none"}`,
    "- Local read-only diagnosis found three permanent Auth accounts with public profiles but without associated Auth identities.",
    "- The application admin listing was made resilient through a service-role RPC, but the alpha gate remains closed until Auth integrity is repaired through a supported route.",
    "",
    "## Recovery Finding",
    "",
    `- Backup records: ${formatNumber(backup.backupCount)}`,
    `- Completed backups: ${formatNumber(backup.completedBackupCount)}`,
    `- PITR enabled: ${formatBoolean(backup.pitrEnabled)}`,
    `- WAL-G enabled: ${formatBoolean(backup.walgEnabled)}`,
    `- Restore-ready: ${formatBoolean(backup.ready)}`,
    "",
    "## Request To Supabase Support",
    "",
    "- Please inspect Auth/Postgres logs for the Auth Admin internal failure and advise the supported repair path.",
    "- Please confirm whether the three permanent accounts without identities should be reconciled or removed after a restorable backup exists.",
    "- Do not ask us to update managed `auth` schema rows manually without an official recovery procedure.",
    "",
    "## Do Not Include In Initial Ticket",
    "",
    "- User e-mails.",
    "- User UUIDs.",
    "- Service role keys, PATs, SMTP credentials or DNS record values.",
    "- Raw upstream stack traces or logs containing personal data.",
    "",
  ].join("\n");
}

async function main() {
  const status = await auditPrivateAlphaReadiness();
  console.log(createPrivateAlphaSupportPacket(status));
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Falha ao gerar pacote de suporte.",
    );
    process.exitCode = 1;
  });
}
