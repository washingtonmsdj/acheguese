import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  collectProjectAccess,
  groupAccessCounts,
} from "./core-platform/access-analyzer.mjs";

const ROOT = process.cwd();
const DEFAULT_MANIFEST_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "core-platform-ownership.json",
);
const DEFAULT_ACCOUNT_EXPORT_AUTHORITY_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "core-platform-account-export-authority.json",
);
const ACCOUNT_EXPORT_CALLER = "supabase/functions/user-export-data/index.ts";
const ACCOUNT_EXPORT_ROLE = "account-export";
const BASELINE_KINDS = new Set([
  "channel",
  "dynamic-channel",
  "storage",
  "dynamic-storage",
  "dynamic-table",
  "legacy-interaction-import",
  "feed-service-alias",
]);

function normalize(filePath) {
  return filePath.replace(/\\/g, "/");
}

function callsiteKey(callsite) {
  return [
    callsite.kind,
    callsite.resource,
    callsite.access,
    callsite.path ?? callsite.file,
  ].join("|");
}

function toBaselineEntry(group) {
  return {
    kind: group.kind,
    resource: group.resource,
    access: group.access,
    path: group.file,
    maxCalls: group.count,
    ...(group.details.length > 0 ? { details: [...group.details].sort() } : {}),
  };
}

export function buildIncrementalBaseline(groupedRecords) {
  return groupedRecords
    .filter((record) => BASELINE_KINDS.has(record.kind))
    .map(toBaselineEntry)
    .sort((left, right) => callsiteKey(left).localeCompare(callsiteKey(right)));
}

function accountExportReaderCallsites(authority) {
  return (authority.controlledTableReaders ?? []).map((table) => ({
    kind: "table",
    resource: table,
    access: "read",
    path: authority.caller,
    maxCalls: 1,
    role: authority.role,
  }));
}

function tableRuleCallsites(rule, accountExportAuthority) {
  const readers = (rule.allowedReaders ?? []).map((entry) => ({
    kind: "table",
    resource: rule.name,
    access: "read",
    ...entry,
  }));
  const writers = (rule.allowedWriters ?? []).map((entry) => ({
    kind: "table",
    resource: rule.name,
    access: "write",
    ...entry,
  }));
  const accountExportReaders = accountExportReaderCallsites(
    accountExportAuthority,
  ).filter((entry) => entry.resource === rule.name);
  return [...readers, ...accountExportReaders, ...writers];
}

function rpcRuleCallsites(rule) {
  return (rule.allowedCallers ?? []).map((entry) => ({
    kind: "rpc",
    resource: rule.name,
    access: "execute",
    ...entry,
  }));
}

function validateCallsiteSet({ actual, expected, label }) {
  const violations = [];
  const improvements = [];
  const expectedByKey = new Map();

  for (const entry of expected) {
    const key = callsiteKey(entry);
    if (expectedByKey.has(key)) {
      violations.push(`${label}: entrada duplicada no manifest: ${key}`);
      continue;
    }
    if (!Number.isInteger(entry.maxCalls) || entry.maxCalls < 1) {
      violations.push(`${label}: maxCalls invalido em ${key}`);
      continue;
    }
    expectedByKey.set(key, entry);
  }

  const actualByKey = new Map(
    actual.map((entry) => [callsiteKey(entry), entry]),
  );
  for (const entry of actual) {
    const key = callsiteKey(entry);
    const allowance = expectedByKey.get(key);
    if (!allowance) {
      violations.push(
        `${label}: novo acesso nao autorizado: ${key} (${entry.count} chamada(s))`,
      );
      continue;
    }
    if (entry.count > allowance.maxCalls) {
      violations.push(
        `${label}: ${key} aumentou de ${allowance.maxCalls} para ${entry.count} chamada(s)`,
      );
    } else if (entry.count < allowance.maxCalls) {
      improvements.push(
        `${label}: ${key} reduziu de ${allowance.maxCalls} para ${entry.count} chamada(s)`,
      );
    }
  }

  for (const [key, allowance] of expectedByKey) {
    if (!actualByKey.has(key)) {
      improvements.push(
        `${label}: acesso legado removido: ${key} (${allowance.maxCalls})`,
      );
    }
  }

  return { violations, improvements };
}

