#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifySupabaseCliFailure } from "./lib/supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "./lib/supabase-cli-query-json.mjs";
import { runSupabaseCli } from "./lib/supabase-cli-runner.mjs";

const VALID_PHASES = new Set(["additive", "cutover"]);

function usage() {
  return [
    "Uso:",
    "  npm run poll:preflight -- --phase additive",
    "  npm run poll:preflight -- --phase cutover",
    "",
    "Executa exclusivamente SELECTs no projeto Supabase linkado.",
    "Saida final: POLL_PREFLIGHT_PASS ou POLL_PREFLIGHT_BLOCKED.",
  ].join("\n");
}

export function parseArgs(argv) {
  let phase = "additive";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--phase") {
      phase = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return { help: true, phase };
    }

    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!VALID_PHASES.has(phase)) {
    throw new Error(`Fase invalida: ${phase}`);
  }

  return { help: false, phase };
}

export function buildPollSchemaProbeSql() {
  return `
select
  to_regclass('public.posts') is not null as posts_exists,
  to_regclass('public.profiles') is not null as profiles_exists,
  to_regclass('public.community_polls') is not null as polls_exists,
  to_regclass('public.community_poll_options') is not null as options_exists,
  to_regclass('public.community_poll_votes') is not null as votes_exists,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_poll_votes'
      and column_name = 'profile_id'
      and data_type = 'uuid'
  ) as profile_id_exists;
`.trim();
}

function voteInventorySql(votesExists, profileIdExists) {
  if (!votesExists) {
    return `
      0::bigint as votes_total,
      0::bigint as vote_poll_option_mismatch,
      0::bigint as vote_invalid_profile,
      0::bigint as votes_without_profile,
      0::bigint as canonical_vote_duplicate_groups,
      0::bigint as single_choice_profile_duplicate_groups`;
  }

  const profileInventory = profileIdExists
    ? `
      (select count(*) from public.community_poll_votes where profile_id is null) as votes_without_profile,
      (
        select count(*)
        from public.community_poll_votes vote
        left join public.profiles profile on profile.id = vote.profile_id
        where vote.profile_id is not null and profile.id is null
      ) as vote_invalid_profile,
      (
        select count(*)
        from (
          select poll_id, profile_id, option_id
          from public.community_poll_votes
          where profile_id is not null
          group by poll_id, profile_id, option_id
          having count(*) > 1
        ) duplicate_group
      ) as canonical_vote_duplicate_groups,
      (
        select count(*)
        from (
          select vote.poll_id, vote.profile_id
          from public.community_poll_votes vote
          join public.community_polls poll on poll.id = vote.poll_id
          where vote.profile_id is not null
            and poll.allow_multiple_choice = false
          group by vote.poll_id, vote.profile_id
          having count(*) > 1
        ) duplicate_group
      ) as single_choice_profile_duplicate_groups`
    : `
      0::bigint as votes_without_profile,
      0::bigint as vote_invalid_profile,
      0::bigint as canonical_vote_duplicate_groups,
      0::bigint as single_choice_profile_duplicate_groups`;

  return `
      (select count(*) from public.community_poll_votes) as votes_total,
      (
        select count(*)
        from public.community_poll_votes vote
        left join public.community_poll_options option
          on option.id = vote.option_id
         and option.poll_id = vote.poll_id
        where option.id is null
      ) as vote_poll_option_mismatch,
      ${profileInventory}`;
}

