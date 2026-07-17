import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { profileService } from "@/core/profiles/services/ProfileService";
import { COMMUNITY_RUNTIME_LIMITS } from "@/shared/constants/communityRuntime";
import { PostEngagementService } from "./PostEngagementService";

type QueryError = { code?: string; message?: string } | null;

interface QueryResult {
  data: unknown;
  error: QueryError;
}

function createBuilder(result: QueryResult) {
  const builder: Record<string, ReturnType<typeof vi.fn>> & {
    then?: Promise<QueryResult>["then"];
  } = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };

  for (const method of [
    "select",
    "insert",
    "delete",
    "eq",
    "in",
    "order",
    "range",
  ] as const) {
    builder[method].mockReturnValue(builder);
  }

  builder.then = (onfulfilled, onrejected) =>
    Promise.resolve(result).then(onfulfilled, onrejected);

  return builder;
}

type DbOverride = {
  db: { from: ReturnType<typeof vi.fn> };
};

const service = PostEngagementService as unknown as DbOverride;
const originalDb = service.db;

describe("PostEngagementService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(profileService, "getRequiredActiveProfile").mockResolvedValue({
      id: "profile-active",
    } as never);
  });

  afterAll(() => {
    service.db = originalDb;
  });

  it("derives the active profile and writes a like through the canonical table", async () => {
    const builder = createBuilder({ data: [], error: null });
    const from = vi.fn(() => builder);
    service.db = { from };

    await expect(PostEngagementService.likePost("post-1")).resolves.toEqual({
      success: true,
    });

    expect(from).toHaveBeenCalledWith("post_likes_new");
    expect(builder.insert).toHaveBeenCalledWith({
      post_id: "post-1",
      liker_profile_id: "profile-active",
    });
  });

  it("treats a concurrent duplicate like as an idempotent success", async () => {
    const builder = createBuilder({
      data: [],
      error: { code: "23505", message: "duplicate" },
    });
    service.db = { from: vi.fn(() => builder) };

    await expect(PostEngagementService.likePost("post-1")).resolves.toEqual({
      success: true,
    });
  });

  it("deduplicates and bounds batch reads before querying Supabase", async () => {
    const builder = createBuilder({
      data: [{ post_id: "post-1" }],
      error: null,
    });
    service.db = { from: vi.fn(() => builder) };
    const ids = [
      "post-1",
      "post-1",
      ...Array.from(
        { length: COMMUNITY_RUNTIME_LIMITS.POST_ID_BATCH_SIZE + 10 },
        (_, index) => `post-${index + 2}`,
      ),
    ];

    await expect(PostEngagementService.getLikesForPosts(ids)).resolves.toEqual(
      new Set(["post-1"]),
    );

    const selectedIds = builder.in.mock.calls[0]?.[1] as string[];
    expect(selectedIds).toHaveLength(
      COMMUNITY_RUNTIME_LIMITS.POST_ID_BATCH_SIZE,
    );
    expect(new Set(selectedIds).size).toBe(selectedIds.length);
  });

  it("rejects an excessive saved-post offset without issuing a query", async () => {
    const from = vi.fn();
    service.db = { from };

    await expect(
      PostEngagementService.getSavedPosts(
        20,
        COMMUNITY_RUNTIME_LIMITS.SOCIAL_PAGE_OFFSET_MAX + 1,
      ),
    ).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
    expect(profileService.getRequiredActiveProfile).not.toHaveBeenCalled();
  });
});