function validateAccountExportAuthority(authority, manifest, root) {
  const violations = [];
  if (!authority || typeof authority !== "object" || Array.isArray(authority)) {
    return ["Account export authority deve ser um objeto"];
  }
  if (authority.schemaVersion !== 1) {
    violations.push("Account export authority schemaVersion deve ser 1");
  }
  if (authority.caller !== ACCOUNT_EXPORT_CALLER) {
    violations.push(
      `Account export authority caller deve ser ${ACCOUNT_EXPORT_CALLER}`,
    );
  }
  if (authority.role !== ACCOUNT_EXPORT_ROLE) {
    violations.push(
      `Account export authority role deve ser ${ACCOUNT_EXPORT_ROLE}`,
    );
  }
  if (
    typeof authority.rationale !== "string" ||
    authority.rationale.trim().length === 0
  ) {
    violations.push("Account export authority rationale deve ser nao vazio");
  }
  if (
    !Array.isArray(authority.controlledTableReaders) ||
    authority.controlledTableReaders.length === 0
  ) {
    violations.push(
      "Account export authority controlledTableReaders deve ser uma lista nao vazia",
    );
    return violations;
  }

  const callerPath = authority.caller;
  if (path.isAbsolute(callerPath) || !fs.existsSync(path.join(root, callerPath))) {
    violations.push(`Account export authority caller invalido: ${callerPath}`);
  }

  const controlledNames = new Set(
    (manifest.controlledTables ?? []).map((rule) => rule.name),
  );
  const seen = new Set();
  for (const table of authority.controlledTableReaders) {
    if (typeof table !== "string" || table.length === 0) {
      violations.push("Account export authority possui tabela invalida");
      continue;
    }
    if (seen.has(table)) {
      violations.push(`Account export authority possui tabela duplicada: ${table}`);
      continue;
    }
    seen.add(table);
    if (!controlledNames.has(table)) {
      violations.push(
        `Account export authority referencia tabela fora de controlledTables: ${table}`,
      );
    }
  }

  const directAccountExportReaders = (manifest.controlledTables ?? [])
    .flatMap((rule) =>
      (rule.allowedReaders ?? [])
        .filter((entry) => entry.path === ACCOUNT_EXPORT_CALLER)
        .map(() => rule.name),
    );
  for (const table of authority.controlledTableReaders) {
    if (directAccountExportReaders.includes(table)) {
      violations.push(
        `Account export authority duplica reader ja declarado no manifest principal: ${table}`,
      );
    }
  }

  return violations;
}

function validateManifestShape(manifest, accountExportAuthority, root) {
  const violations = [];
  if (manifest.schemaVersion !== 1) {
    violations.push("schemaVersion deve ser 1");
  }
  if (
    !Array.isArray(manifest.sourceRoots) ||
    manifest.sourceRoots.length === 0
  ) {
    violations.push("sourceRoots deve ser uma lista nao vazia");
  }
  if (!Array.isArray(manifest.controlledTables)) {
    violations.push("controlledTables deve ser uma lista");
  }
  if (!Array.isArray(manifest.controlledRpcs)) {
    violations.push("controlledRpcs deve ser uma lista");
  }
  if (!Array.isArray(manifest.incrementalBaseline)) {
    violations.push("incrementalBaseline deve ser uma lista");
  }

  const names = new Set();
  for (const rule of manifest.controlledTables ?? []) {
    if (!rule.name || names.has(`table:${rule.name}`)) {
      violations.push(
        `controlledTables possui nome ausente/duplicado: ${rule.name ?? "<missing>"}`,
      );
    }
    names.add(`table:${rule.name}`);
    if (!rule.currentOwner || !rule.targetOwner || !rule.status) {
      violations.push(
        `Tabela ${rule.name}: currentOwner, targetOwner e status sao obrigatorios`,
      );
    }
    if (rule.status !== "canonical" && !rule.finding) {
      violations.push(`Tabela ${rule.name}: recurso em migracao exige finding`);
    }
  }

  for (const rule of manifest.controlledRpcs ?? []) {
    if (!rule.name || names.has(`rpc:${rule.name}`)) {
      violations.push(
        `controlledRpcs possui nome ausente/duplicado: ${rule.name ?? "<missing>"}`,
      );
    }
    names.add(`rpc:${rule.name}`);
    if (!rule.currentOwner || !rule.targetOwner || !rule.status) {
      violations.push(
        `RPC ${rule.name}: currentOwner, targetOwner e status sao obrigatorios`,
      );
    }
    if (rule.status !== "canonical" && !rule.finding) {
      violations.push(`RPC ${rule.name}: recurso em migracao exige finding`);
    }
  }

  violations.push(
    ...validateAccountExportAuthority(accountExportAuthority, manifest, root),
  );

  const declaredCallsites = [
    ...(manifest.controlledTables ?? []).flatMap((rule) =>
      tableRuleCallsites(rule, accountExportAuthority)
    ),
    ...(manifest.controlledRpcs ?? []).flatMap(rpcRuleCallsites),
    ...(manifest.incrementalBaseline ?? []),
  ];
  for (const callsite of declaredCallsites) {
    if (!callsite.path || path.isAbsolute(callsite.path)) {
      violations.push(
        `Caminho deve ser relativo ao repositorio: ${callsite.path ?? "<missing>"}`,
      );
      continue;
    }
    if (!fs.existsSync(path.join(root, callsite.path))) {
      violations.push(`Caminho declarado nao existe: ${callsite.path}`);
    }
  }

  return violations;
}

