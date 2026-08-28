import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const FILENAME_PATTERN = /^(\d+)_(.+)\.sql$/;
const INVALID_DO_BLOCK_PATTERNS = [/^DO \$$/m, /^END \$;$/m];
const SECURITY_DEFINER_HARDENING_VERSION = "20260526000001";
const SECURITY_AUTHORITY_ENFORCEMENT_VERSION = "20260707000000";
const EXTENSION_OWNER_PREFLIGHT_ENFORCEMENT_VERSION = "20260708000032";
const EXTENSION_OWNER_EXCEPTION_ID = "EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE";
const SQL_IDENTIFIER = String.raw`(?:"[^"]+"|[A-Za-z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][\w$]*))?`;
const MUTATING_RPC_NAME_PATTERN =
  /^public\.(create|update|delete|remove|insert|upsert|set|switch|revoke|mark|add|increment|decrement|accept|activate|cancel|log|record|track|process|expire|release|toggle|invite|approve|reject|publish|request)_/i;
const RPC_AUTH_GUARD_PATTERN =
  /auth\.uid\s*\(|auth\.role\s*\(|\bis_admin\b|\bis_admin_user\b|\bis_admin_from_roles\b|\bhas_role\b|current_setting\s*\(|jwt\s*\(/i;

export interface MigrationFile {
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

interface FunctionDefinition {
  name: string;
  file: string;
  securityDefiner: boolean;
  hasAuthGuard: boolean;
}

interface FunctionGrant {
  name: string;
  file: string;
}

interface PublicTableCreation {
  table: string;
  file: string;
  content: string;
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

function isSecurityAuthorityEnforced(file: MigrationFile): boolean {
  return file.version >= SECURITY_AUTHORITY_ENFORCEMENT_VERSION;
}

function isExtensionOwnerPreflightEnforced(file: MigrationFile): boolean {
  return file.version >= EXTENSION_OWNER_PREFLIGHT_ENFORCEMENT_VERSION;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasSecurityAuthorityMarker(
  content: string,
  marker: string,
  objectName: string,
): boolean {
  const pattern = new RegExp(
    String.raw`security-authority:\s*${escapeRegExp(marker)}\s+${escapeRegExp(objectName)}`,
    "i",
  );
  return pattern.test(content);
}

function hasExtensionOwnerPreflightMarker(content: string): boolean {
  const pattern = new RegExp(
    String.raw`security-authority:\s*extension-owner-preflight\s+${escapeRegExp(EXTENSION_OWNER_EXCEPTION_ID)}`,
    "i",
  );
  return pattern.test(content);
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
    if (!createdViews.has(grant.view) || securityInvokerViews.has(grant.view))
      continue;
    if (reportedViews.has(grant.view)) continue;

    reportedViews.add(grant.view);
    violations.push(
      `View publica concedida a anon/authenticated sem security_invoker=true: ${grant.view} (grant em ${grant.file}).`,
    );
  }

  return violations;
}

function validatePublicTableAccessDecisions(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const creations: PublicTableCreation[] = [];
  const grantOrRevokeDecisions = new Map<string, Set<string>>();

  const createTableRegex = new RegExp(
    String.raw`\bCREATE\s+(?:(TEMP(?:ORARY)?|UNLOGGED)\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(${SQL_IDENTIFIER})`,
    "gi",
  );
  const grantTableRegex = new RegExp(
    String.raw`\bGRANT\s+[^;]+?\s+ON\s+(?:TABLE\s+)?(${SQL_IDENTIFIER})\s+TO\s+([^;]+)`,
    "gi",
  );
  const revokeTableRegex = new RegExp(
    String.raw`\bREVOKE\s+[^;]+?\s+ON\s+(?:TABLE\s+)?(${SQL_IDENTIFIER})\s+FROM\s+([^;]+)`,
    "gi",
  );

  for (const file of files.filter(isSecurityAuthorityEnforced)) {
    const rawContent = fs.readFileSync(file.fullPath, "utf8");
    const content = stripSqlComments(rawContent);
    let match: RegExpExecArray | null;

    while ((match = createTableRegex.exec(content))) {
      const tableKind = match[1]?.toUpperCase() ?? "";
      if (tableKind.startsWith("TEMP")) continue;

      const table = normalizeSqlIdentifier(match[2]);
      if (!isPublicSchemaIdentifier(table)) continue;
      creations.push({ table, file: file.name, content: rawContent });
    }

    const fileDecisions = new Set<string>();
    while ((match = grantTableRegex.exec(content))) {
      const grantees = match[2].toLowerCase();
      if (
        !/\banon\b|\bauthenticated\b|\bservice_role\b|\bpublic\b/.test(grantees)
      ) {
        continue;
      }

      const table = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(table)) fileDecisions.add(table);
    }

    while ((match = revokeTableRegex.exec(content))) {
      const grantees = match[2].toLowerCase();
      if (
        !/\banon\b|\bauthenticated\b|\bservice_role\b|\bpublic\b/.test(grantees)
      ) {
        continue;
      }

      const table = normalizeSqlIdentifier(match[1]);
      if (isPublicSchemaIdentifier(table)) fileDecisions.add(table);
    }

    grantOrRevokeDecisions.set(file.name, fileDecisions);
  }

  for (const creation of creations) {
    const fileDecisions =
      grantOrRevokeDecisions.get(creation.file) ?? new Set<string>();
    const hasGrantOrRevokeDecision = fileDecisions.has(creation.table);
    const hasNoDataApiMarker =
      hasSecurityAuthorityMarker(
        creation.content,
        "no-data-api",
        creation.table,
      ) ||
      hasSecurityAuthorityMarker(
        creation.content,
        "internal-table",
        creation.table,
      );

    if (hasGrantOrRevokeDecision || hasNoDataApiMarker) continue;

    violations.push(
      [
        `Tabela publica criada sem decisao explicita de acesso Data API: ${creation.table} (${creation.file}).`,
        `Inclua GRANT/REVOKE no mesmo arquivo ou um comentario`,
        `"-- security-authority: no-data-api ${creation.table}".`,
      ].join(" "),
    );
  }

  return violations;
}

function validateAnonRpcGrantClassifications(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const grantExecuteRegex = new RegExp(
    String.raw`\bGRANT\s+EXECUTE\s+ON\s+FUNCTION\s+(${SQL_IDENTIFIER})\s*\([^)]*\)\s+TO\s+([^;]+)`,
    "gi",
  );

  for (const file of files.filter(isSecurityAuthorityEnforced)) {
    const rawContent = fs.readFileSync(file.fullPath, "utf8");
    const content = stripSqlComments(rawContent);
    let match: RegExpExecArray | null;

    while ((match = grantExecuteRegex.exec(content))) {
      const grantees = match[2].toLowerCase();
      if (!/\banon\b|\bpublic\b/.test(grantees)) continue;

      const functionName = normalizeSqlIdentifier(match[1]);
      if (!isPublicSchemaIdentifier(functionName)) continue;
      if (hasSecurityAuthorityMarker(rawContent, "public-rpc", functionName))
        continue;

      violations.push(
        [
          `RPC concedida a anon/PUBLIC sem classificacao Security Authority: ${functionName} (${file.name}).`,
          `Inclua justificativa no arquivo com`,
          `"-- security-authority: public-rpc ${functionName}".`,
        ].join(" "),
      );
    }
  }

  return violations;
}

function validatePublicStorageListingClassifications(
  files: MigrationFile[],
): string[] {
  const violations: string[] = [];
  const createStoragePolicyRegex =
    /\bCREATE\s+POLICY\b[\s\S]*?\bON\s+storage\.objects\b[\s\S]*?\bFOR\s+SELECT\b[\s\S]*?\bTO\s+[^;]*\banon\b[\s\S]*?\bUSING\s*\(\s*true\s*\)\s*;/gi;

  for (const file of files.filter(isSecurityAuthorityEnforced)) {
    const rawContent = fs.readFileSync(file.fullPath, "utf8");
    const content = stripSqlComments(rawContent);
    if (!createStoragePolicyRegex.test(content)) continue;
    createStoragePolicyRegex.lastIndex = 0;

    if (
      hasSecurityAuthorityMarker(
        rawContent,
        "public-storage-listing",
        "storage.objects",
      )
    ) {
      continue;
    }

    violations.push(
      [
        `Policy de listagem publica ampla em storage.objects sem classificacao Security Authority (${file.name}).`,
        `Evite USING (true) para anon ou inclua justificativa com`,
        `"-- security-authority: public-storage-listing storage.objects".`,
      ].join(" "),
    );
  }

  return violations;
}

function validateExtensionOwnerPreflight(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const blockedObjectPatterns = [
    {
      label: "public.spatial_ref_sys",
      pattern:
        /\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\s*\.\s*spatial_ref_sys\b|\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?public\s*\.\s*spatial_ref_sys\b/gi,
    },
    {
      label: "public.st_estimatedextent",
      pattern:
        /\b(?:GRANT|REVOKE|ALTER|DROP)\b[\s\S]{0,220}\b(?:ON\s+FUNCTION\s+)?public\s*\.\s*st_estimatedextent\b/gi,
    },
  ];

  for (const file of files.filter(isExtensionOwnerPreflightEnforced)) {
    const rawContent = fs.readFileSync(file.fullPath, "utf8");
    const content = stripSqlComments(rawContent);
    const touchedObjects = blockedObjectPatterns
      .filter(({ pattern }) => pattern.test(content))
      .map(({ label }) => label);

    for (const { pattern } of blockedObjectPatterns) {
      pattern.lastIndex = 0;
    }

    if (touchedObjects.length === 0) continue;
    if (hasExtensionOwnerPreflightMarker(rawContent)) continue;

    violations.push(
      [
        `Migration toca objeto PostGIS/extension-owner sem preflight vinculado: ${file.name}`,
        `(${Array.from(new Set(touchedObjects)).join(", ")}).`,
        `Inclua evidencia e o marcador`,
        `"-- security-authority: extension-owner-preflight ${EXTENSION_OWNER_EXCEPTION_ID}"`,
        `somente depois de aprovar a via de owner/plataforma.`,
      ].join(" "),
    );
  }

  return violations;
}

function validateExposedMutatingRpcGuards(files: MigrationFile[]): string[] {
  const violations: string[] = [];
  const functions = new Map<string, FunctionDefinition>();
  const browserAccess = new Map<
    string,
    { principals: Set<string>; lastGrantFile: string }
  >();

  const createFunctionRegex = new RegExp(
    String.raw`\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(${SQL_IDENTIFIER})\s*\([^)]*\)([\s\S]*?)(?=\n\s*(?:CREATE|ALTER|DROP|GRANT|REVOKE|COMMENT|NOTIFY|DO\b|$))`,
    "gi",
  );
  const grantExecuteRegex = new RegExp(
    String.raw`\bGRANT\s+EXECUTE\s+ON\s+FUNCTION\s+(${SQL_IDENTIFIER})\s*\([^)]*\)\s+TO\s+([^;]+)`,
    "gi",
  );
  const revokeExecuteRegex = new RegExp(
    String.raw`\bREVOKE\s+(?:ALL|EXECUTE)\s+ON\s+FUNCTION\s+(${SQL_IDENTIFIER})\s*\([^)]*\)\s+FROM\s+([^;]+)`,
    "gi",
  );
  const dropFunctionRegex = new RegExp(
    String.raw`\bDROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(${SQL_IDENTIFIER})\s*\([^;]*?\)\s*(?:CASCADE|RESTRICT)?\s*;?`,
    "gi",
  );
  const browserPrincipals = ["public", "anon", "authenticated"] as const;

  const orderedFiles = [...files].sort(
    (left, right) =>
      left.version.localeCompare(right.version) ||
      left.name.localeCompare(right.name),
  );

  for (const file of orderedFiles) {
    const content = stripSqlComments(fs.readFileSync(file.fullPath, "utf8"));
    let match: RegExpExecArray | null;

    const functionEvents: Array<{
      index: number;
      action: "create" | "drop" | "grant" | "revoke";
      name: string;
      principals?: string;
      definition?: FunctionDefinition;
    }> = [];

    while ((match = createFunctionRegex.exec(content))) {
      const name = normalizeSqlIdentifier(match[1]);
      if (!isPublicSchemaIdentifier(name)) continue;

      const body = match[2];
      functionEvents.push({
        index: match.index,
        action: "create",
        name,
        definition: {
          name,
          file: file.name,
          securityDefiner: /\bSECURITY\s+DEFINER\b/i.test(body),
          hasAuthGuard: RPC_AUTH_GUARD_PATTERN.test(body),
        },
      });
    }

    while ((match = dropFunctionRegex.exec(content))) {
      functionEvents.push({
        index: match.index,
        action: "drop",
        name: normalizeSqlIdentifier(match[1]),
      });
    }

    while ((match = grantExecuteRegex.exec(content))) {
      functionEvents.push({
        index: match.index,
        action: "grant",
        name: normalizeSqlIdentifier(match[1]),
        principals: match[2].toLowerCase(),
      });
    }

    while ((match = revokeExecuteRegex.exec(content))) {
      functionEvents.push({
        index: match.index,
        action: "revoke",
        name: normalizeSqlIdentifier(match[1]),
        principals: match[2].toLowerCase(),
      });
    }

    for (const change of functionEvents.sort(
      (left, right) => left.index - right.index,
    )) {
      if (!isPublicSchemaIdentifier(change.name)) continue;

      if (change.action === "drop") {
        functions.delete(change.name);
        browserAccess.delete(change.name);
        continue;
      }

      if (change.action === "create") {
        if (!change.definition) continue;
        functions.set(change.name, change.definition);

        // PostgreSQL grants EXECUTE to PUBLIC when a function is first created.
        if (!browserAccess.has(change.name)) {
          browserAccess.set(change.name, {
            principals: new Set(["public"]),
            lastGrantFile: file.name,
          });
        }
        continue;
      }

      const state = browserAccess.get(change.name) ?? {
        principals: new Set<string>(),
        lastGrantFile: file.name,
      };

      for (const principal of browserPrincipals) {
        if (
          !new RegExp(`\\b${principal}\\b`, "i").test(change.principals ?? "")
        )
          continue;
        if (change.action === "grant") {
          state.principals.add(principal);
          state.lastGrantFile = file.name;
        } else {
          state.principals.delete(principal);
        }
      }

      browserAccess.set(change.name, state);
    }
  }

  const functionGrants: FunctionGrant[] = Array.from(browserAccess.entries())
    .filter(([, state]) => state.principals.size > 0)
    .map(([name, state]) => ({ name, file: state.lastGrantFile }));

  const reported = new Set<string>();
  for (const grant of functionGrants) {
    if (reported.has(grant.name)) continue;
    if (!MUTATING_RPC_NAME_PATTERN.test(grant.name)) continue;

    const definition = functions.get(grant.name);
    if (!definition?.securityDefiner || definition.hasAuthGuard) continue;

    reported.add(grant.name);
    violations.push(
      `RPC mutante SECURITY DEFINER exposto sem guarda de auth: ${grant.name} (funcao em ${definition.file}, grant em ${grant.file}).`,
    );
  }

  return violations;
}

function validateMigrationAccessControl(files: MigrationFile[]): string[] {
  return [
    ...validatePublicTableRls(files),
    ...validatePublicViewSecurityInvoker(files),
    ...validatePublicTableAccessDecisions(files),
    ...validateExposedMutatingRpcGuards(files),
    ...validateAnonRpcGrantClassifications(files),
    ...validatePublicStorageListingClassifications(files),
    ...validateExtensionOwnerPreflight(files),
  ];
}

export function validateMigrationFiles(files: MigrationFile[]): string[] {
  const violations: string[] = [];
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

  return violations;
}

function main() {
  const violations = validateMigrationFiles(readMigrationFiles());

  if (violations.length > 0) {
    console.error("Falhas de hygiene em migrations Supabase:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Migrations Supabase estao consistentes.");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
