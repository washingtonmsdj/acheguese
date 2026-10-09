/**
 * Auditoria de lineage de migrations: leitura exclusiva, sem acesso direto ao DB.
 * Única autoridade de aplicação continua sendo supabase-main-db-push.yml.
 * Analisa o stdout de "supabase migration list --linked"; NÃO executa
 * "migration repair", não marca versões aplicadas e não altera schema.
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = /^\d{14}$/;
const MIGRATION_FILE = /^(\d{14})_[^/]+\.sql$/;

export function parseMigrationTable(output) {
  if (typeof output !== "string") throw new Error("migration output must be text");
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    // O CLI v2.115.0 imprime LOCAL | REMOTE | TIME (UTC). Não extrair
    // identificadores de células com texto adicional: parsing permissivo
    // pode transformar histórico inválido em um lote aparentemente aprovado.
    const columns = line.split(/\s*[|│]\s*/u);
    const isVersionCell = (raw) => /\d{14}/.test(raw);
    if (columns.length < 2) {
      if (/^\s*\d{14}(?:\D|$)/.test(line)) {
        throw new Error(`Linha sem delimitadores na listagem de migrations: ${line.trim()}`);
      }
      continue;
    }
    // Cabeçalhos, separadores e avisos sem timestamps não são dados.
    if (!columns.some(isVersionCell)) continue;
    if (columns.length !== 3) {
      throw new Error(`Colunas inesperadas na listagem de migrations: ${line.trim()}`);
    }
    const localCell = columns[0].trim();
    const remoteCell = columns[1].trim();
    // Uma célula vazia é válida; versão com sufixo, espaços internos ou
    // identificador parcial exige falha explícita, nunca interpretação.
    if ((localCell && !VERSION.test(localCell)) ||
        (remoteCell && !VERSION.test(remoteCell))) {
      throw new Error(`Versão de migração malformada: ${line.trim()}`);
    }
    const local = localCell || null;
    const remote = remoteCell || null;
    if (!local && !remote) {
      throw new Error(`Linha de migração sem versões reconhecíveis: ${line.trim()}`);
    }
    rows.push({ local, remote });
  }
  if (rows.length === 0) {
    throw new Error("Nenhuma linha de migração reconhecida; formato CLI desconhecido");
  }
  return rows;
}

export function auditMigrationLineage({ output, filenames, expectedPending }) {
  const rows = parseMigrationTable(output);
  if (!Array.isArray(filenames) || !Array.isArray(expectedPending)) {
    throw new Error("filenames and expectedPending must be arrays");
  }
  const localFiles = new Map();
  const invalidSqlFiles = [];
  for (const file of filenames) {
    const found = String(file).match(MIGRATION_FILE);
    if (!found) {
      if (String(file).toLowerCase().endsWith(".sql")) invalidSqlFiles.push(String(file));
      continue;
    }
    if (localFiles.has(found[1])) {
      throw new Error(`Versão duplicada no source: ${found[1]}`);
    }
    localFiles.set(found[1], file);
  }
  const expected = new Set(expectedPending);
  if (expected.size !== expectedPending.length ||
      expectedPending.some((version) => !VERSION.test(version))) {
    throw new Error("Lista esperada de pendências inválida ou duplicada");
  }
  const localFromCli = new Set();
  const remoteFromCli = new Set();
  const localOnly = new Set();
  const remoteOnly = new Set();
  const mispaired = [];
  const duplicateLocalRows = new Set();
  const duplicateRemoteRows = new Set();
  for (const { local, remote } of rows) {
    if (local && localFromCli.has(local)) duplicateLocalRows.add(local);
    if (remote && remoteFromCli.has(remote)) duplicateRemoteRows.add(remote);
    if (local) localFromCli.add(local);
    if (remote) remoteFromCli.add(remote);
    if (local && !remote) localOnly.add(local);
    if (remote && !local) remoteOnly.add(remote);
    if (local && remote && local !== remote) mispaired.push({ local, remote });
  }
  // Prova que a própria visão local do Supabase CLI corresponde ao checkout
  // imutável; nunca confiar apenas na coluna LOCAL do output.
  const missingFromCheckout = [...localFromCli].filter((v) => !localFiles.has(v));
  const missingFromCli = [...localFiles.keys()].filter((v) => !localFromCli.has(v));
  const missingApprovedFiles = [...expected].filter((v) => !localFiles.has(v));
  const unexpectedPending = [...localOnly].filter((v) => !expected.has(v));
  const missingPending = [...expected].filter((v) => !localOnly.has(v));
  const sorted = (items) => items.sort();
  const result = {
    localOnly: sorted([...localOnly]),
    remoteOnly: sorted([...remoteOnly]),
    unexpectedPending: sorted(unexpectedPending),
    missingPending: sorted(missingPending),
    missingApprovedFiles: sorted(missingApprovedFiles),
    missingFromCheckout: sorted(missingFromCheckout),
    missingFromCli: sorted(missingFromCli),
    invalidSqlFiles: sorted(invalidSqlFiles),
    duplicateLocalRows: sorted([...duplicateLocalRows]),
    duplicateRemoteRows: sorted([...duplicateRemoteRows]),
    mispaired,
  };
  // O conjunto localOnly esperado é intencional; não é um desvio.
  result.ok = result.remoteOnly.length === 0
    && result.unexpectedPending.length === 0
    && result.missingPending.length === 0
    && result.missingApprovedFiles.length === 0
    && result.missingFromCheckout.length === 0
    && result.missingFromCli.length === 0
    && result.invalidSqlFiles.length === 0
    && result.duplicateLocalRows.length === 0
    && result.duplicateRemoteRows.length === 0
    && result.mispaired.length === 0;
  return result;
}

export function runAudit(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!["--list", "--directory", "--expected"].includes(flag) || !value) {
      throw new Error(`Argumento inválido ou ausente: ${flag}`);
    }
    args.set(flag, value);
  }
  for (const needed of ["--list", "--directory", "--expected"]) {
    if (!args.has(needed)) throw new Error(`Obrigatório: ${needed}`);
  }
  const output = readFileSync(resolve(args.get("--list")), "utf8");
  const filenames = readdirSync(resolve(args.get("--directory")));
  // 'none' is the explicit post-apply state: all migrations must have
  // both local and remote entries. An empty shell argument is ambiguous.
  const rawExpected = args.get("--expected");
  const expectedPending = rawExpected === "none"
    ? []
    : rawExpected.split(",").map((x) => x.trim());
  const result = auditMigrationLineage({ output, filenames, expectedPending });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    throw new Error("HISTÓRICO_SUPABASE_DIVERGENTE: db push bloqueado, sem reparação automática");
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runAudit(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
