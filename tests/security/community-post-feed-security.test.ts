import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("community post and feed security contracts", () => {
  it("persists only canonical post image references", () => {
    const migration = read(
      "supabase/migrations/20260717130000_consolidate_community_post_media_assets.sql",
    );
    const references = read("src/core/media/references/mediaAssetReference.ts");
    const postRuntime = read("src/core/posts/services/post.service.runtime.ts");
    const schema = read("src/core/posts/schemas/postSchemas.ts");

    expect(migration).toContain("private.require_attachable_owned_media_asset");
    expect(migration).toContain("private.sync_post_media_asset_links");
    expect(migration).toContain("legacy_post_media_fields_not_supported");
    expect(migration).toContain(
      "DROP POLICY IF EXISTS post_images_owner_insert",
    );
    expect(migration).toContain(
      "DROP FUNCTION IF EXISTS private.can_upload_owned_post_image",
    );
    expect(references).toContain("resolveMediaAssetReference");
    expect(references).toContain("isMediaAssetReferenceForPreset");
    expect(postRuntime).toContain("uploadMediaAsset(");
    expect(postRuntime).toContain("references.push(asset.reference)");
    expect(postRuntime).not.toContain("uploadPostImage(");
    expect(postRuntime).not.toContain("deleteFromBucket(");
    expect(schema).toContain("postImageReferenceSchema");
    expect(schema).toContain(
      'isMediaAssetReferenceForPreset(value, "post_image")',
    );
  });

  it("bounds storage and structured payload consumption in the database", () => {
    const contentMigration = read(
      "supabase/migrations/20260714100000_harden_community_post_content_media.sql",
    );
    const mediaMigration = read(
      "supabase/migrations/20260715113000_consolidate_public_media_asset_domains.sql",
    );

    expect(mediaMigration).toContain("private.media_preset_daily_limit");
    expect(mediaMigration).toContain("WHEN 'post_image' THEN 20");
    expect(mediaMigration).toContain("pg_advisory_xact_lock");
    expect(contentMigration).toContain(
      "pg_column_size(NEW.content_payload) > 16384",
    );
    expect(contentMigration).toContain(
      "cardinality(NEW.distribution_channels), 0) > 8",
    );
    expect(contentMigration).toContain("invalid_post_structured_payload");
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
