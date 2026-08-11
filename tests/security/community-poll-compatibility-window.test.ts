import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const additivePath = resolve(
  root,
  "supabase/migrations/20260810151941_reconcile_community_poll_additive_compatibility.sql",
);
const cutoverPath = resolve(
  root,
  "docs/09-reference/migrations-pending/20260810152013_finalize_community_poll_cutover.sql",
);
const retiredMonolithPath = resolve(
  root,
  "supabase/migrations/20260810120000_create_authoritative_community_poll_commands.sql",
);
const additive = readFileSync(additivePath, "utf8");
const cutover = readFileSync(cutoverPath, "utf8");

describe("Community Poll compatibility window", () => {
  it("1. replaces the unapplied monolith with explicit ADDITIVE and CUTOVER phases", () => {
    expect(existsSync(retiredMonolithPath)).toBe(false);
    expect(additive).toContain("ADDITIVE compatibility window");
    expect(cutover).toContain("CUTOVER for Community Poll");
  });

  it("2. accepts the known legacy Vote schema after a fail-closed contract preflight", () => {
    expect(additive).toContain("legacy community_poll_votes columns differ");
    expect(additive).toContain("legacy community_poll_votes foreign keys differ");
    expect(additive).toContain("UNIQUE (poll_id, user_id)");
  });

  it("3. creates the Vote table only when the replay state does not contain it", () => {
    expect(additive).toMatch(
      /IF to_regclass\('public\.community_poll_votes'\) IS NULL THEN[\s\S]*CREATE TABLE public\.community_poll_votes/,
    );
    expect(additive).toContain("Reconciliation boundary, not a claim of historical provenance");
  });

  it("4. reconciles an existing legacy table without making profile_id mandatory", () => {
    expect(additive).toMatch(
      /ALTER TABLE public\.community_poll_votes[\s\S]*ADD COLUMN IF NOT EXISTS profile_id UUID/,
    );
    expect(additive).toContain("profile_id must be a nullable UUID during compatibility");
    expect(additive).toContain("DROP CONSTRAINT IF EXISTS unique_poll_vote");
  });

  it("5. exposes canonical RPC DTOs while retaining legacy Vote fallback", () => {
    expect(additive).toContain("private.build_community_poll_dto");
    expect(additive).toContain("own_vote.profile_id = p_profile_id");
    expect(additive).toContain("own_vote.profile_id IS NULL");
    expect(additive).toContain("own_vote.user_id = p_user_id");
  });

  it("6. synchronizes normalized Options into the legacy Poll JSON projection", () => {
    expect(additive).toContain("private.refresh_community_poll_legacy_snapshot");
    expect(additive).toMatch(
      /jsonb_build_object\([\s\S]*'id', option\.id,[\s\S]*'text', option\.text,[\s\S]*'votes', option\.votes,[\s\S]*'position', option\.position/,
    );
    expect(additive).toContain("community_poll_options_sync_snapshot_on_insert_delete");
    expect(additive).toContain("community_polls_derive_legacy_snapshot_on_update");
    expect(additive).toContain(
      "database replaces the\n-- supplied value with the projection derived from normalized Options",
    );
  });

  it("7. derives legacy Option counters from canonical Vote rows", () => {
    expect(additive).toContain("community_poll_votes_sync_legacy_on_insert_delete");
    expect(additive).toMatch(
      /UPDATE public\.community_poll_options option[\s\S]*SELECT count\(\*\)::INTEGER[\s\S]*vote\.option_id = option\.id/,
    );
  });

  it("8. preserves old authenticated table contracts throughout ADDITIVE", () => {
    expect(additive).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*public\.community_polls TO authenticated/,
    );
    expect(additive).toMatch(
      /GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*public\.community_poll_options TO authenticated/,
    );
    expect(additive).toMatch(
      /GRANT INSERT \(id, poll_id, user_id, option_id, created_at\)[\s\S]*TO authenticated/,
    );
    expect(additive).toContain('CREATE POLICY "Authors manage poll options"');
  });

  it("9. prevents legacy clients from supplying canonical profile ownership", () => {
    expect(additive).toContain(
      "REVOKE ALL ON TABLE public.community_poll_votes FROM anon",
    );
    expect(additive).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.community_poll_votes FROM authenticated",
    );
    expect(additive).not.toMatch(/GRANT (?:INSERT|UPDATE) \([^)]*profile_id/);
  });

  it("10. supports the new frontend through least-privilege RPC grants", () => {
    expect(additive).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.create_post_with_poll\(JSONB\)[\s\S]*TO authenticated/,
    );
    expect(additive).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.cast_community_poll_vote\(UUID, UUID, UUID\)[\s\S]*TO authenticated/,
    );
    expect(additive).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_community_poll_for_post\(UUID\)[\s\S]*TO anon, authenticated/,
    );
  });

  it("11. performs destructive privilege cutover only in the later phase", () => {
    expect(additive).not.toContain(
      "REVOKE ALL ON TABLE public.community_polls FROM PUBLIC, anon, authenticated",
    );
    expect(cutover).toContain(
      "REVOKE ALL ON TABLE public.community_polls FROM PUBLIC, anon, authenticated",
    );
    expect(cutover).toContain(
      "REVOKE ALL ON TABLE public.community_poll_votes FROM PUBLIC, anon, authenticated",
    );
  });

  it("12. aborts CUTOVER for unresolved profiles and canonical duplicates", () => {
    expect(cutover).toMatch(
      /WHERE profile_id IS NULL[\s\S]*POLL_CUTOVER_BLOCKED: community_poll_votes\.profile_id still contains NULL/,
    );
    expect(cutover).toContain("duplicate canonical profile Option Votes");
    expect(cutover).toContain("single-choice Poll has multiple Votes for one Profile");
  });

  it("13. aborts cross-Poll Vote references and validates both foreign keys", () => {
    expect(cutover).toContain("a Vote references an Option from another Poll");
    expect(cutover).toContain(
      "VALIDATE CONSTRAINT community_poll_votes_profile_id_fkey",
    );
    expect(cutover).toContain(
      "VALIDATE CONSTRAINT community_poll_votes_poll_option_fkey",
    );
  });

  it("14. finalizes canonical constraints without performing CLEANUP", () => {
    expect(cutover).toContain("ALTER COLUMN profile_id SET NOT NULL");
    expect(cutover).toContain("community_poll_votes_poll_profile_option_key");
    expect(cutover).toContain("community_polls_question_not_blank");
    expect(cutover).toContain("community_poll_options_text_not_blank");
    expect(cutover).not.toMatch(/DROP COLUMN (?:options|votes|user_id)/);
    expect(cutover).not.toMatch(/DROP FUNCTION private\.refresh_community_poll_legacy_snapshot/);
  });
});
