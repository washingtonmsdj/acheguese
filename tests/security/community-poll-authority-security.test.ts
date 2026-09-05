import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const additiveMigration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260810151941_reconcile_community_poll_additive_compatibility.sql",
  ),
  "utf8",
);
const cutoverMigration = readFileSync(
  resolve(
    root,
    "docs/09-reference/migrations-pending/20260810152013_finalize_community_poll_cutover.sql",
  ),
  "utf8",
);
const composer = readFileSync(
  resolve(root, "src/core/community-feed/components/CreatePostModal.tsx"),
  "utf8",
);
const pollMutations = readFileSync(
  resolve(root, "src/core/posts/services/polls.mutations.ts"),
  "utf8",
);
const pollQueries = readFileSync(
  resolve(root, "src/core/posts/services/polls.queries.ts"),
  "utf8",
);
const postRuntime = readFileSync(
  resolve(root, "src/core/posts/services/post.service.runtime.ts"),
  "utf8",
);
const postInteractions = readFileSync(
  resolve(root, "src/core/posts/services/posts.user.queries.ts"),
  "utf8",
);

describe("Community Poll authoritative contract", () => {
  it("1. keeps normal Post creation on its existing path", () => {
    expect(postRuntime).toContain("async createPostWithImages(");
    expect(postRuntime).toContain("return this.createPost({ ...data, images: references })");
  });

  it("2. creates the Post in the transactional Poll command", () => {
    expect(additiveMigration).toMatch(/FUNCTION public\.create_post_with_poll[\s\S]*INSERT INTO public\.posts/);
  });

  it("3. creates the corresponding Poll", () => {
    expect(additiveMigration).toMatch(/FUNCTION public\.create_post_with_poll[\s\S]*INSERT INTO public\.community_polls/);
  });

  it("4. creates every supplied option with ordinality", () => {
    expect(additiveMigration).toContain("INSERT INTO public.community_poll_options");
    expect(additiveMigration).toContain("WITH ORDINALITY");
  });

  it("5. leaves no browser-side partial-write sequence", () => {
    expect(composer).toContain("createPollPostWithImages");
    expect(composer).not.toContain("postService.createPoll(");
    expect(pollMutations).not.toContain('.from("community_polls").insert');
  });

  it("6. refuses malformed command payloads", () => {
    expect(additiveMigration).toContain("invalid_poll_post_payload");
    expect(additiveMigration).toContain("invalid_poll_options");
  });

  it("7. refuses fewer than two options", () => {
    expect(additiveMigration).toContain("v_option_count NOT BETWEEN 2 AND 6");
  });

  it("8. refuses case-insensitive duplicate options", () => {
    expect(additiveMigration).toContain("duplicate_poll_options");
    expect(additiveMigration).toContain(
      "GROUP BY lower(btrim(option_entry.value #>> '{}'))",
    );
  });

  it("9. inserts the first active-profile vote", () => {
    expect(additiveMigration).toMatch(/FUNCTION public\.cast_community_poll_vote[\s\S]*INSERT INTO public\.community_poll_votes/);
  });

  it("10. makes same-option retries idempotent and rejects a second single-choice option", () => {
    expect(additiveMigration).toMatch(/option_id = p_option_id[\s\S]*RETURN private\.build_community_poll_dto/);
    expect(additiveMigration).toContain("poll_already_voted");
  });

  it("11. has one server vote insert and database-owned legacy projection updates", () => {
    const voteFunction = additiveMigration.slice(
      additiveMigration.indexOf("FUNCTION public.cast_community_poll_vote"),
    );
    expect(voteFunction.match(/INSERT INTO public\.community_poll_votes/g)).toHaveLength(1);
    expect(additiveMigration).toContain("private.sync_community_poll_vote_legacy_projection");
    expect(additiveMigration).toMatch(/UPDATE public\.community_poll_options option[\s\S]*count\(\*\)::INTEGER/);
    expect(additiveMigration).toContain("private.refresh_community_poll_legacy_snapshot");
  });

  it("12. serializes concurrent votes and enforces retry uniqueness", () => {
    expect(additiveMigration).toContain("FOR UPDATE;");
    expect(additiveMigration).toContain("uq_community_poll_votes_profile_option");
    expect(additiveMigration).toContain("ON CONFLICT (poll_id, profile_id, option_id)");
  });

  it("13. refuses an option from another Poll", () => {
    expect(additiveMigration).toMatch(/option\.id = p_option_id[\s\S]*option\.poll_id = p_poll_id/);
    expect(additiveMigration).toContain("poll_option_not_found");
  });

  it("14. refuses a missing Poll", () => {
    expect(additiveMigration).toContain("poll_not_found");
  });

  it("15. refuses voting on an invisible Post", () => {
    expect(additiveMigration).toContain("poll_not_accessible");
    expect(additiveMigration).toMatch(/post\.is_published = TRUE[\s\S]*post\.is_hidden = FALSE[\s\S]*post\.is_removed = FALSE/);
  });

  it("16. refuses acting as a profile not owned and active", () => {
    expect(additiveMigration).toContain("private.auth_owns_active_profile(p_profile_id)");
    expect(additiveMigration).toContain("active_profile_required");
  });

  it("17. derives option and total counts from vote rows", () => {
    expect(additiveMigration).toMatch(/'votes',[\s\S]*count\(\*\)[\s\S]*vote_count\.option_id/);
    expect(additiveMigration).toMatch(/'total_votes',[\s\S]*count\(\*\)[\s\S]*vote_count\.poll_id/);
  });

  it("18. returns the current active-profile vote", () => {
    expect(additiveMigration).toContain("'user_voted'");
    expect(additiveMigration).toContain("'user_vote_option_id'");
    expect(additiveMigration).toContain("own_vote.profile_id = p_profile_id");
  });

  it("19. returns a zero-vote Poll without relying on legacy counters", () => {
    expect(additiveMigration).toContain("'[]'::jsonb");
    expect(pollQueries).toContain("total_votes: requiredNumber");
    expect(pollQueries).not.toContain("community_poll_options(*)");
  });

  it("20. supports and deterministically orders multiple options", () => {
    expect(additiveMigration).toContain("jsonb_agg");
    expect(additiveMigration).toContain("ORDER BY option.position, option.id");
  });

  it("21. reads Poll only once in the Post detail path", () => {
    expect(postInteractions).not.toContain("getPollByPostId");
    expect(postInteractions).not.toContain("community_poll_votes");
  });

  it("22. preserves legacy browser writes only during ADDITIVE and revokes them at CUTOVER", () => {
    expect(additiveMigration).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*public\.community_polls TO authenticated/);
    expect(additiveMigration).toMatch(/GRANT INSERT \(id, poll_id, user_id, option_id, created_at\)/);
    expect(additiveMigration).not.toMatch(/GRANT INSERT \([^)]*profile_id/);
    expect(cutoverMigration).toContain("REVOKE ALL ON TABLE public.community_polls FROM PUBLIC, anon, authenticated");
    expect(cutoverMigration).toContain("REVOKE ALL ON TABLE public.community_poll_votes FROM PUBLIC, anon, authenticated");
  });

  it("23. restricts authenticated table reads to visible Posts", () => {
    expect(cutoverMigration).toContain("community_polls_visible_post_read");
    expect(cutoverMigration).toContain("community_poll_options_visible_post_read");
    const publicPollPolicy = cutoverMigration.slice(
      cutoverMigration.indexOf("CREATE POLICY community_polls_visible_post_read"),
      cutoverMigration.indexOf("CREATE POLICY community_polls_owner_or_admin_read"),
    );
    const publicOptionPolicy = cutoverMigration.slice(
      cutoverMigration.indexOf("CREATE POLICY community_poll_options_visible_post_read"),
      cutoverMigration.indexOf(
        "CREATE POLICY community_poll_options_owner_or_admin_read",
      ),
    );
    expect(publicPollPolicy).not.toContain("private.");
    expect(publicOptionPolicy).not.toContain("private.");
    expect(cutoverMigration).not.toContain("WITH CHECK (true)");
  });

  it("24. hardens privileged commands with auth guards and an empty search_path", () => {
    expect(additiveMigration.match(/SECURITY DEFINER/g)?.length).toBeGreaterThanOrEqual(4);
    expect(additiveMigration.match(/SET search_path = ''/g)?.length).toBeGreaterThanOrEqual(4);
    expect(additiveMigration).toContain("v_user_id UUID := (SELECT auth.uid())");
  });

  it("25. grants mutation RPCs only to authenticated", () => {
    expect(additiveMigration).toMatch(/GRANT EXECUTE ON FUNCTION public\.create_post_with_poll\(JSONB\)[\s\S]*TO authenticated;/);
    expect(additiveMigration).toMatch(/GRANT EXECUTE ON FUNCTION public\.cast_community_poll_vote\(UUID, UUID, UUID\)[\s\S]*TO authenticated;/);
  });

  it("26. keeps legacy JSON detectable while persisting only a stable Poll reference", () => {
    expect(additiveMigration).toContain("POLL_ADDITIVE_BLOCKED");
    expect(cutoverMigration).toContain("POLL_CUTOVER_BLOCKED");
    expect(additiveMigration).toContain("COALESCE(payload->'content_payload', '{}'::jsonb) - 'poll'");
    expect(additiveMigration).toContain("jsonb_build_object('poll_id', v_poll_id)");
  });

  it("27. keeps the anonymous poll-read definer fail-closed to visible Posts", () => {
    const pollReadFunction = additiveMigration.slice(
      additiveMigration.indexOf("FUNCTION public.get_community_poll_for_post"),
      additiveMigration.indexOf("FUNCTION public.cast_community_poll_vote"),
    );

    expect(pollReadFunction).toContain("SECURITY DEFINER");
    expect(pollReadFunction).toContain("SET search_path = ''");
    expect(pollReadFunction).toMatch(
      /post\.is_published = TRUE[\s\S]*post\.is_hidden = FALSE[\s\S]*post\.is_removed = FALSE/,
    );
    expect(pollReadFunction).toContain("private.auth_owns_active_profile(post.author_profile_id)");
    expect(pollReadFunction).toContain("private.is_admin_user(v_user_id)");
    expect(additiveMigration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_community_poll_for_post\(UUID\)[\s\S]*TO anon, authenticated;/,
    );
    const createGrant = additiveMigration.match(
      /GRANT EXECUTE ON FUNCTION public\.create_post_with_poll\(JSONB\)\s+TO\s+([^;]+);/i,
    )?.[1]?.trim();
    const voteGrant = additiveMigration.match(
      /GRANT EXECUTE ON FUNCTION public\.cast_community_poll_vote\(UUID, UUID, UUID\)\s+TO\s+([^;]+);/i,
    )?.[1]?.trim();

    expect(createGrant).toBe("authenticated");
    expect(voteGrant).toBe("authenticated");
  });
});
