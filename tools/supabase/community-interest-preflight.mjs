#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifySupabaseCliFailure } from "./supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "./supabase-cli-query-json.mjs";
import { runSupabaseCli } from "./supabase-cli-runner.mjs";

const VALID_PHASES = new Set(["additive", "cutover"]);
export const REQUIRED_CUTOVER_EVIDENCE = [
  "EDGE_FUNCTION_DEPLOYED",
  "TURNSTILE_SECRET_CONFIGURED",
  "ALLOWED_ORIGINS_CONFIGURED",
  "BROKER_FRONTEND_DEPLOYED",
];

function statusFor(phase, passed) {
  return `COMMUNITY_INTEREST_${phase.toUpperCase()}_PREFLIGHT_${passed ? "PASS" : "BLOCKED"}`;
}

function usage() {
  return [
    "Uso:",
    "  npm run community-interest:preflight -- --phase additive",
    "  npm run community-interest:preflight -- --phase cutover --evidence EDGE_FUNCTION_DEPLOYED --evidence TURNSTILE_SECRET_CONFIGURED --evidence ALLOWED_ORIGINS_CONFIGURED --evidence BROKER_FRONTEND_DEPLOYED",
    "",
    "Executa exclusivamente SELECTs no projeto Supabase linkado.",
    "Evidencias CUTOVER sao declaracoes MANUAL_OPERATIONAL_EVIDENCE; nenhum secret e lido.",
  ].join("\n");
}

export function parseArgs(argv) {
  let phase = "additive";
  const evidence = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--phase") {
      phase = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--evidence") {
      const key = argv[index + 1];
      if (!REQUIRED_CUTOVER_EVIDENCE.includes(key)) {
        throw new Error(
          `Evidencia operacional desconhecida: ${key ?? "<ausente>"}`,
        );
      }
      evidence.add(key);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h")
      return { evidence, help: true, phase };
    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!VALID_PHASES.has(phase)) throw new Error(`Fase invalida: ${phase}`);
  if (phase === "additive" && evidence.size > 0) {
    throw new Error("Evidencia operacional pertence somente ao CUTOVER.");
  }
  return { evidence, help: false, phase };
}

export function buildCommunityInterestSchemaProbeSql() {
  return `
with expected_columns(column_name, udt_name, required_before_additive) as (
  values
    ('id', 'uuid', true),
    ('community_id', 'uuid', true),
    ('community_slug', 'text', true),
    ('territory_path', 'text', true),
    ('full_name', 'text', true),
    ('email', 'text', true),
    ('phone', 'text', true),
    ('role', 'community_interest_role', true),
    ('message', 'text', true),
    ('wants_updates', 'bool', true),
    ('source', 'text', true),
    ('user_agent', 'text', true),
    ('turnstile_verified', 'bool', true),
    ('user_id', 'uuid', true),
    ('created_at', 'timestamptz', true),
    ('updated_at', 'timestamptz', true),
    ('admin_status', 'text', false),
    ('admin_notes', 'text', false),
    ('reviewed_at', 'timestamptz', false),
    ('reviewed_by', 'uuid', false)
), actual_columns as (
  select column_name, udt_name
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'community_interest_registrations'
), legacy_insert_columns(column_name) as (
  values
    ('community_id'),
    ('community_slug'),
    ('territory_path'),
    ('full_name'),
    ('email'),
    ('phone'),
    ('role'),
    ('message'),
    ('wants_updates'),
    ('source'),
    ('user_agent'),
    ('turnstile_verified')
)
select
  to_regclass('auth.users') is not null as auth_users_exists,
  to_regprocedure('private.is_admin(uuid)') is not null as private_is_admin_exists,
  to_regclass('public.community_interest_registrations') is not null as table_exists,
  exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'community_interest_role'
  ) as role_type_exists,
  coalesce((
    select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)::text[] =
      array['morador', 'comerciante', 'prestador', 'visitante', 'outro']::text[]
    from pg_type role_type
    join pg_enum enum_value on enum_value.enumtypid = role_type.oid
    where role_type.typnamespace = 'public'::regnamespace
      and role_type.typname = 'community_interest_role'
  ), false) as role_labels_compatible,
  coalesce((
    select class.relrowsecurity
    from pg_class class
    where class.oid = to_regclass('public.community_interest_registrations')
  ), false) as rls_enabled,
  (
    select count(*)
    from expected_columns expected
    left join actual_columns actual using (column_name)
    where expected.required_before_additive
      and actual.column_name is null
  ) as missing_required_column_count,
  (
    select count(*)
    from expected_columns expected
    join actual_columns actual using (column_name)
    where actual.udt_name <> expected.udt_name
  ) as incompatible_column_count,
  (
    select count(*)
    from actual_columns actual
    left join expected_columns expected using (column_name)
    where expected.column_name is null
  ) as unexpected_column_count,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_interest_registrations'
      and policyname not in (
        'community_interest_public_insert',
        'community_interest_legacy_insert',
        'community_interest_owner_select',
        'community_interest_admin_select',
        'community_interest_admin_update',
        'community_interest_admin_delete'
      )
  ) as unexpected_policy_count,
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'community_interest_registrations'
      and (
        grantee = 'PUBLIC'
        or (grantee = 'anon' and privilege_type <> 'INSERT')
        or (
          grantee = 'authenticated'
          and privilege_type not in ('INSERT', 'SELECT', 'UPDATE', 'DELETE')
        )
      )
  ) + (
    select count(*)
    from information_schema.role_column_grants column_grant
    left join legacy_insert_columns expected
      on expected.column_name = column_grant.column_name
    where column_grant.table_schema = 'public'
      and column_grant.table_name = 'community_interest_registrations'
      and column_grant.grantee in ('anon', 'authenticated')
      and column_grant.privilege_type = 'INSERT'
      and expected.column_name is null
  ) as unexpected_grant_count,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'community_interest_registrations'
      and policyname = 'community_interest_legacy_insert'
      and cmd = 'INSERT'
  ) as legacy_policy_exists,
  (
    select count(*) = 24
    from information_schema.role_column_grants column_grant
    join legacy_insert_columns expected
      on expected.column_name = column_grant.column_name
    where column_grant.table_schema = 'public'
      and column_grant.table_name = 'community_interest_registrations'
      and column_grant.grantee in ('anon', 'authenticated')
      and column_grant.privilege_type = 'INSERT'
  ) as legacy_insert_columns_granted,
  case
    when to_regclass('public.community_interest_registrations') is null then false
    else has_table_privilege(
      'service_role',
      'public.community_interest_registrations',
      'INSERT'
    )
  end as broker_insert_granted;
`.trim();
}

