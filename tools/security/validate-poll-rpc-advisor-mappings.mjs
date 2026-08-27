import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const MAPPINGS_PATH = join(
  ROOT,
  "docs/09-reference/governance/security/POLL_RPC_ADVISOR_MAPPINGS.json",
);

const EXPECTED = new Map([
  [
    "POLL-GET-ANON-20260812",
    {
      role: "anon",
      signature: "get_community_poll_for_post(p_post_id uuid)",
      advisorCacheKey:
        "anon_security_definer_function_executable_public_get_community_poll_for_post_p_post_id uuid",
      exceptionId: "EXC-2026-08-12-POLL-GET-ANON-SECURITY-DEFINER",
      definitionMd5: "373bef417572dfebb6cd84bbe26cc93b",
      public: false,
      anon: true,
      authenticated: true,
    },
  ],
  [
    "POLL-GET-AUTH-20260812",
    {
      role: "authenticated",
      signature: "get_community_poll_for_post(p_post_id uuid)",
      advisorCacheKey:
        "authenticated_security_definer_function_executable_public_get_community_poll_for_post_p_post_id uuid",
      exceptionId: "EXC-2026-08-12-POLL-GET-AUTH-SECURITY-DEFINER",
      definitionMd5: "373bef417572dfebb6cd84bbe26cc93b",
      public: false,
      anon: true,
      authenticated: true,
    },
  ],
  [
    "POLL-CREATE-AUTH-20260812",
    {
      role: "authenticated",
      signature: "create_post_with_poll(payload jsonb)",
      advisorCacheKey:
        "authenticated_security_definer_function_executable_public_create_post_with_poll_payload jsonb",
      exceptionId: "EXC-2026-08-12-POLL-CREATE-AUTH-SECURITY-DEFINER",
      definitionMd5: "220205a5d9c6d953ae8bee1076629b51",
      public: false,
      anon: false,
      authenticated: true,
    },
  ],
  [
    "POLL-VOTE-AUTH-20260812",
    {
      role: "authenticated",
      signature:
        "cast_community_poll_vote(p_poll_id uuid, p_option_id uuid, p_profile_id uuid)",
      advisorCacheKey:
        "authenticated_security_definer_function_executable_public_cast_community_poll_vote_p_poll_id uuid, p_option_id uuid, p_profile_id uuid",
      exceptionId: "EXC-2026-08-12-POLL-VOTE-AUTH-SECURITY-DEFINER",
      definitionMd5: "e460952f1cdcf85235c6c7779ab841e7",
      public: false,
      anon: false,
      authenticated: true,
    },
  ],
]);

export function validatePollRpcAdvisorMappings(register, now = new Date()) {
  const issues = [];
  if (register?.schemaVersion !== "poll-rpc-advisor-mappings/v1") {
    issues.push("MAPPING_SCHEMA_INVALID");
  }
  if (register?.owner?.name !== "washingto silva") {
    issues.push("MAPPING_OWNER_INVALID");
  }
  if (register?.owner?.github !== "washingtonmsdj") {
    issues.push("MAPPING_OWNER_GITHUB_INVALID");
  }
  if (!Array.isArray(register?.mappings) || register.mappings.length !== 4) {
    issues.push("MAPPING_COUNT_INVALID");
    return issues;
  }

  const ids = new Set(register.mappings.map((mapping) => mapping.id));
  if (ids.size !== register.mappings.length) issues.push("MAPPING_IDS_DUPLICATED");

  const validUntil = Date.parse(register.validUntil ?? "");
  if (!Number.isFinite(validUntil) || validUntil <= now.getTime()) {
    issues.push("MAPPING_REGISTER_EXPIRED");
  }

  for (const [id, expected] of EXPECTED) {
    const mapping = register.mappings.find((item) => item.id === id);
    if (!mapping) {
      issues.push(`MAPPING_MISSING:${id}`);
      continue;
    }
    for (const field of [
      "role",
      "signature",
      "advisorCacheKey",
      "exceptionId",
      "definitionMd5",
    ]) {
      if (mapping[field] !== expected[field]) {
        issues.push(`MAPPING_${field.toUpperCase()}_INVALID:${id}`);
      }
    }
    if (mapping.owner !== "postgres") issues.push(`MAPPING_OWNER_INVALID:${id}`);
    if (mapping.securityMode !== "SECURITY DEFINER")
      issues.push(`MAPPING_SECURITY_MODE_INVALID:${id}`);
    if (mapping.searchPath !== 'search_path=""')
      issues.push(`MAPPING_SEARCH_PATH_INVALID:${id}`);
    if (
      mapping.grants?.public !== expected.public ||
      mapping.grants?.anon !== expected.anon ||
      mapping.grants?.authenticated !== expected.authenticated ||
      mapping.grants?.postgres !== true
    ) {
      issues.push(`MAPPING_GRANTS_INVALID:${id}`);
    }
    if (mapping.exceptionId.includes("POSTGREST-SECURITY-DEFINER-COMMANDS")) {
      issues.push(`MAPPING_GENERIC_EXCEPTION_FORBIDDEN:${id}`);
    }
    if (!Array.isArray(mapping.evidence) || mapping.evidence.length === 0)
      issues.push(`MAPPING_EVIDENCE_MISSING:${id}`);
    if (!Array.isArray(mapping.triggers) || mapping.triggers.length === 0)
      issues.push(`MAPPING_TRIGGERS_MISSING:${id}`);
  }

  const vote = register.mappings.find((item) => item.id === "POLL-VOTE-AUTH-20260812");
  if (vote?.policy !== "POLL_VOTE_TERRITORY_POLICY=TERRITORIAL_ENGAGEMENT_MEMBER_ALLOWED") {
    issues.push("POLL_VOTE_TERRITORIAL_POLICY_MISSING");
  }

  return issues;
}

function main() {
  const register = JSON.parse(readFileSync(MAPPINGS_PATH, "utf8"));
  const issues = validatePollRpcAdvisorMappings(register);
  if (issues.length > 0) {
    console.error("POLL_RPC_ADVISOR_MAPPINGS_BLOCKED");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log("POLL_RPC_ADVISOR_MAPPINGS_PASS");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}
