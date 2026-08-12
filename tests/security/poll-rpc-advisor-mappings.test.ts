import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validatePollRpcAdvisorMappings } from "../../scripts/security/validate-poll-rpc-advisor-mappings.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const mappingPath = join(
  repoRoot,
  "docs/09-reference/governance/security/POLL_RPC_ADVISOR_MAPPINGS.json",
);
const canonical = JSON.parse(readFileSync(mappingPath, "utf8"));
const validNow = new Date("2026-08-12T12:00:00.000Z");

describe("individual Poll Advisor mappings", () => {
  it("certifies exact fingerprints, grants, policy and non-generic exceptions", () => {
    expect(validatePollRpcAdvisorMappings(canonical, validNow)).toEqual([]);
  });

  it("rejects a changed Vote fingerprint", () => {
    const register = structuredClone(canonical);
    register.mappings.find(
      (mapping: { id: string }) => mapping.id === "POLL-VOTE-AUTH-20260812",
    ).definitionMd5 = "changed";
    expect(validatePollRpcAdvisorMappings(register, validNow)).toContain(
      "MAPPING_DEFINITIONMD5_INVALID:POLL-VOTE-AUTH-20260812",
    );
  });

  it("rejects PUBLIC or anonymous mutation grants", () => {
    const register = structuredClone(canonical);
    const vote = register.mappings.find(
      (mapping: { id: string }) => mapping.id === "POLL-VOTE-AUTH-20260812",
    );
    vote.grants.public = true;
    vote.grants.anon = true;
    expect(validatePollRpcAdvisorMappings(register, validNow)).toEqual(
      expect.arrayContaining([
        "MAPPING_GRANTS_INVALID:POLL-VOTE-AUTH-20260812",
      ]),
    );
  });

  it("rejects a missing territorial policy, generic mapping and expired register", () => {
    const register = structuredClone(canonical);
    const vote = register.mappings.find(
      (mapping: { id: string }) => mapping.id === "POLL-VOTE-AUTH-20260812",
    );
    delete vote.policy;
    vote.exceptionId = "EXC-2026-07-15-POSTGREST-SECURITY-DEFINER-COMMANDS";
    register.validUntil = "2026-08-11";
    const issues = validatePollRpcAdvisorMappings(register, validNow);
    expect(issues).toEqual(
      expect.arrayContaining([
        "POLL_VOTE_TERRITORIAL_POLICY_MISSING",
        "MAPPING_GENERIC_EXCEPTION_FORBIDDEN:POLL-VOTE-AUTH-20260812",
        "MAPPING_REGISTER_EXPIRED",
      ]),
    );
  });
});
