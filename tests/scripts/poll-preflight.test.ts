import { describe, expect, it } from "vitest";

const pollPreflightModulePath = "../../scripts/poll-preflight.mjs";

type PollPreflightModule = {
  buildPollDataPreflightSql: (options: {
    phase: "additive" | "cutover";
    profileIdExists: boolean;
    votesExists: boolean;
  }) => string;
  buildPollSchemaProbeSql: () => string;
  evaluatePollPreflight: (input: {
    phase: "additive" | "cutover";
    schema: Record<string, boolean>;
    data: Record<string, number>;
  }) => { blockers: string[]; status: string };
  parseArgs: (args: string[]) => { help: boolean; phase: string };
  parseSupabaseQueryJson: (output: string) => Record<string, unknown>;
};

async function loadPollPreflightModule(): Promise<PollPreflightModule> {
  return (await import(pollPreflightModulePath)) as PollPreflightModule;
}

const healthyCoreSchema = {
  options_exists: true,
  polls_exists: true,
  posts_exists: true,
  profiles_exists: true,
  profile_id_exists: true,
  votes_exists: true,
};

describe("Poll read-only preflight", () => {
  it("parses ADDITIVE and CUTOVER explicitly and defaults safely to ADDITIVE", async () => {
    const { parseArgs } = await loadPollPreflightModule();

    expect(parseArgs([])).toEqual({ help: false, phase: "additive" });
    expect(parseArgs(["--phase", "cutover"])).toEqual({
      help: false,
      phase: "cutover",
    });
    expect(() => parseArgs(["--phase", "cleanup"])).toThrow("Fase invalida");
  });

  it("builds only read-only schema and data queries", async () => {
    const { buildPollDataPreflightSql, buildPollSchemaProbeSql } =
      await loadPollPreflightModule();
    const sql = [
      buildPollSchemaProbeSql(),
      buildPollDataPreflightSql({
        phase: "cutover",
        profileIdExists: true,
        votesExists: true,
      }),
    ].join("\n");

    expect(sql).toMatch(/\bselect\b/i);
    expect(sql).not.toMatch(
      /\b(?:insert|update|delete|alter|create|drop|truncate|grant|revoke|call)\b/i,
    );
  });

  it("does not reference an absent Vote table in ADDITIVE data SQL", async () => {
    const { buildPollDataPreflightSql } = await loadPollPreflightModule();
    const sql = buildPollDataPreflightSql({
      phase: "additive",
      profileIdExists: false,
      votesExists: false,
    });

    expect(sql).not.toContain("from public.community_poll_votes");
    expect(sql).toContain("0::bigint as votes_total");
  });

  it("returns POLL_PREFLIGHT_PASS for the explicit zero-data CUTOVER case", async () => {
    const { evaluatePollPreflight } = await loadPollPreflightModule();
    const result = evaluatePollPreflight({
      data: {
        options_total: 0,
        polls_total: 0,
        posts_total: 0,
        votes_total: 0,
      },
      phase: "cutover",
      schema: healthyCoreSchema,
    });

    expect(result).toEqual(
      expect.objectContaining({ blockers: [], status: "POLL_PREFLIGHT_PASS" }),
    );
  });

  it("allows legacy null-profile Votes during ADDITIVE", async () => {
    const { evaluatePollPreflight } = await loadPollPreflightModule();
    const result = evaluatePollPreflight({
      data: { votes_without_profile: 9 },
      phase: "additive",
      schema: { ...healthyCoreSchema, profile_id_exists: false },
    });

    expect(result.status).toBe("POLL_PREFLIGHT_PASS");
  });

  it("returns POLL_PREFLIGHT_BLOCKED for unsafe CUTOVER data", async () => {
    const { evaluatePollPreflight } = await loadPollPreflightModule();
    const result = evaluatePollPreflight({
      data: {
        canonical_vote_duplicate_groups: 1,
        single_choice_profile_duplicate_groups: 2,
        vote_poll_option_mismatch: 3,
        votes_without_profile: 4,
      },
      phase: "cutover",
      schema: healthyCoreSchema,
    });

    expect(result.status).toBe("POLL_PREFLIGHT_BLOCKED");
    expect(result.blockers).toEqual([
      "vote_poll_option_mismatch",
      "votes_without_profile",
      "canonical_vote_duplicate_groups",
      "single_choice_profile_duplicate_groups",
    ]);
  });

  it("extracts the JSON row even when the CLI surrounds it with warnings", async () => {
    const { parseSupabaseQueryJson } = await loadPollPreflightModule();

    expect(
      parseSupabaseQueryJson(
        `warning before\n{"rows":[{"polls_total":0}]}\nwarning after`,
      ),
    ).toEqual({ polls_total: 0 });
  });

  it("extracts the current Supabase CLI root array", async () => {
    const { parseSupabaseQueryJson } = await loadPollPreflightModule();

    expect(
      parseSupabaseQueryJson(
        `warning before\n[{"polls_total":0}]\nwarning after`,
      ),
    ).toEqual({ polls_total: 0 });
  });
});
