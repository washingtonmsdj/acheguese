#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const DEFAULT_POLICY_PATH = join(
  ROOT,
  "docs/09-reference/governance/security/FREE_RELEASE_GOVERNANCE.json",
);
const EXCEPTION_REGISTER_PATH = join(
  ROOT,
  "docs/09-reference/governance/security/EXCEPTIONS.md",
);
const HARD_EXCEPTION_EXPIRY = "2026-09-10";
const MAX_EXCEPTION_DAYS = 30;
const MAX_RECOVERY_AGE_HOURS = 24;
const EXPECTED_RECOVERY_ROLE = "POST_POLL_HARDENING_RECOVERY_SNAPSHOT";
const REQUIRED_REMOTE_STATE_FIELDS = [
  "migrationCount",
  "latestMigration",
  "authUsers",
  "authIdentities",
  "storageObjects",
  "storageTotalBytes",
];

const REQUIRED_HIBP_MITIGATIONS = [
  "PASSWORD_MINIMUM_12",
  "PASSWORD_COMPLEXITY",
  "SECURE_PASSWORD_CHANGE",
  "APP_HIBP_K_ANONYMITY_FAIL_OPEN",
  "NOT_EQUIVALENT_TO_AUTH_PROVIDER_PROTECTION",
];
const REQUIRED_HIBP_TRIGGERS = [
  "PLAN_WITH_NATIVE_HIBP",
  "EXCEPTION_EXPIRES",
  "SIGNUP_OR_TRAFFIC_EXCEEDS_ACCEPTED_RISK",
  "CREDENTIAL_STUFFING_OR_ACCOUNT_TAKEOVER",
];
const REQUIRED_POSTGIS_MITIGATIONS = [
  "NO_RELEASE_MIGRATION_DIRECT_DEPENDENCY",
  "READ_ONLY_PREFLIGHT",
  "ADVISOR_FAIL_CLOSED",
  "NO_BLIND_OWNER_MIGRATION",
];
const REQUIRED_POSTGIS_TRIGGERS = [
  "POSTGIS_REMEDIATED",
  "SURFACE_OR_GRANTS_CHANGED",
  "NEW_RELEVANT_ADVISOR_FINDING",
  "EXPLOIT_OR_INCIDENT",
  "EXCEPTION_EXPIRES",
];
const ALLOWED_EXCEPTION_SCOPES = [
  "AUTH_HIBP_NATIVE_CONTROL",
  "POSTGIS_PUBLIC_EXTENSION_SURFACE",
];
const EXPECTED_RELEASE_MIGRATIONS = [
  "20260719122000",
  "20260720100000",
  "20260809184409",
  "20260810151941",
];

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function governanceFingerprint(value) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function parseStartOfDay(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndOfDay(value) {
  const parsed = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseInstant(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasEvery(values, required) {
  return (
    Array.isArray(values) && required.every((value) => values.includes(value))
  );
}

function sameMembers(values, expected) {
  return (
    Array.isArray(values) &&
    values.length === expected.length &&
    hasEvery(values, expected)
  );
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function exceptionRegisterSection(markdown, id) {
  const marker = `## ${id}`;
  const start = markdown.indexOf(marker);
  if (start < 0) return "";
  const next = markdown.indexOf("\n## ", start + marker.length);
  return markdown.slice(start, next < 0 ? markdown.length : next);
}

function validateException({
  exception,
  expectedId,
  expectedScope,
  ownerGithub,
  now,
  mitigations,
  triggers,
  issues,
}) {
  if (!exception) {
    issues.push(`MISSING_EXCEPTION:${expectedId}`);
    return;
  }
  if (exception.id !== expectedId || exception.scope !== expectedScope) {
    issues.push(`INVALID_EXCEPTION_SCOPE:${expectedId}`);
  }
  if (exception.status !== "OPEN")
    issues.push(`INVALID_EXCEPTION_STATUS:${expectedId}`);
  if (exception.ownerGithub !== ownerGithub)
    issues.push(`INVALID_EXCEPTION_OWNER:${expectedId}`);
  if (!hasEvery(exception.mitigations, mitigations))
    issues.push(`MISSING_EXCEPTION_MITIGATION:${expectedId}`);
  if (!hasEvery(exception.closureTriggers, triggers))
    issues.push(`MISSING_EXCEPTION_TRIGGER:${expectedId}`);

  const createdAt = parseStartOfDay(exception.createdAt);
  const validUntil = parseEndOfDay(exception.validUntil);
  const hardExpiry = parseEndOfDay(HARD_EXCEPTION_EXPIRY);
  if (!createdAt || !validUntil) {
    issues.push(`INVALID_EXCEPTION_DATE:${expectedId}`);
    return;
  }
  if (validUntil.getTime() < now.getTime())
    issues.push(`EXPIRED_EXCEPTION:${expectedId}`);
  if (hardExpiry && validUntil.getTime() > hardExpiry.getTime()) {
    issues.push(`EXCEPTION_EXCEEDS_HARD_EXPIRY:${expectedId}`);
  }
  const durationDays =
    (parseStartOfDay(exception.validUntil).getTime() - createdAt.getTime()) /
    86_400_000;
  if (durationDays > MAX_EXCEPTION_DAYS)
    issues.push(`EXCEPTION_TOO_LONG:${expectedId}`);
}

export function validateFreeReleaseGovernance(policy, options = {}) {
  const now = options.now ?? new Date();
  const exceptionRegister = options.exceptionRegister ?? "";
  const issues = [];

  if (policy?.schemaVersion !== "acheguese-free-release-governance/v1") {
    issues.push("INVALID_SCHEMA_VERSION");
  }

  const owner = policy?.owner;
  if (
    !owner?.name?.trim() ||
    !owner?.github?.trim() ||
    owner.status !== "APPROVED"
  ) {
    issues.push("GOVERNANCE_OWNER_REQUIRED");
  }

  if (policy?.release?.plan !== "SUPABASE_FREE")
    issues.push("INVALID_RELEASE_PLAN");
  if (policy?.release?.kind !== "CONTROLLED_RELEASE_WINDOW")
    issues.push("INVALID_RELEASE_WINDOW");
  if (policy?.release?.decision !== "FREE_RELEASE_GOVERNANCE_APPROVED")
    issues.push("INVALID_RELEASE_DECISION");
  if (policy?.release?.technicalGateOverride !== false)
    issues.push("TECHNICAL_GATE_OVERRIDE_FORBIDDEN");

  const exceptions = Array.isArray(policy?.exceptions) ? policy.exceptions : [];
  const hibp = policy?.controls?.hibp;
  const postgis = policy?.controls?.postgis;

  validateException({
    exception: exceptions.find((item) => item.id === hibp?.exceptionId),
    expectedId: "EXC-2026-08-11-AUTH-HIBP-FREE-PLAN",
    expectedScope: "AUTH_HIBP_NATIVE_CONTROL",
    ownerGithub: owner?.github,
    now,
    mitigations: REQUIRED_HIBP_MITIGATIONS,
    triggers: REQUIRED_HIBP_TRIGGERS,
    issues,
  });
  validateException({
    exception: exceptions.find((item) => item.id === postgis?.exceptionId),
    expectedId: "EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE",
    expectedScope: "POSTGIS_PUBLIC_EXTENSION_SURFACE",
    ownerGithub: owner?.github,
    now,
    mitigations: REQUIRED_POSTGIS_MITIGATIONS,
    triggers: REQUIRED_POSTGIS_TRIGGERS,
    issues,
  });

  if (hibp?.nativeControl !== "HIBP_UNAVAILABLE_ON_PLAN")
    issues.push("HIBP_STATE_MUST_REMAIN_UNAVAILABLE");
  if (hibp?.authorityState !== "VALID_TEMPORARY_EXCEPTION")
    issues.push("HIBP_EXCEPTION_NOT_VALID");
  if (hibp?.equivalentToAuthProviderProtection !== false)
    issues.push("HIBP_FALSE_EQUIVALENCE");

  if (postgis?.authorityState !== "VALID_TEMPORARY_EXCEPTION")
    issues.push("POSTGIS_EXCEPTION_NOT_VALID");
  if (
    !postgis?.observedMaterialState ||
    governanceFingerprint(postgis.observedMaterialState) !==
      postgis.acceptedStateSha256
  ) {
    issues.push("POSTGIS_GOVERNANCE_REASSESSMENT_REQUIRED");
  }
  if (
    !Array.isArray(postgis?.newMaterialFindings) ||
    postgis.newMaterialFindings.length > 0
  ) {
    issues.push("POSTGIS_NEW_MATERIAL_FINDING");
  }
  if (!sameMembers(postgis?.releaseMigrations, EXPECTED_RELEASE_MIGRATIONS)) {
    issues.push("POSTGIS_RELEASE_MIGRATION_INVENTORY_INVALID");
  }
  if (
    !Array.isArray(postgis?.directPostgisDependencies) ||
    postgis.directPostgisDependencies.length > 0
  ) {
    issues.push("POSTGIS_RELEASE_DIRECT_DEPENDENCY");
  }

  const recovery = policy?.controls?.recovery;
  if (!recovery) {
    issues.push("RECOVERY_SNAPSHOT_REQUIRED");
  } else {
    if (recovery.policy !== "MANUAL_RELEASE_RECOVERY_SNAPSHOT")
      issues.push("INVALID_RECOVERY_POLICY");
    if (recovery.authorityState !== "VERIFIED_COMPENSATING_CONTROL")
      issues.push("RECOVERY_NOT_VERIFIED");
    if (recovery.snapshotRole !== EXPECTED_RECOVERY_ROLE)
      issues.push("INVALID_RECOVERY_SNAPSHOT_ROLE");
    if (!/^\d{8}T\d{6}Z$/.test(recovery.snapshotId ?? ""))
      issues.push("INVALID_RECOVERY_SNAPSHOT_ID");
    if (!sameMembers(recovery.coverage, ["DATABASE", "AUTH", "STORAGE"]))
      issues.push("RECOVERY_COVERAGE_INCOMPLETE");
    const capturedAt = parseInstant(recovery.capturedAt);
    const validUntil = parseInstant(recovery.validUntil);
    if (!capturedAt || !validUntil) {
      issues.push("RECOVERY_DATE_INVALID");
    } else {
      const ageHours =
        (validUntil.getTime() - capturedAt.getTime()) / 3_600_000;
      if (
        ageHours > MAX_RECOVERY_AGE_HOURS ||
        recovery.maximumAgeHours > MAX_RECOVERY_AGE_HOURS
      ) {
        issues.push("RECOVERY_WINDOW_TOO_LONG");
      }
      if (now.getTime() > validUntil.getTime())
        issues.push("RECOVERY_SNAPSHOT_STALE");
      if (now.getTime() < capturedAt.getTime())
        issues.push("RECOVERY_SNAPSHOT_FROM_FUTURE");
    }
    if (
      recovery.offDevice?.status !== "VERIFIED" ||
      recovery.offDevice?.private !== true ||
      recovery.offDevice?.localOnly !== false ||
      recovery.offDevice?.readbackHashMatch !== true ||
      !/^[a-f0-9]{64}$/.test(recovery.offDevice?.sha256 ?? "")
    ) {
      issues.push("OFF_DEVICE_RECOVERY_NOT_VERIFIED");
    }
    const remoteState = recovery.remoteState;
    if (
      !remoteState ||
      REQUIRED_REMOTE_STATE_FIELDS.some(
        (field) => remoteState[field] == null,
      ) ||
      !isNonNegativeInteger(remoteState?.migrationCount) ||
      !/^\d{14}$/.test(remoteState?.latestMigration ?? "") ||
      !isNonNegativeInteger(remoteState?.authUsers) ||
      !isNonNegativeInteger(remoteState?.authIdentities) ||
      !isNonNegativeInteger(remoteState?.storageObjects) ||
      !isNonNegativeInteger(remoteState?.storageTotalBytes)
    ) {
      issues.push("RECOVERY_REMOTE_STATE_INVALID");
    }
    if (
      recovery.freshnessPolicy?.remoteEvidenceRequiredForMutableOperations !==
        true ||
      recovery.freshnessPolicy?.migrationChangeHandling !==
        "REQUIRE_FRESH_RECOVERY" ||
      recovery.freshnessPolicy?.authStorageChangeHandling !==
        "REQUIRE_FRESH_RECOVERY"
    ) {
      issues.push("RECOVERY_FRESHNESS_POLICY_INVALID");
    }
    if (
      recovery.localDeclaration?.evidenceClass !==
      "DECLARATION_ONLY_NOT_REMOTE_FRESHNESS"
    ) {
      issues.push("LOCAL_DECLARATION_EVIDENCE_CLASS_INVALID");
    }
    if (
      recovery.recoveryMode !== "MANUAL" ||
      recovery.rto !== "NOT_GUARANTEED"
    ) {
      issues.push("RECOVERY_FALSE_MANAGED_EQUIVALENCE");
    }
  }

  const pitr = policy?.controls?.pitr;
  if (
    pitr?.managedPitr !== "UNAVAILABLE_ON_PLAN" ||
    pitr?.manualRecovery !== "VERIFIED" ||
    pitr?.residualRisk !== "ACCEPTED_FOR_CONTROLLED_RELEASE_WINDOW" ||
    pitr?.authorityState !== "RESIDUAL_RISK_ACCEPTED"
  ) {
    issues.push("PITR_RESIDUAL_RISK_INVALID");
  }

  const technicalPolicy = policy?.technicalGatePolicy;
  if (
    !sameMembers(technicalPolicy?.exceptionsCoverOnly, ALLOWED_EXCEPTION_SCOPES)
  ) {
    issues.push("GENERIC_EXCEPTION_SCOPE_FORBIDDEN");
  }
  if (technicalPolicy?.genericTechnicalOverride !== false)
    issues.push("GENERIC_TECHNICAL_OVERRIDE_FORBIDDEN");
  if (
    !hasEvery(technicalPolicy?.unchangedMandatoryGates, [
      "MIGRATION_DRIFT",
      "MIGRATION_PROVENANCE",
      "REMOTE_RECOVERY_FRESHNESS",
      "TURNSTILE_PRODUCTION",
      "CSP",
      "VERCEL_INPUTS",
      "TYPECHECK_APP",
      "LINT",
      "POLL_PREFLIGHT",
      "COMMUNITY_INTEREST_PREFLIGHT",
      "SALVADOR_PREFLIGHT",
    ])
  ) {
    issues.push("MANDATORY_TECHNICAL_GATE_REMOVED");
  }

  for (const historicalId of [
    "EXC-2026-07-08-AUTH-HIBP-DASHBOARD",
    "EXC-2026-07-08-POSTGIS-EXTENSION-OWNER",
  ]) {
    const historical = policy?.historicalExceptions?.find(
      (item) => item.id === historicalId,
    );
    if (historical?.state !== "EXPIRED_EXCEPTION")
      issues.push(`HISTORICAL_EXCEPTION_NOT_EXPIRED:${historicalId}`);
  }

  if (exceptionRegister) {
    for (const exception of exceptions) {
      const section = exceptionRegisterSection(exceptionRegister, exception.id);
      if (!section) issues.push(`EXCEPTION_NOT_IN_REGISTER:${exception.id}`);
      if (!section.includes(`Responsavel: ${owner.name} (@${owner.github})`)) {
        issues.push(`OWNER_NOT_IN_EXCEPTION_REGISTER:${exception.id}`);
      }
      if (!section.includes(`Valida ate: ${exception.validUntil}`)) {
        issues.push(`EXPIRY_NOT_IN_EXCEPTION_REGISTER:${exception.id}`);
      }
    }
    for (const historical of policy.historicalExceptions ?? []) {
      const section = exceptionRegisterSection(
        exceptionRegister,
        historical.id,
      );
      if (
        !section.includes("Status: fechada") ||
        !section.includes("Estado de encerramento: EXPIRED_EXCEPTION") ||
        !section.includes(`Valida ate: ${historical.validUntil}`)
      ) {
        issues.push(`HISTORICAL_EXCEPTION_REGISTER_INVALID:${historical.id}`);
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    states: {
      hibp: hibp?.authorityState,
      postgis: postgis?.authorityState,
      recovery: recovery?.authorityState,
      remoteFreshness: "NOT_PROVEN_BY_LOCAL_VALIDATION",
      pitr: pitr?.authorityState,
    },
  };
}

export function validateRemoteRecoveryFreshness(
  policy,
  remoteEvidence,
  options = {},
) {
  const issues = [];
  const differences = [];
  const recovery = policy?.controls?.recovery;
  const operation = options.operation ?? "mutable";

  if (!recovery?.remoteState) {
    return {
      ok: false,
      issues: ["RECOVERY_REMOTE_STATE_INVALID", "FRESH_RECOVERY_REQUIRED"],
      differences,
      state: "FRESH_RECOVERY_REQUIRED",
    };
  }

  if (!remoteEvidence) {
    if (operation === "mutable") {
      issues.push("REMOTE_RECOVERY_EVIDENCE_REQUIRED");
      issues.push("FRESH_RECOVERY_REQUIRED");
    }
    return {
      ok: issues.length === 0,
      issues,
      differences,
      state:
        issues.length === 0
          ? "REMOTE_RECOVERY_FRESHNESS_NOT_PROVEN"
          : "FRESH_RECOVERY_REQUIRED",
    };
  }

  const comparisons = [
    ["migrationCount", "REMOTE_MIGRATION_COUNT_CHANGED"],
    ["latestMigration", "REMOTE_LATEST_MIGRATION_CHANGED"],
    ["authUsers", "REMOTE_AUTH_STATE_CHANGED_SINCE_RECOVERY"],
    ["authIdentities", "REMOTE_AUTH_STATE_CHANGED_SINCE_RECOVERY"],
    ["storageObjects", "REMOTE_STORAGE_STATE_CHANGED_SINCE_RECOVERY"],
    ["storageTotalBytes", "REMOTE_STORAGE_STATE_CHANGED_SINCE_RECOVERY"],
  ];

  for (const [field, issue] of comparisons) {
    if (remoteEvidence[field] == null) {
      issues.push(`REMOTE_RECOVERY_EVIDENCE_MISSING:${field}`);
      continue;
    }
    if (remoteEvidence[field] !== recovery.remoteState[field]) {
      differences.push({
        field,
        snapshot: recovery.remoteState[field],
        remote: remoteEvidence[field],
      });
      issues.push(issue);
    }
  }

  const uniqueIssues = [...new Set(issues)];
  if (uniqueIssues.length > 0) uniqueIssues.push("FRESH_RECOVERY_REQUIRED");

  return {
    ok: uniqueIssues.length === 0,
    issues: uniqueIssues,
    differences,
    state:
      uniqueIssues.length === 0
        ? "REMOTE_RECOVERY_FRESHNESS_GATE_PASS"
        : "FRESH_RECOVERY_REQUIRED",
  };
}

export function loadFreeReleaseGovernance(path = DEFAULT_POLICY_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function main() {
  const policy = loadFreeReleaseGovernance();
  const exceptionRegister = readFileSync(EXCEPTION_REGISTER_PATH, "utf8");
  const result = validateFreeReleaseGovernance(policy, { exceptionRegister });
  if (!result.ok) {
    console.error("FREE_RELEASE_GOVERNANCE_BLOCKED");
    for (const issue of result.issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log("FREE_RELEASE_GOVERNANCE_LOCAL_VALIDATION_PASS");
  console.log("REMOTE_RECOVERY_FRESHNESS_NOT_PROVEN");
  console.log(JSON.stringify(result.states));
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
