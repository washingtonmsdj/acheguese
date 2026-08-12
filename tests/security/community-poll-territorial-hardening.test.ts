import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260812061500_harden_community_poll_vote_territorial_authorization.sql",
  ),
  "utf8",
);
const policy = readFileSync(
  resolve(root, "src/core/community/access/CommunityAccessPolicy.ts"),
  "utf8",
);

const voteFunction = migration.slice(
  migration.indexOf(
    "CREATE OR REPLACE FUNCTION public.cast_community_poll_vote",
  ),
);
const voteDefinition = voteFunction.slice(
  0,
  voteFunction.indexOf(
    "REVOKE ALL ON FUNCTION public.cast_community_poll_vote",
  ),
);

describe("Community Poll territorial vote hardening", () => {
  it("uses the persisted resource context and no client territory claims", () => {
    expect(migration).toContain("private.can_vote_community_poll");
    expect(migration).toContain("public.posts post");
    expect(migration).toContain("post.location_id");
    expect(migration).toContain("public.module_rollouts");
    expect(migration).not.toContain("p_territory_id");
    expect(migration).not.toContain("p_community_id");
    expect(migration).not.toContain("p_location_id");
  });

  it("maps residence and active Community membership without requiring verification", () => {
    expect(migration).toContain("public.user_residences residence");
    expect(migration).toContain("public.community_memberships membership");
    expect(migration).toContain("membership.status = 'active'");
    expect(migration).toContain("community.status::TEXT = 'active'");
    expect(migration).toContain("residence.location_id = context.location_id");
    expect(migration).toContain("TERRITORIAL_ENGAGEMENT_MEMBER_ALLOWED");
    expect(migration).toContain(
      "Residence verification is intentionally not required",
    );
  });

  it("resolves Community rollout through the canonical location hierarchy", () => {
    expect(migration).toContain("WITH RECURSIVE poll_context");
    expect(migration).toContain("parent.id");
    expect(migration).toContain("rollout.module_key = 'community'");
    expect(migration).toContain("rollout.status = 'active'");
    expect(migration).toContain("POLL_VOTE_ROLLOUT_AUTHORITY_UNRESOLVED");
  });

  it("keeps VOTE_POLL independent from react", () => {
    expect(policy).toContain('"vote_poll"');
    expect(policy).toContain("POLL_VOTE_TERRITORY_POLICY");
    expect(migration).toContain("TERRITORIAL_ENGAGEMENT_MEMBER_ALLOWED");
    expect(migration.toLowerCase()).not.toContain("can_react");
  });

  it("proves authorization before expiry and the only vote write", () => {
    const optionCheck = voteFunction.indexOf("poll_option_not_found");
    const authorizationCheck = voteFunction.indexOf(
      "private.can_vote_community_poll",
    );
    const expiryCheck = voteFunction.indexOf("poll_expired");
    const insert = voteFunction.indexOf(
      "INSERT INTO public.community_poll_votes",
    );

    expect(optionCheck).toBeGreaterThan(-1);
    expect(authorizationCheck).toBeGreaterThan(optionCheck);
    expect(expiryCheck).toBeGreaterThan(authorizationCheck);
    expect(insert).toBeGreaterThan(expiryCheck);
    expect(
      voteFunction.match(/INSERT INTO public\.community_poll_votes/g),
    ).toHaveLength(1);
  });

  it("keeps the public RPC contract and least-privilege grants", () => {
    expect(voteFunction).toContain(
      "cast_community_poll_vote(\n  p_poll_id UUID,\n  p_option_id UUID,\n  p_profile_id UUID",
    );
    expect(voteDefinition).toContain("SECURITY DEFINER");
    expect(voteDefinition).toContain("SET search_path = ''");
    expect(voteFunction).toContain(
      "REVOKE ALL ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)\n  FROM PUBLIC, anon, authenticated, service_role",
    );
    expect(voteFunction).toContain(
      "GRANT EXECUTE ON FUNCTION public.cast_community_poll_vote(UUID, UUID, UUID)\n  TO authenticated",
    );
    expect(voteDefinition).not.toContain("GRANT EXECUTE");
  });
});
