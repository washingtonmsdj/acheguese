import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community transactional notification security", () => {
  it("derives cross-user notifications only from persisted domain rows", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260713150000_make_community_social_notifications_transactional.sql",
    );
    const config = readProjectFile("supabase/config.toml");
    const postActions = readProjectFile(
      "src/core/posts/hooks/usePostActions.ts",
    );
    const commentMutations = readProjectFile(
      "src/core/comments/services/comments.mutations.ts",
    );

    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.create_community_social_notification",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public, private, pg_temp");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.create_community_social_notification",
    );
    expect(migration).toContain("trg_dispatch_community_post_notifications");
    expect(migration).toContain("trg_dispatch_community_comment_notifications");
    expect(migration).toContain(
      "trg_dispatch_community_post_like_notification",
    );
    expect(migration).toContain("ON CONFLICT (user_id, dedupe_key)");
    expect(migration).toContain("NOT v_preferences.social_enabled");
    expect(migration).toContain("LIMIT 20");
    expect(migration).not.toContain("content_preview");

    expect(config).not.toContain("[functions.community-notifications-rpc]");
    expect(
      existsSync(
        resolve(
          repoRoot,
          "supabase/functions/community-notifications-rpc/index.ts",
        ),
      ),
    ).toBe(false);
    expect(postActions).not.toContain("createLikeNotification");
    expect(commentMutations).not.toContain(
      "CommunityNotificationBrokerService",
    );
  });
});
