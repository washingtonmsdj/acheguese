import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("Posts UI ownership", () => {
  it("keeps core/posts free of UI re-export facades", () => {
    for (const retiredPath of [
      "src/core/posts/components/index.ts",
      "src/core/posts/components/PostCard.tsx",
      "src/core/posts/components/PostCardSkeleton.tsx",
      "src/core/posts/components/PostHeader.tsx",
    ]) {
      expect(existsSync(resolve(ROOT, retiredPath))).toBe(false);
    }
  });

  it("owns profile-only post card in the Profile module", () => {
    const card = read("src/modules/profile/components/ProfilePostCard.tsx");
    const userGrid = read("src/modules/profile/components/UserPostsGrid.tsx");
    const savedGrid = read("src/modules/profile/components/SavedPostsGrid.tsx");

    expect(card).toContain("export function ProfilePostCard");
    expect(userGrid).toContain('from "./ProfilePostCard"');
    expect(savedGrid).toContain('from "./ProfilePostCard"');
    expect(
      existsSync(resolve(ROOT, "src/core/community/components/cards/PostCard.tsx")),
    ).toBe(false);
  });

  it("owns the shared Feed loading skeleton in community-feed", () => {
    const feed = read("src/core/community-feed/components/CommunityFeed.tsx");
    expect(feed).toContain(
      "@/core/community-feed/components/PostCardSkeleton",
    );
    expect(
      existsSync(resolve(ROOT, "src/core/community/components/PostCardSkeleton.tsx")),
    ).toBe(false);
  });
});