export function parseSupabaseQueryJson(output) {
  const rows = parseSupabaseQueryRows(output);
  if (rows.length === 0) {
    throw new Error("Supabase CLI JSON nao contem rows.");
  }
  return rows[0];
}

function runSupabaseQuery(sql) {
  const tempDir = mkdtempSync(
    join(tmpdir(), "achegue-community-interest-preflight-"),
  );
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
      throw new Error(
        [
          `${classifySupabaseCliFailure(output)}: Community Interest preflight read-only indisponivel.`,
          "Comando: supabase db query --linked --output json --file <readonly-query>",
          output.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    return parseSupabaseQueryJson(output);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function numericCount(schema, key) {
  const value = Number(schema[key] ?? 0);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function evaluateCommunityInterestPreflight({
  evidence,
  phase,
  schema,
}) {
  if (!VALID_PHASES.has(phase)) throw new Error(`Fase invalida: ${phase}`);
  const blockers = [];

  if (schema.auth_users_exists !== true) blockers.push("auth_users_exists");
  if (schema.private_is_admin_exists !== true)
    blockers.push("private_is_admin_exists");
  if (
    schema.role_type_exists === true &&
    schema.role_labels_compatible !== true
  ) {
    blockers.push("role_labels_compatible");
  }

  if (schema.table_exists === true) {
    for (const key of [
      "missing_required_column_count",
      "incompatible_column_count",
      "unexpected_column_count",
      "unexpected_policy_count",
      "unexpected_grant_count",
    ]) {
      if (numericCount(schema, key) > 0) blockers.push(key);
    }
  }

  const evidenceState = Object.fromEntries(
    REQUIRED_CUTOVER_EVIDENCE.map((key) => [key, evidence.has(key)]),
  );

  if (phase === "cutover") {
    for (const [key, verified] of Object.entries(evidenceState)) {
      if (!verified) blockers.push(`MANUAL_OPERATIONAL_EVIDENCE:${key}`);
    }
    for (const key of [
      "table_exists",
      "role_type_exists",
      "role_labels_compatible",
      "rls_enabled",
      "legacy_policy_exists",
      "legacy_insert_columns_granted",
      "broker_insert_granted",
    ]) {
      if (schema[key] !== true) blockers.push(key);
    }
  }

  return {
    blockers,
    evidence: evidenceState,
    evidenceSource: "MANUAL_OPERATIONAL_EVIDENCE",
    phase,
    schema,
    status: statusFor(phase, blockers.length === 0),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const missingEvidence = REQUIRED_CUTOVER_EVIDENCE.filter(
    (key) => options.phase === "cutover" && !options.evidence.has(key),
  );
  if (missingEvidence.length > 0) {
    const result = {
      blockers: missingEvidence.map(
        (key) => `MANUAL_OPERATIONAL_EVIDENCE:${key}`,
      ),
      evidence: Object.fromEntries(
        REQUIRED_CUTOVER_EVIDENCE.map((key) => [
          key,
          options.evidence.has(key),
        ]),
      ),
      evidenceSource: "MANUAL_OPERATIONAL_EVIDENCE",
      phase: options.phase,
      schema: null,
      status: statusFor(options.phase, false),
    };
    console.log(JSON.stringify(result, null, 2));
    console.log(result.status);
    process.exitCode = 1;
    return;
  }
  const result = evaluateCommunityInterestPreflight({
    evidence: options.evidence,
    phase: options.phase,
    schema: runSupabaseQuery(buildCommunityInterestSchemaProbeSql()),
  });
  console.log(JSON.stringify(result, null, 2));
  console.log(result.status);
  if (result.blockers.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    const phase = process.argv.includes("cutover") ? "cutover" : "additive";
    console.error(error instanceof Error ? error.message : String(error));
    console.error(statusFor(phase, false));
    process.exit(1);
  });
}
