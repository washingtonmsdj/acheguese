import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const presets = [
  "user_avatar",
  "post_image",
  "business_logo",
  "business_banner",
  "business_gallery",
  "review_photo",
  "gastronomy_menu_item",
  "classified_image",
  "professional_logo",
  "professional_banner",
  "professional_portfolio",
  "site_banner",
  "site_logo",
  "site_favicon",
  "attachment_image",
] as const;

describe("MediaAsset SSOT", () => {
  it("keeps the client and server preset registries aligned", () => {
    const client = read("src/core/media/config/mediaPresets.ts");
    const server = read("supabase/functions/_shared/mediaPresets.ts");
    const coreMigration = read(
      "supabase/migrations/20260714125000_create_media_asset_core.sql",
    );
    const extensionMigration = read(
      "supabase/migrations/20260715113000_consolidate_public_media_asset_domains.sql",
    );
    const extensionPresets = new Set([
      "professional_banner",
      "site_logo",
      "site_favicon",
    ]);

    for (const preset of presets) {
      expect(client).toContain(`"${preset}"`);
      expect(server).toContain(`${preset}: preset(`);
      expect(
        extensionPresets.has(preset) ? extensionMigration : coreMigration,
      ).toContain(`'${preset}'`);
    }
  });

  it("routes Review and Menu through their own canonical presets", () => {
    const reviewForm = read(
      "src/modules/business/gastronomy/components/ReviewForm.tsx",
    );
    const itemForm = read(
      "src/modules/business/gastronomy/components/menu/ItemForm.tsx",
    );
    const itemFields = read(
      "src/modules/business/gastronomy/components/menu/ItemFormFields.tsx",
    );
    const itemModel = read(
      "src/modules/business/gastronomy/components/menu/ItemForm.model.ts",
    );

    expect(reviewForm).toContain("uploadMediaAsset(");
    expect(reviewForm).toContain("'review_photo'");
    expect(itemForm).toContain("uploadMediaAsset(");
    expect(itemForm).toContain("'gastronomy_menu_item'");
    expect(reviewForm).not.toContain("uploadPostImage(");
    expect(itemForm).not.toContain("uploadPostImage(");
    expect(read("src/core/media/services/MediaService.ts")).not.toContain(
      'preset?: "post_image" | "gastronomy_menu_item"',
    );
    expect(itemFields).not.toMatch(/placeholder=["']https?:\/\//);
    expect(itemModel).toContain("isMediaAssetReference(value)");
  });

  it("keeps the upload broker authenticated, bounded and server-named", () => {
    const broker = read("supabase/functions/media-assets/index.ts");

    expect(broker).toContain("auth.getUser(token)");
    expect(broker).toContain('.from("profiles")');
    expect(broker).toContain("MAX_MEDIA_ASSET_BYTES");
    expect(broker.indexOf("Request body too large")).toBeLessThan(
      broker.indexOf("req.formData()"),
    );
    expect(broker).toContain("validateAndStripJpegMetadata");
    expect(broker).toContain("crypto.subtle.digest(\"SHA-256\"");
    expect(broker).toContain("crypto.randomUUID()");
    expect(broker).toContain('"reserve_media_asset_upload"');
    expect(broker).toContain("upsert: false");
    expect(broker).not.toContain("file.name");
  });

  it("enforces lifecycle, owner links, quota and bounded orphan claims in SQL", () => {
    const migration = read(
      "supabase/migrations/20260714125000_create_media_asset_core.sql",
    );

    expect(migration).toContain("CREATE TABLE public.media_assets");
    expect(migration).toContain("CREATE TABLE public.media_asset_links");
    expect(migration).toContain("ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("media_assets_owner_select");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("media_asset_quota_exceeded");
    expect(migration).toContain("private.require_media_asset_reference");
    expect(migration).toContain("AFTER INSERT OR UPDATE OR DELETE");
    expect(migration).toContain("FOR UPDATE SKIP LOCKED");
    expect(migration).toContain("TO service_role");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.reserve_media_asset_upload[\s\S]+FROM PUBLIC, anon, authenticated/,
    );
  });

  it("protects cleanup and rejects arbitrary review photo URLs", () => {
    const cleanup = read("supabase/functions/media-assets-cleanup/index.ts");
    const scheduler = read(
      "supabase/migrations/20260714126000_schedule_media_asset_cleanup.sql",
    );
    const reviewsBroker = read(
      "supabase/functions/business-reviews-rpc/index.ts",
    );
    const config = read("supabase/config.toml");

    expect(cleanup).toContain("requireCronSecret(req");
    expect(cleanup).toContain('"list_media_asset_orphans"');
    expect(cleanup).toContain('"mark_media_assets_deleted"');
    expect(cleanup).toContain("MAX_BATCHES_PER_RUN = 5");
    expect(scheduler).toContain("vault.decrypted_secrets");
    expect(scheduler).toContain("acheguese_cron_secret");
    expect(scheduler).toContain("*/5 * * * *");
    expect(scheduler).not.toMatch(/x-cron-secret['"],\s*['"][A-Za-z0-9_-]{20,}/);
    expect(reviewsBroker).toContain("REVIEW_PHOTO_REFERENCE_PATTERN");
    expect(reviewsBroker).toContain("Duplicate photo reference");
    expect(config).toMatch(
      /\[functions\.media-assets\]\s+verify_jwt = true/,
    );
    expect(config).toMatch(
      /\[functions\.media-assets-cleanup\]\s+verify_jwt = false/,
    );
  });

  it("keeps CP-016 non-destructive and requires a read-only remote preflight", () => {
    const migration = read(
      "supabase/migrations/20260715113000_consolidate_public_media_asset_domains.sql",
    );
    const preflight = read(
      "tests/security/media-assets-cp016-preflight-remote-audit.sql",
    );

    expect(migration).not.toMatch(
      /(?:DELETE FROM public\.(?:business_gallery|banners)|UPDATE public\.(?:profiles|business_data|classifieds|professional_data|site_settings))/,
    );
    expect(preflight).toContain("CP-016 read-only preflight");
    expect(preflight).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
  });
});
