#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { classifySupabaseCliFailure } from "../lib/supabase-cli-validation-state.mjs";
import { runSupabaseCli } from "../lib/supabase-cli-runner.mjs";

const POSTGIS_EXTENSION_EXCEPTION_ID = "EXC-2026-07-08-POSTGIS-EXTENSION-OWNER";
const PUBLIC_EXTENSION_NAMES = ["postgis", "unaccent", "pg_trgm", "citext"];

function usage() {
  return [
    "Uso:",
    "  node scripts/security/supabase-postgis-owner-preflight.mjs",
    "  node scripts/security/supabase-postgis-owner-preflight.mjs --json",
    "  node scripts/security/supabase-postgis-owner-preflight.mjs --fail-if-blocked",
    "",
    "Executa apenas SELECTs no catalogo Postgres remoto linkado.",
    "Nao altera grants, RLS, extensoes ou migrations.",
  ].join("\n");
}

export function parseArgs(argv) {
  const options = {
    failIfBlocked: false,
    json: false,
  };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--fail-if-blocked") {
      options.failIfBlocked = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  return options;
}

export function buildPostgisOwnerPreflightSql() {
  return `
with role_context as (
  select
    current_user as current_user,
    coalesce((select rolsuper from pg_roles where rolname = current_user), false) as current_user_is_superuser
),
extension_rows as (
  select
    e.extname,
    n.nspname as extension_schema,
    pg_get_userbyid(e.extowner) as extension_owner
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = any (array['${PUBLIC_EXTENSION_NAMES.join("','")}'])
),
spatial_ref_sys_rows as (
  select
    n.nspname as table_schema,
    c.relname as table_name,
    pg_get_userbyid(c.relowner) as table_owner,
    c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'spatial_ref_sys'
    and c.relkind in ('r', 'p')
),
estimated_extent_rows as (
  select
    p.oid::regprocedure::text as signature,
    pg_get_userbyid(p.proowner) as function_owner,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'st_estimatedextent'
)
select
  (select row_to_json(role_context) from role_context) as role_context,
  coalesce((select jsonb_agg(to_jsonb(extension_rows) order by extname) from extension_rows), '[]'::jsonb) as extensions,
  coalesce((select jsonb_agg(to_jsonb(spatial_ref_sys_rows) order by table_name) from spatial_ref_sys_rows), '[]'::jsonb) as spatial_ref_sys,
  coalesce((select jsonb_agg(to_jsonb(estimated_extent_rows) order by signature) from estimated_extent_rows), '[]'::jsonb) as st_estimatedextent;
`.trim();
}

function runSupabaseQuery(sql) {
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-postgis-preflight-"));
  const sqlPath = join(tempDir, "preflight.sql");
  writeFileSync(sqlPath, sql);

  try {
    const result = runSupabaseCli(
      ["db", "query", "--linked", "--output", "json", "--file", sqlPath],
      {
        cwd: process.cwd(),
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    if (result.error) {
      throw new Error(
        `LOCAL_FAILURE: falha ao executar Supabase CLI: ${result.error.message}`,
      );
    }

    if (result.status !== 0) {
      const validationState = classifySupabaseCliFailure(output);
      throw new Error(
        [
          `${validationState}: nao foi possivel consultar o preflight PostGIS remoto.`,
          "Comando: supabase db query --linked --output json --file <readonly catalog query>",
          output.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }

    return output;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function extractJsonObject(output) {
  const start = output.indexOf("{");
  if (start < 0) {
    throw new Error("Supabase CLI nao retornou objeto JSON.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < output.length; index += 1) {
    const char = output[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return output.slice(start, index + 1);
      }
    }
  }

  throw new Error("Supabase CLI retornou JSON incompleto.");
}

export function parseSupabaseQueryJson(output) {
  const parsed = JSON.parse(extractJsonObject(output));
  const rows = parsed.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Supabase CLI JSON nao contem rows.");
  }

  return rows[0];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizePostgisPreflightRow(row) {
  return {
    roleContext: row.role_context ?? {
      current_user: null,
      current_user_is_superuser: false,
    },
    extensions: asArray(row.extensions),
    spatialRefSys: asArray(row.spatial_ref_sys),
    stEstimatedExtent: asArray(row.st_estimatedextent),
  };
}

function isOwnedByCurrentRole(owner, roleContext) {
  return Boolean(
    owner &&
    (roleContext.current_user_is_superuser === true ||
      owner === roleContext.current_user),
  );
}

export function evaluatePostgisOwnerPreflight(snapshot) {
  const findings = [];
  const roleContext = snapshot.roleContext;

  for (const extension of snapshot.extensions) {
    if (extension.extension_schema !== "public") continue;
    findings.push({
      object: `extension:${extension.extname}`,
      owner: extension.extension_owner,
      ready: isOwnedByCurrentRole(extension.extension_owner, roleContext),
      risk: "extension_in_public",
      summary: `Extensao ${extension.extname} permanece em public.`,
    });
  }

  for (const table of snapshot.spatialRefSys) {
    if (table.rls_enabled === true) continue;
    findings.push({
      object: `${table.table_schema}.${table.table_name}`,
      owner: table.table_owner,
      ready: isOwnedByCurrentRole(table.table_owner, roleContext),
      risk: "rls_disabled",
      summary: "public.spatial_ref_sys esta sem RLS.",
    });
  }

  for (const fn of snapshot.stEstimatedExtent) {
    if (fn.anon_execute !== true && fn.authenticated_execute !== true) continue;
    findings.push({
      object: `public.${fn.signature}`,
      owner: fn.function_owner,
      ready: isOwnedByCurrentRole(fn.function_owner, roleContext),
      risk: "public_execute_security_definer",
      summary: "st_estimatedextent segue executavel por anon/authenticated.",
    });
  }

  const blockedFindings = findings.filter((finding) => !finding.ready);

  return {
    checkedAt: new Date().toISOString(),
    exceptionId: POSTGIS_EXTENSION_EXCEPTION_ID,
    findings,
    ready: findings.length > 0 && blockedFindings.length === 0,
    status:
      findings.length === 0
        ? "resolved"
        : blockedFindings.length === 0
          ? "ready"
          : "blocked",
  };
}

function printResult(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`PostGIS owner preflight: ${result.status}`);
  console.log(`Excecao: ${result.exceptionId}`);
  console.log(`Achados avaliados: ${result.findings.length}`);

  for (const finding of result.findings) {
    console.log(
      `- ${finding.ready ? "READY" : "BLOCKED"} ${finding.object} owner=${finding.owner ?? "<unknown>"} risk=${finding.risk}`,
    );
  }

  if (result.status === "blocked") {
    console.log(
      "Nao use o marcador extension-owner-preflight em migration ate existir via de owner/plataforma aprovada.",
    );
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const row = parseSupabaseQueryJson(
    runSupabaseQuery(buildPostgisOwnerPreflightSql()),
  );
  const result = evaluatePostgisOwnerPreflight(
    normalizePostgisPreflightRow(row),
  );

  printResult(result, options.json);

  if (options.failIfBlocked && result.status === "blocked") {
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
