import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Social engagement ownership", () => {
  it("removes the legacy interaction facade and its unused community hooks", () => {
    const removedPaths = [
      "src/core/interaction/index.ts",
      "src/core/interaction/services/InteractionService.ts",
      "src/core/social/services/SocialInteractionsService.ts",
      "src/core/social/services/BlockService.ts",
      "src/core/community/hooks/posts/useLikePost.ts",
      "src/core/community/hooks/posts/useSavePost.ts",
      "src/core/community/hooks/useUnlikePost.ts",
      "src/core/community/hooks/useUnsavePost.ts",
      "src/core/community/hooks/useAddComment.ts",
      "src/core/community/hooks/useDeleteComment.ts",
    ];

    removedPaths.forEach((path) => {
      expect(existsSync(resolve(root, path)), path).toBe(false);
    });
  });

  it("keeps post, comment, group and share writes in explicit owners", () => {
    const postEngagement = read(
      "src/core/engagement/services/PostEngagementService.ts",
    );
    const comments = read("src/core/comments/services/comments.mutations.ts");
    const groups = read(
      "src/core/social/services/SocialGroupInteractionsService.ts",
    );
    const posts = read("src/core/posts/services/posts.mutations.ts");

    expect(postEngagement).toContain('"post_likes_new"');
    expect(postEngagement).toContain('"saved_posts_new"');
    expect(postEngagement).not.toMatch(/comment_likes|group_members_new/);
    expect(comments).toContain('const LIKES_TABLE = "comment_likes"');
    expect(groups).toContain('"group_members_new"');
    expect(posts).toContain('"post_share_events"');
  });

  it("derives every social actor from the required active profile", () => {
    const postEngagement = read(
      "src/core/engagement/services/PostEngagementService.ts",
    );
    const comments = read("src/core/comments/services/comments.mutations.ts");
    const posts = read("src/core/posts/services/posts.mutations.ts");
    const postRuntime = read(
      "src/core/posts/services/post.service.runtime.ts",
    );

    expect(postEngagement).toContain(
      "profileService.getRequiredActiveProfile()",
    );
    expect(comments).toContain("profileService.getRequiredActiveProfile()");
    expect(comments).not.toMatch(/authorProfileId|likerProfileId/);
    expect(posts).toContain("profileService.getRequiredActiveProfile()");
    expect(posts).toContain("sharer_profile_id: activeProfile.id");
    expect(postRuntime).toMatch(/recordPostShare\(postId: string\)/);
    expect(postRuntime).not.toMatch(/recordPostShare\([^)]*profile/i);
  });

  it("allowlists generic saved-entity adapters without exporting storage config", () => {
    const savedEntities = read(
      "src/core/engagement/services/ProfileSavedEntityService.ts",
    );
    const engagementIndex = read("src/core/engagement/index.ts");
    const serviceIndex = read("src/core/engagement/services/index.ts");

    expect(savedEntities).toContain("const SAVED_ENTITY_CONFIGS");
    expect(savedEntities).toContain('classified: {');
    expect(savedEntities).toContain('event: {');
    expect(savedEntities).toContain('tourist_point: {');
    expect(savedEntities).toContain('vaga: {');
    expect(savedEntities).not.toMatch(/config:\s*ProfileSavedEntityConfig/);
    expect(engagementIndex).not.toContain("ProfileSavedEntityService");
    expect(serviceIndex).not.toContain("ProfileSavedEntityService");
  });

  it("keeps counters, uniqueness, RLS and abuse limits server-side", () => {
    const migration = read(
      "supabase/migrations/20260713090000_harden_community_social_runtime.sql",
    );

    expect(migration).toContain("UNIQUE (comment_id, liker_profile_id)");
    expect(migration).toContain("post_share_events_unique_profile");
    expect(migration).toContain("trg_sync_post_likes_count");
    expect(migration).toContain("trg_sync_comment_likes_count_v2");
    expect(migration).toContain("trg_sync_post_shares_count");
    expect(migration).toContain("social_interaction_rate_limit_exceeded");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("private.auth_owns_active_profile");
    expect(migration).toContain("post_likes_insert_own_visible");
    expect(migration).toContain("saved_posts_insert_own_visible");
    expect(migration).toContain("comment_likes_insert_own_visible");
  });

  it("preserves and restores feed cache during optimistic mutations", () => {
    const actions = read("src/core/posts/hooks/usePostActions.ts");
    const localInteractions = read(
      "src/core/community/hooks/posts/usePostInteractions.ts",
    );

    expect(actions).toContain("const previousFeeds = queryClient.getQueriesData");
    expect(actions).toContain("context?.previousFeeds.forEach");
    expect(actions).toContain("queryClient.setQueryData(queryKey, data)");
    expect(localInteractions).toContain("const previousState = { ...state }");
    expect(localInteractions).toContain("setState(previousState)");
  });
});