export function validateManifestAgainstRecords(
  manifest,
  groupedRecords,
  root = ROOT,
  accountExportAuthority = readJsonFile(DEFAULT_ACCOUNT_EXPORT_AUTHORITY_PATH),
) {
  const violations = validateManifestShape(
    manifest,
    accountExportAuthority,
    root,
  );
  const improvements = [];

  for (const rule of manifest.controlledTables ?? []) {
    const actual = groupedRecords.filter(
      (record) => record.kind === "table" && record.resource === rule.name,
    );
    const result = validateCallsiteSet({
      actual,
      expected: tableRuleCallsites(rule, accountExportAuthority),
      label: `table:${rule.name}`,
    });
    violations.push(...result.violations);
    improvements.push(...result.improvements);
  }

  for (const rule of manifest.controlledRpcs ?? []) {
    const actual = groupedRecords.filter(
      (record) => record.kind === "rpc" && record.resource === rule.name,
    );
    const result = validateCallsiteSet({
      actual,
      expected: rpcRuleCallsites(rule),
      label: `rpc:${rule.name}`,
    });
    violations.push(...result.violations);
    improvements.push(...result.improvements);
  }

  const baselineResult = validateCallsiteSet({
    actual: groupedRecords.filter((record) => BASELINE_KINDS.has(record.kind)),
    expected: manifest.incrementalBaseline ?? [],
    label: "incremental-baseline",
  });
  violations.push(...baselineResult.violations);
  improvements.push(...baselineResult.improvements);

  return { violations, improvements };
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Arquivo nao encontrado: ${normalize(path.relative(ROOT, filePath))}`,
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeManifest(manifestPath, manifest) {
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

function printList(title, items, writer = console.log) {
  if (items.length === 0) return;
  writer(`${title}: ${items.length}`);
  for (const item of items.slice(0, 40)) writer(`- ${item}`);
  if (items.length > 40) writer(`- ... e mais ${items.length - 40}`);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const jsonOutput = args.has("--json");
  const acceptCurrentBaseline = args.has("--accept-current-baseline");
  const manifestPathArgument = process.argv.find((argument) =>
    argument.startsWith("--manifest="),
  );
  const accountExportAuthorityPathArgument = process.argv.find((argument) =>
    argument.startsWith("--account-export-authority="),
  );
  const manifestPath = manifestPathArgument
    ? path.resolve(ROOT, manifestPathArgument.slice("--manifest=".length))
    : DEFAULT_MANIFEST_PATH;
  const accountExportAuthorityPath = accountExportAuthorityPathArgument
    ? path.resolve(
      ROOT,
      accountExportAuthorityPathArgument.slice(
        "--account-export-authority=".length,
      ),
    )
    : DEFAULT_ACCOUNT_EXPORT_AUTHORITY_PATH;
  const manifest = readJsonFile(manifestPath);
  const accountExportAuthority = readJsonFile(accountExportAuthorityPath);
  const groupedRecords = groupAccessCounts(
    collectProjectAccess(ROOT, manifest.sourceRoots),
  );

  if (acceptCurrentBaseline) {
    manifest.incrementalBaseline = buildIncrementalBaseline(groupedRecords);
    manifest.updatedAt = new Date().toISOString().slice(0, 10);
    writeManifest(manifestPath, manifest);
    console.log(
      `Baseline aceito em ${normalize(path.relative(ROOT, manifestPath))}: ${manifest.incrementalBaseline.length} callsites.`,
    );
    return;
  }

  const result = validateManifestAgainstRecords(
    manifest,
    groupedRecords,
    ROOT,
    accountExportAuthority,
  );
  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          controlledTables: manifest.controlledTables.length,
          controlledRpcs: manifest.controlledRpcs.length,
          accountExportControlledReaders:
            accountExportAuthority.controlledTableReaders.length,
          baselineCallsites: manifest.incrementalBaseline.length,
          ...result,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `Core Platform ownership: ${manifest.controlledTables.length} tabela(s), ${manifest.controlledRpcs.length} RPC(s), ${accountExportAuthority.controlledTableReaders.length} account-export reader(s), ${manifest.incrementalBaseline.length} callsite(s) incrementais.`,
    );
    printList(
      "Melhorias detectadas; reduza o baseline no mesmo PR",
      result.improvements,
    );
    printList("Violacoes bloqueantes", result.violations, console.error);
  }

  if (result.violations.length > 0) process.exit(1);
  console.log("Core Platform ownership validado.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
