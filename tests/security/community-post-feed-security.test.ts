import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("community post and feed security contracts", () => {
  it("persists only canonical post image references", () => {
    const migration = read(
      "supabase/migrations/20260714100000_harden_community_post_content_media.sql",
    );
    const references = read(
      "src/core/media/references/postImageReference.ts",
    );
    const postRuntime = read("src/core/posts/services/post.service.runtime.ts");
    const schema = read("src/core/posts/schemas/postSchemas.ts");

    expect(migration).toContain("storage://post_images/");
    expect(migration).toContain("legacy_post_media_fields_not_supported");
    expect(migration).toContain("normalize_post_image_reference");
    expect(migration).not.toMatch(/image\.value\s*#>>\s*'\{\}'\s*!~\*\s*'\^https:\/\/'/);
    expect(references).toContain("resolvePostImageReference");
    expect(references).toContain("PUBLIC_SUPABASE_CONFIG.url");
    expect(postRuntime).toContain("toPostImageReference");
    expect(postRuntime).not.toContain("images: uploads.map((upload) => upload.url)");
    expect(schema).toContain("postImageReferenceSchema");
  });

  it("bounds storage and structured payload consumption in the database", () => {
    const migration = read(
      "supabase/migrations/20260714100000_harden_community_post_content_media.sql",
    );

    expect(migration).toContain("private.can_upload_owned_post_image");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("v_daily_count < 20");
    expect(migration).toContain("v_total_count < 200");
    expect(migration).toContain("pg_column_size(NEW.content_payload) > 16384");
    expect(migration).toContain("cardinality(NEW.distribution_channels), 0) > 8");
    expect(migration).toContain("invalid_post_structured_payload");
  });

  it("keeps feed pages bounded and skips offscreen card rendering work", () => {
    const queries = read("src/core/posts/services/posts.feed.queries.ts");
    const feed = read(
      "src/core/community/components/feed/UnifiedFeedWithMessages.tsx",
    );
    const postContent = read(
      "src/core/community/components/UnifiedPostCard/PostContent.tsx",
    );

    expect(queries).toContain("Math.min(50");
    expect(queries).toContain(".limit(normalizedLimit + 1)");
    expect(queries).toContain('.in("id", requestedIds)');
    expect(feed).toContain("content-visibility:auto");
    expect(feed).toContain("contain-intrinsic-size:0_520px");
    expect(postContent).toContain('loading="lazy"');
    expect(postContent).toContain('decoding="async"');
  });
});
