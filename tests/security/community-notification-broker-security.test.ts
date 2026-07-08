import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community notification broker security", () => {
  it("routes community cross-user notifications through an authenticated domain broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/community-notifications-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile(
      "src/core/notifications/services/CommunityNotificationBrokerService.ts",
    );
    const communityLogic = readProjectFile("src/core/community/utils/communityBusinessLogic.ts");
    const postMutations = readProjectFile("src/core/posts/services/posts.mutations.ts");

    expect(config).toContain("[functions.community-notifications-rpc]");
    expect(config).toMatch(/\[functions\.community-notifications-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("create_notification"');
    expect(edgeFunction).toContain("actor.user_id !== userId");
    expect(edgeFunction).toContain('.from("post_likes_new")');
    expect(edgeFunction).toContain('.from("comments")');
    expect(edgeFunction).toContain('.from("posts")');
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/user_id:\s*params\./);

    expect(broker).toContain('const FUNCTION_NAME = "community-notifications-rpc"');
    expect(broker).not.toContain("user_id");

    expect(communityLogic).toContain("CommunityNotificationBrokerService.notifyPostLike");
    expect(communityLogic).not.toContain("NotificationService.createNotification");
    expect(postMutations).toContain("CommunityNotificationBrokerService.notifyPostLike");
    expect(postMutations).not.toContain("NotificationService.createNotification");
  });
});