export function buildPollDataPreflightSql({
  phase,
  profileIdExists,
  votesExists,
}) {
  if (!VALID_PHASES.has(phase)) {
    throw new Error(`Fase invalida: ${phase}`);
  }

  return `
with poll_option_stats as (
  select
    poll_id,
    count(*) as option_count,
    count(position) as positioned_count,
    count(distinct position) as distinct_positions,
    min(position) as min_position,
    max(position) as max_position
  from public.community_poll_options
  group by poll_id
)
select
  (select count(*) from public.posts) as posts_total,
  (select count(*) from public.community_polls) as polls_total,
  (select count(*) from public.community_poll_options) as options_total,
  (
    select count(*)
    from public.posts post
    where pg_catalog.jsonb_typeof(post.content_payload) = 'object'
      and pg_catalog.jsonb_typeof(post.content_payload->'poll') = 'object'
      and (
        post.content_payload->'poll' ? 'question'
        or post.content_payload->'poll' ? 'options'
      )
      and not exists (
        select 1
        from public.community_polls poll
        where poll.post_id = post.id
      )
  ) as json_only_polls,
  (
    select count(*)
    from (
      select post_id
      from public.community_polls
      group by post_id
      having count(*) > 1
    ) duplicate_group
  ) as duplicate_poll_post_groups,
  (
    select count(*)
    from (
      select poll_id, position
      from public.community_poll_options
      group by poll_id, position
      having count(*) > 1
    ) duplicate_group
  ) as duplicate_position_groups,
  (
    select count(*)
    from (
      select poll_id, lower(btrim(text))
      from public.community_poll_options
      group by poll_id, lower(btrim(text))
      having count(*) > 1
    ) duplicate_group
  ) as duplicate_option_text_groups,
  (
    select count(*)
    from public.community_polls poll
    left join poll_option_stats option_stats on option_stats.poll_id = poll.id
    where coalesce(option_stats.option_count, 0) not between 2 and 6
  ) as invalid_option_count_polls,
  (
    select count(*)
    from poll_option_stats
    where positioned_count <> option_count
       or distinct_positions <> option_count
       or min_position <> 0
       or max_position <> option_count - 1
  ) as invalid_option_sequence_polls,
  (
    select count(*)
    from public.community_polls
    where char_length(btrim(question)) not between 8 and 500
  ) as invalid_question_rows,
  (
    select count(*)
    from public.community_poll_options
    where char_length(btrim(text)) not between 1 and 200
  ) as invalid_option_text_rows,
  ${voteInventorySql(votesExists, profileIdExists)};
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
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-poll-preflight-"));
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
      const state = classifySupabaseCliFailure(output);
      throw new Error(
        [
          `${state}: nao foi possivel executar o Poll preflight read-only.`,
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

function numericCount(row, key) {
  const value = Number(row[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function evaluatePollPreflight({ phase, schema, data }) {
  const blockers = [];
  const requiredCoreTables = [
    "posts_exists",
    "profiles_exists",
    "polls_exists",
    "options_exists",
  ];

  for (const key of requiredCoreTables) {
    if (schema[key] !== true) blockers.push(key);
  }

  if (phase === "cutover") {
    if (schema.votes_exists !== true) blockers.push("votes_exists");
    if (schema.profile_id_exists !== true) blockers.push("profile_id_exists");
  }

  const commonBlockers = [
    "json_only_polls",
    "duplicate_poll_post_groups",
    "duplicate_position_groups",
    "vote_poll_option_mismatch",
  ];
  const cutoverBlockers = [
    "duplicate_option_text_groups",
    "invalid_option_count_polls",
    "invalid_option_sequence_polls",
    "invalid_question_rows",
    "invalid_option_text_rows",
    "votes_without_profile",
    "vote_invalid_profile",
    "canonical_vote_duplicate_groups",
    "single_choice_profile_duplicate_groups",
  ];

  for (const key of [
    ...commonBlockers,
    ...(phase === "cutover" ? cutoverBlockers : []),
  ]) {
    if (numericCount(data, key) > 0) blockers.push(key);
  }

  return {
    blockers,
    data,
    phase,
    schema,
    status:
      blockers.length === 0 ? "POLL_PREFLIGHT_PASS" : "POLL_PREFLIGHT_BLOCKED",
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const schema = runSupabaseQuery(buildPollSchemaProbeSql());
  let data = {};

  if (
    schema.posts_exists === true &&
    schema.profiles_exists === true &&
    schema.polls_exists === true &&
    schema.options_exists === true &&
    (schema.votes_exists === true || options.phase === "additive")
  ) {
    data = runSupabaseQuery(
      buildPollDataPreflightSql({
        phase: options.phase,
        profileIdExists: schema.profile_id_exists === true,
        votesExists: schema.votes_exists === true,
      }),
    );
  }

  const result = evaluatePollPreflight({
    data,
    phase: options.phase,
    schema,
  });

  console.log(JSON.stringify(result, null, 2));
  console.log(result.status);
  if (result.status === "POLL_PREFLIGHT_BLOCKED") process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("POLL_PREFLIGHT_BLOCKED");
    process.exit(1);
  });
}
