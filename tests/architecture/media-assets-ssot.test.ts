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
    const jpegValidation = read("supabase/functions/_shared/jpegValidation.ts");

    expect(broker).toContain("auth.getUser(token)");
    expect(broker).toContain('.from("profiles")');
    expect(broker).toContain("MAX_MEDIA_ASSET_BYTES");
    expect(broker.indexOf("Request body too large")).toBeLessThan(
      broker.indexOf("req.formData()"),
    );
    expect(broker).toContain("validateAndStripJpegMetadata");
    expect(jpegValidation).toContain('crypto.subtle.digest("SHA-256"');
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
    expect(migration).toContain(
      "ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY",
    );
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
    expect(scheduler).not.toMatch(
      /x-cron-secret['"],\s*['"][A-Za-z0-9_-]{20,}/,
    );
    expect(reviewsBroker).toContain("REVIEW_PHOTO_REFERENCE_PATTERN");
    expect(reviewsBroker).toContain("Duplicate photo reference");
    expect(config).toMatch(/\[functions\.media-assets\]\s+verify_jwt = true/);
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
    const shapeAudit = read(
      "tests/security/media-assets-cp016-legacy-shape-remote-audit.sql",
    );

    expect(migration).not.toMatch(
      /(?:DELETE FROM public\.(?:business_gallery|banners)|UPDATE public\.(?:profiles|business_data|classifieds|professional_data|site_settings))/,
    );
    expect(preflight).toContain("CP-016 read-only preflight");
    expect(preflight).toContain("counts only non-canonical media");
    expect(preflight).toContain("/business_logo/v1/");
    expect(preflight).toContain("/classified_image/v1/");
    expect(preflight).toContain("/professional_portfolio/v1/");
    expect(preflight).toContain("/site_favicon/v1/");
    expect(preflight).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i,
    );
    expect(shapeAudit).toContain("aggregate counts only");
    expect(shapeAudit).toContain(
      "never returns URLs, object paths, aggregate ids or owner ids",
    );
    expect(shapeAudit).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i,
    );
  });
  it("bounds the CP-016 backfill and keeps its mutation surface temporary", () => {
    const migration = read(
      "supabase/migrations/20260717120000_create_cp016_media_backfill_commands.sql",
    );
    const executor = read("tools/migrations/media-assets-cp016-backfill.ts");
    const jpegValidation = read("supabase/functions/_shared/jpegValidation.ts");

    expect(migration).toContain("source_sha256");
    expect(migration).toContain("disposition IN ('migrated', 'dropped')");
    expect(migration).toContain("reject_cp016_media_asset_backfill");
    expect(migration).toContain("missing_cp016_backfill_rejection");
    expect(migration).toContain("cp016_backfill_source_mismatch");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("changed_since_preflight");
    const revokeIndex = migration.indexOf(
      "REVOKE ALL ON FUNCTION public.reserve_cp016_media_asset_backfill",
    );
    const grantIndex = migration.indexOf(
      "GRANT EXECUTE ON FUNCTION public.reserve_cp016_media_asset_backfill",
    );
    expect(revokeIndex).toBeGreaterThan(-1);
    expect(
      migration.indexOf("FROM PUBLIC, anon, authenticated;", revokeIndex),
    ).toBeGreaterThan(revokeIndex);
    expect(grantIndex).toBeGreaterThan(-1);
    expect(migration.indexOf("TO service_role;", grantIndex)).toBeGreaterThan(
      grantIndex,
    );
    expect(migration).not.toContain("source_url");

    expect(executor).toContain('redirect: "error"');
    expect(executor).toContain("MAX_SOURCE_BYTES");
    expect(executor).toContain("FETCH_TIMEOUT_MS");
    expect(executor).toContain("CP016_REMOTE_BACKFILL");
    expect(executor).toContain("HTTP_404_ONLY");
    expect(executor).toContain("recordUnavailable404");
    expect(executor).toContain('rpc("get_active_profile"');
    expect(executor).toContain("validated-no-writes");
    expect(executor).toContain("hostname === supabaseHostname");
    expect(executor).toContain("upsert: false");
    expect(executor).not.toContain("console.log(task.sourceUrl");
    expect(executor).not.toContain("console.error(task.sourceUrl");

    expect(jpegValidation).toContain(
      "export function validateAndStripJpegMetadata",
    );
    expect(jpegValidation).toContain("export async function sha256Hex");
  });

  it("closes the CP-016 mutation surface only after a replayable cutover", () => {
    const cutover = read(
      "supabase/migrations/20260717121000_finalize_cp016_media_cutover.sql",
    );
    const audit = read(
      "tests/security/media-assets-cp016-cutover-remote-audit.sql",
    );

    expect(cutover).toContain("cp016_cutover_legacy_media_remaining");
    expect(cutover).toContain("cp016_cutover_invalid_audit_state");
    expect(cutover).toContain(
      "DROP FUNCTION IF EXISTS public.reserve_cp016_media_asset_backfill",
    );
    expect(cutover).toContain(
      "DROP FUNCTION IF EXISTS public.reject_cp016_media_asset_backfill",
    );
    expect(cutover).toContain(
      "DROP FUNCTION IF EXISTS public.finalize_cp016_media_asset_backfill",
    );
    expect(cutover).not.toMatch(/audit_rows\s*(?:=|<>)\s*55/i);
    expect(cutover).not.toMatch(/migrated_rows\s*(?:=|<>)\s*49/i);
    expect(audit).toContain("aggregate counts only");
    expect(audit).toContain("invalid_rows");
    expect(audit).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i,
    );
  });

  it("does not reintroduce public-domain upload wrappers outside MediaAsset", () => {
    const mediaService = read("src/core/media/services/MediaService.ts");
    const authService = read("src/core/auth/services/AuthService.ts");
    const storageBuckets = read("src/core/media/config/storageBuckets.ts");

    expect(mediaService).not.toMatch(
      /async (?:uploadAvatar|uploadProfessionalImage|uploadBusinessImage)\(/,
    );
    expect(mediaService).not.toMatch(
      /async (?:uploadMultipleImages|deleteFile)\(/,
    );
    expect(mediaService).not.toMatch(/\n\s*getPublicUrl\s*\(/);
    expect(mediaService).not.toContain("uploadPostImage(");
    expect(storageBuckets).not.toContain("POST_IMAGES");
    expect(authService).not.toContain("deleteStorageImage");
    expect(authService).not.toContain("static async uploadImage(");
  });
  it("cuts Community media over without exposing remote row data", () => {
    const cutover = read(
      "supabase/migrations/20260717130000_consolidate_community_post_media_assets.sql",
    );
    const audit = read(
      "tests/security/community-media-assets-cutover-remote-audit.sql",
    );

    expect(cutover).toContain(
      "community_media_asset_cutover_requires_backfill",
    );
    expect(cutover).toContain("DROP POLICY IF EXISTS post_images_owner_insert");
    expect(cutover).not.toContain("DELETE FROM storage.buckets");
    expect(cutover).toContain("private.sync_post_media_asset_links");
    expect(cutover).toContain("private.sync_lost_found_media_asset_links");
    expect(audit).toContain("Returns aggregate counts only");
    expect(audit).toContain("invalid_post_references");
    expect(audit).toContain("legacy_bucket_count");
    expect(audit).not.toMatch(
      /^\s*(?:INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/gim,
    );
  });
  it("renders migrated business and classified media through SafeImage", () => {
    const migratedReaders = [
      "src/core/community/components/page/CommunityOverviewSurface.tsx",
      "src/core/community/components/CommunityRightSidebar.tsx",
      "src/modules/business/components/PhotoGallery.tsx",
      "src/modules/classifieds/components/VendedorCard.tsx",
      "src/modules/classifieds/pages/VendedorPerfilPage.tsx",
    ];

    for (const path of migratedReaders) {
      const source = read(path);
      expect(source).toContain("SafeImage");
      expect(source).not.toContain("<img");
    }
  });
});
