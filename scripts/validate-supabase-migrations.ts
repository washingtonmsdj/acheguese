import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const FILENAME_PATTERN = /^(\d+)_(.+)\.sql$/;
const INVALID_DO_BLOCK_PATTERNS = [/^DO \$$/m, /^END \$;$/m];
const SECURITY_DEFINER_HARDENING_VERSION = "20260526000001";
const SQL_IDENTIFIER =
  String.raw`(?:"[^"]+"|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][\w$]*))?`;

interface MigrationFile {
  name: string;
  version: string;
  fullPath: string;
}

interface TableCreation {
  table: string;
  file: string;
}

interface ViewGrant {
  view: string;
  file: string;
}

function readMigrationFiles(): MigrationFile[] {
  return fs
    .readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => {
      const match = entry.name.match(FILENAME_PATTERN);
      if (!match) {
        throw new Error(
          `Migration com nome invalido: ${entry.name}. Use <timestamp>_name.sql.`,
        );
      }

      return {
        name: entry.name,
        version: match[1],
        fullPath: path.join(MIGRATIONS_DIR, entry.name),
      };
    });
}

function stripSqlComments(content: string): string {
  return content.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeSqlIdentifier(identifier: string): string {
  const parts = identifier
    .replace(/"/g, "")
    .split(".")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (parts.length === 1) return `public.${parts[0]}`;
  return `${parts[0]}.${parts[1]}`;
}

function isPublicSchemaIdentifier(identifier: string): boolean {
  return identifier.startsWith("public.");
}

function validatePublicTableRls(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const createdTables = new Map<string, TableCreation[]>();
  const rlsEnabledTables = new Set<string>();
  const rlsDisabledTables: TableCreation[] = [];

  const createTableRegex = new RegExp(
    String.raw`\bCREATE\s+(?:(TEMP(?:ORARY)?|UNLOGGED)\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(${SQL_IDENTIFIER})`,
    "gi",
  );
  const enableRlsRegex = new RegExp(
    String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(${SQL_IDENTIFIER})\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY\b`,
    "gi",
  );
  const disableRlsRegex = new RegExp(
    String.raw`\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(${SQL_IDENTIFIER})\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY\b`,
    "gi",
  );

  for (const file of files) {
    const content = stripSqlComments(fs.readFileSync(file.fullPath, "utf8"));
    let match: RegExpExecArray | null;

    while ((match = createTableRegex.exec(content))) {
      const tableKind = match[1]?.toUpperCase() ?? "";
      if (tableKind.startsWith("TEMP")) continue;

      const table = normalizeSqlIdentifier(match[2]);
      if (!isPublicSchemaIdentifier(table)) continue;

      const creations = createdTables.get(table) ?? [];
      creations.push({ table, file: file.name });
      createdTables.set(table, creations);
    }

    while ((match = enableRlsRegex.exec(content))) {
      const table = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(table)) {
        rlsEnabledTables.add(table);
      }
    }

    while ((match = disableRlsRegex.exec(content))) {
      const table = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(table)) {
        rlsDisabledTables.push({ table, file: file.name });
      }
    }
  }

  for (const [table, creations] of createdTables) {
    if (rlsEnabledTables.has(table)) continue;
    const sourceFiles = creations.map((creation) => creation.file).join(", ");
    violations.push(
      `Tabela publica sem ENABLE ROW LEVEL SECURITY: ${table} (criada em ${sourceFiles}).`,
    );
  }

  for (const disabled of rlsDisabledTables) {
    violations.push(
      `ALTER TABLE DISABLE ROW LEVEL SECURITY detectado em tabela publica: ${disabled.table} (${disabled.file}).`,
    );
  }

  return violations;
}

function validatePublicViewSecurityInvoker(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const createdViews = new Set<string>();
  const securityInvokerViews = new Set<string>();
  const publicViewGrants: ViewGrant[] = [];

  const createViewRegex = new RegExp(
    String.raw`\bCREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(${SQL_IDENTIFIER})([\s\S]{0,260}?)\bAS\b`,
    "gi",
  );
  const alterViewInvokerRegex = new RegExp(
    String.raw`\bALTER\s+VIEW\s+(?:IF\s+EXISTS\s+)?(${SQL_IDENTIFIER})\s+SET\s*\([^)]*security_invoker\s*=\s*true`,
    "gi",
  );
  const grantSelectRegex = new RegExp(
    String.raw`\bGRANT\s+SELECT\s+ON\s+(?:TABLE\s+)?(${SQL_IDENTIFIER})\s+TO\s+([^;]+)`,
    "gi",
  );

  for (const file of files) {
    const content = stripSqlComments(fs.readFileSync(file.fullPath, "utf8"));
    let match: RegExpExecArray | null;

    while ((match = createViewRegex.exec(content))) {
      const view = normalizeSqlIdentifier(match[1]);
      if (!isPublicSchemaIdentifier(view)) continue;

      createdViews.add(view);
      if (/security_invoker\s*=\s*true/i.test(match[2])) {
        securityInvokerViews.add(view);
      }
    }

    while ((match = alterViewInvokerRegex.exec(content))) {
      const view = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(view)) {
        securityInvokerViews.add(view);
      }
    }

    while ((match = grantSelectRegex.exec(content))) {
      const grantees = match[2].toLowerCase();
      if (!/\banon\b|\bauthenticated\b/.test(grantees)) continue;

      const view = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(view)) {
        publicViewGrants.push({ view, file: file.name });
      }
    }
  }

  const reportedViews = new Set<string>();
  for (const grant of publicViewGrants) {
    if (!createdViews.has(grant.view) || securityInvokerViews.has(grant.view)) continue;
    if (reportedViews.has(grant.view)) continue;

    reportedViews.add(grant.view);
    violations.push(
      `View publica concedida a anon/authenticated sem security_invoker=true: ${grant.view} (grant em ${grant.file}).`,
    );
  }

  return violations;
}

function validateMigrationAccessControl(files: MigrationFile[]): string[] {
  return [
    ...validatePublicTableRls(files),
    ...validatePublicViewSecurityInvoker(files),
  ];
}

function main() {
  const violations: string[] = [];
  const files = readMigrationFiles();
  const seenVersions = new Map<string, string>();
  const hasSecurityDefinerHardening = files.some(
    (file) => file.version === SECURITY_DEFINER_HARDENING_VERSION,
  );

  if (!hasSecurityDefinerHardening) {
    violations.push(
      `Migration de hardening SECURITY DEFINER ausente: ${SECURITY_DEFINER_HARDENING_VERSION}_harden_security_definer_search_path.sql`,
    );
  }

  for (const file of files) {
    if (seenVersions.has(file.version)) {
      violations.push(
        `Versao duplicada ${file.version}: ${seenVersions.get(file.version)} e ${file.name}`,
      );
    } else {
      seenVersions.set(file.version, file.name);
    }

    const content = fs.readFileSync(file.fullPath, "utf8");
    if (content.length > 0 && content.charCodeAt(0) === 0xfeff) {
      violations.push(`Arquivo com BOM UTF-8 detectado: ${file.name}`);
    }

    for (const pattern of INVALID_DO_BLOCK_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `Bloco DO com delimitador invalido detectado em ${file.name}. Use DO $$ ... END $$;`,
        );
        break;
      }
    }

    if (
      file.version > SECURITY_DEFINER_HARDENING_VERSION &&
      /SECURITY\s+DEFINER/i.test(content) &&
      !/SET\s+search_path/i.test(content)
    ) {
      violations.push(
        `Funcao SECURITY DEFINER sem SET search_path explicito em ${file.name}.`,
      );
    }
  }

  violations.push(...validateMigrationAccessControl(files));

  if (violations.length > 0) {
    console.error("Falhas de hygiene em migrations Supabase:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Migrations Supabase estao consistentes.");
}

main();
