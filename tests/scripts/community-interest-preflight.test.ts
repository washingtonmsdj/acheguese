import { describe, expect, it } from "vitest";

import {
  REQUIRED_CUTOVER_EVIDENCE,
  buildCommunityInterestSchemaProbeSql,
  evaluateCommunityInterestPreflight,
  parseArgs,
  parseSupabaseQueryJson,
} from "../../scripts/community-interest-preflight.mjs";

const dependencies = {
  auth_users_exists: true,
  private_is_admin_exists: true,
};

const additiveAbsentSchema = {
  ...dependencies,
  table_exists: false,
  role_type_exists: false,
  role_labels_compatible: false,
};

const cutoverSchema = {
  ...dependencies,
  broker_insert_granted: true,
  incompatible_column_count: 0,
  legacy_insert_columns_granted: true,
  legacy_policy_exists: true,
  missing_required_column_count: 0,
  rls_enabled: true,
  role_labels_compatible: true,
  role_type_exists: true,
  table_exists: true,
  unexpected_column_count: 0,
  unexpected_grant_count: 0,
  unexpected_policy_count: 0,
};

describe("Community Interest preflight CLI", () => {
  it("parses additive and explicit manual CUTOVER evidence", () => {
    expect(parseArgs(["--phase", "additive"])).toMatchObject({
      help: false,
      phase: "additive",
    });
    const cutover = parseArgs(
      REQUIRED_CUTOVER_EVIDENCE.flatMap((key) => ["--evidence", key]).concat([
        "--phase",
        "cutover",
      ]),
    );
    expect(cutover.phase).toBe("cutover");
    expect([...cutover.evidence]).toEqual(REQUIRED_CUTOVER_EVIDENCE);
  });

  it("rejects unknown evidence and evidence on ADDITIVE", () => {
    expect(() => parseArgs(["--evidence", "UNKNOWN"])).toThrow(
      "Evidencia operacional desconhecida",
    );
    expect(() =>
      parseArgs([
        "--phase",
        "additive",
        "--evidence",
        "EDGE_FUNCTION_DEPLOYED",
      ]),
    ).toThrow("somente ao CUTOVER");
  });

  it("builds a single read-only schema query", () => {
    const sql = buildCommunityInterestSchemaProbeSql();
    expect(sql).toMatch(/^with expected_columns/i);
    expect(sql).toContain("community_interest_registrations");
    expect(sql).toContain("community_interest_legacy_insert");
    expect(sql).not.toMatch(
      /(?:^|;)\s*(?:insert\s+into|update\s+public|delete\s+from|alter\s+table|drop\s+|grant\s+|revoke\s+|create\s+table)/im,
    );
  });

  it("parses the Supabase CLI JSON envelope", () => {
    expect(
      parseSupabaseQueryJson(
        `notice before json\n${JSON.stringify({ rows: [{ table_exists: false }] })}`,
      ),
    ).toEqual({ table_exists: false });
  });

  it("parses the current Supabase CLI root array", () => {
    expect(
      parseSupabaseQueryJson(
        `notice before json\n${JSON.stringify([{ table_exists: false }])}`,
      ),
    ).toEqual({ table_exists: false });
  });
});

describe("Community Interest ADDITIVE preflight", () => {
  it("passes when the table and enum are absent and dependencies exist", () => {
    const result = evaluateCommunityInterestPreflight({
      evidence: new Set<string>(),
      phase: "additive",
      schema: additiveAbsentSchema,
    });
    expect(result.status).toBe("COMMUNITY_INTEREST_ADDITIVE_PREFLIGHT_PASS");
    expect(result.blockers).toEqual([]);
  });

  it("blocks an incompatible enum or unexpected existing schema", () => {
    const incompatible = evaluateCommunityInterestPreflight({
      evidence: new Set<string>(),
      phase: "additive",
      schema: {
        ...cutoverSchema,
        role_labels_compatible: false,
        unexpected_column_count: 1,
      },
    });
    expect(incompatible.status).toBe(
      "COMMUNITY_INTEREST_ADDITIVE_PREFLIGHT_BLOCKED",
    );
    expect(incompatible.blockers).toContain("role_labels_compatible");
    expect(incompatible.blockers).toContain("unexpected_column_count");
  });
});

describe("Community Interest CUTOVER preflight", () => {
  it("fails closed when operational evidence is missing", () => {
    const result = evaluateCommunityInterestPreflight({
      evidence: new Set<string>(),
      phase: "cutover",
      schema: cutoverSchema,
    });
    expect(result.status).toBe("COMMUNITY_INTEREST_CUTOVER_PREFLIGHT_BLOCKED");
    for (const key of REQUIRED_CUTOVER_EVIDENCE) {
      expect(result.blockers).toContain(`MANUAL_OPERATIONAL_EVIDENCE:${key}`);
    }
  });

  it("passes only with expected ADDITIVE state and all manual evidence", () => {
    const result = evaluateCommunityInterestPreflight({
      evidence: new Set(REQUIRED_CUTOVER_EVIDENCE),
      phase: "cutover",
      schema: cutoverSchema,
    });
    expect(result.status).toBe("COMMUNITY_INTEREST_CUTOVER_PREFLIGHT_PASS");
    expect(result.blockers).toEqual([]);
    expect(result.evidenceSource).toBe("MANUAL_OPERATIONAL_EVIDENCE");
  });
});
