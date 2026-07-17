import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Posts and Feed ownership", () => {
  it("keeps Post CRUD and pagination in one canonical owner", () => {
    const runtime = read("src/core/posts/services/post.service.runtime.ts");
    const feedQuery = read("src/core/posts/services/posts.feed.queries.ts");
    const generalQueries = read("src/core/posts/services/posts.queries.ts");
    const servicesIndex = read("src/core/posts/services/index.ts");

    expect(runtime).toContain("return queries.getFeed(params)");
    expect(feedQuery.match(/export async function getFeed\(/g)).toHaveLength(1);
    expect(generalQueries).not.toMatch(/export async function getFeed\(/);
    expect(servicesIndex).not.toMatch(/postService\s+as\s+feedService/);
  });

  it("keeps core/feed limited to composition cache ownership", () => {
    const feedIndex = read("src/core/feed/index.ts");
    const queryKeys = read("src/core/feed/queryKeys.ts");

    expect(feedIndex).toContain("communityFeedQueryKeys");
    expect(feedIndex).not.toMatch(/feedService|export type/);
    expect(queryKeys).toContain('["community-feed", locationScope, territoryKey]');
    expect(existsSync(resolve(root, "src/core/feed/types.ts"))).toBe(false);
    expect(existsSync(resolve(root, "src/core/feed/services/FeedService.ts"))).toBe(false);
  });

  it("bounds each page and applies explicit public visibility filters", () => {
    const feedQuery = read("src/core/posts/services/posts.feed.queries.ts");

    expect(feedQuery).toContain("Math.min(50");
    expect(feedQuery).toContain(".limit(normalizedLimit + 1)");
    expect(feedQuery).toContain('.eq("is_published", true)');
    expect(feedQuery).toContain('.eq("is_hidden", false)');
    expect(feedQuery).toContain('.eq("is_removed", false)');
    expect(feedQuery).toContain('.order("created_at", { ascending: false })');
    expect(feedQuery).toContain('.order("id", { ascending: false })');
  });

  it("does not expose unused feed contexts or compatibility item adapters", () => {
    const postTypes = read("src/core/posts/types.ts");
    const communityHook = read(
      "src/core/community/hooks/feed/useCommunityFeed.ts",
    );

    expect(postTypes).not.toMatch(/FeedContext|context\?:/);
    expect(communityHook).not.toMatch(/feedItems|my_posts|saved/);
    expect(communityHook).toContain("postService.getFeed(params)");
  });
});
