-- Close the bounded CP-016 migration surface after proving canonical media.
-- The provenance ledger remains private; temporary mutation commands do not.

BEGIN;

DO $$
DECLARE
  v_legacy_rows BIGINT;
  v_invalid_audit_rows BIGINT;
BEGIN
  SELECT count(*) INTO v_legacy_rows
  FROM (
    SELECT 1
    FROM public.profiles
    WHERE NULLIF(btrim(avatar_url), '') IS NOT NULL
      AND avatar_url
        !~ '^storage://media-assets/[0-9a-f-]{36}/user_avatar/v1/[0-9a-f-]{36}\.jpg$'

    UNION ALL

    SELECT 1
    FROM public.business_data
    WHERE COALESCE(metadata, '{}'::jsonb) ?| ARRAY[
            'fotos', 'photos', 'gallery', 'gallery_images'
          ]
       OR (
            COALESCE(metadata, '{}'::jsonb) ? 'logo_url'
            AND (
              jsonb_typeof(metadata -> 'logo_url') <> 'string'
              OR NULLIF(btrim(metadata ->> 'logo_url'), '') IS NULL
              OR metadata ->> 'logo_url'
                !~ '^storage://media-assets/[0-9a-f-]{36}/business_logo/v1/[0-9a-f-]{36}\.jpg$'
            )
          )
       OR (
            COALESCE(metadata, '{}'::jsonb) ? 'banner_url'
            AND (
              jsonb_typeof(metadata -> 'banner_url') <> 'string'
              OR NULLIF(btrim(metadata ->> 'banner_url'), '') IS NULL
              OR metadata ->> 'banner_url'
                !~ '^storage://media-assets/[0-9a-f-]{36}/business_banner/v1/[0-9a-f-]{36}\.jpg$'
            )
          )

    UNION ALL

    SELECT 1
    FROM public.business_gallery
    WHERE NULLIF(btrim(image_url), '') IS NOT NULL
      AND image_url
        !~ '^storage://media-assets/[0-9a-f-]{36}/business_gallery/v1/[0-9a-f-]{36}\.jpg$'

    UNION ALL

    SELECT 1
    FROM public.classifieds
    WHERE COALESCE(photos, '[]'::jsonb) IS DISTINCT FROM '[]'::jsonb
      AND (
        jsonb_typeof(photos) <> 'array'
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(photos) = 'array' THEN photos
              ELSE '[]'::jsonb
            END
          ) AS photo(value)
          WHERE jsonb_typeof(photo.value) <> 'string'
             OR NULLIF(btrim(photo.value #>> '{}'), '') IS NULL
             OR photo.value #>> '{}'
               !~ '^storage://media-assets/[0-9a-f-]{36}/classified_image/v1/[0-9a-f-]{36}\.jpg$'
        )
      )

    UNION ALL

    SELECT 1
    FROM public.professional_data
    WHERE COALESCE(metadata, '{}'::jsonb) ? 'portfolio_images'
       OR (
            COALESCE(metadata, '{}'::jsonb) ? 'logo_url'
            AND (
              jsonb_typeof(metadata -> 'logo_url') <> 'string'
              OR NULLIF(btrim(metadata ->> 'logo_url'), '') IS NULL
              OR metadata ->> 'logo_url'
                !~ '^storage://media-assets/[0-9a-f-]{36}/professional_logo/v1/[0-9a-f-]{36}\.jpg$'
            )
          )
       OR (
            COALESCE(metadata, '{}'::jsonb) ? 'banner_url'
            AND (
              jsonb_typeof(metadata -> 'banner_url') <> 'string'
              OR NULLIF(btrim(metadata ->> 'banner_url'), '') IS NULL
              OR metadata ->> 'banner_url'
                !~ '^storage://media-assets/[0-9a-f-]{36}/professional_banner/v1/[0-9a-f-]{36}\.jpg$'
            )
          )
       OR (
            COALESCE(portfolio_items, '[]'::jsonb)
              IS DISTINCT FROM '[]'::jsonb
            AND (
              jsonb_typeof(portfolio_items) <> 'array'
              OR EXISTS (
                SELECT 1
                FROM jsonb_array_elements(
                  CASE
                    WHEN jsonb_typeof(portfolio_items) = 'array'
                      THEN portfolio_items
                    ELSE '[]'::jsonb
                  END
                ) AS portfolio_item(value)
                WHERE jsonb_typeof(portfolio_item.value) <> 'object'
                   OR jsonb_typeof(portfolio_item.value -> 'url') <> 'string'
                   OR NULLIF(
                     btrim(portfolio_item.value ->> 'url'),
                     ''
                   ) IS NULL
                   OR portfolio_item.value ->> 'url'
                     !~ '^storage://media-assets/[0-9a-f-]{36}/professional_portfolio/v1/[0-9a-f-]{36}\.jpg$'
              )
            )
          )

    UNION ALL

    SELECT 1
    FROM public.banners
    WHERE NULLIF(btrim(image_url), '') IS NOT NULL
      AND image_url
        !~ '^storage://media-assets/[0-9a-f-]{36}/site_banner/v1/[0-9a-f-]{36}\.jpg$'

    UNION ALL

    SELECT 1
    FROM public.site_settings
    WHERE key IN ('logo_url', 'logo_mobile_url', 'favicon_url')
      AND NULLIF(btrim(value #>> '{}'), '') IS NOT NULL
      AND (
        jsonb_typeof(value) <> 'string'
        OR value #>> '{}' !~ CASE key
          WHEN 'favicon_url'
            THEN '^storage://media-assets/[0-9a-f-]{36}/site_favicon/v1/[0-9a-f-]{36}\.jpg$'
          ELSE '^storage://media-assets/[0-9a-f-]{36}/site_logo/v1/[0-9a-f-]{36}\.jpg$'
        END
      )
  ) legacy_media;

  IF v_legacy_rows <> 0 THEN
    RAISE EXCEPTION 'cp016_cutover_legacy_media_remaining'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO v_invalid_audit_rows
  FROM private.media_asset_migration_audit audit
  LEFT JOIN public.media_assets asset ON asset.id = audit.asset_id
  LEFT JOIN public.media_asset_links link ON link.asset_id = audit.asset_id
  WHERE audit.migration_key = 'CP-016'
    AND (
      audit.attached_at IS NULL
      OR (
        audit.disposition = 'migrated'
        AND (
          asset.id IS NULL
          OR asset.state <> 'active'
          OR asset.attached_at IS NULL
          OR link.asset_id IS NULL
        )
      )
      OR (
        audit.disposition = 'dropped'
        AND (
          audit.asset_id IS NOT NULL
          OR audit.rejection_reason <> 'http_404'
        )
      )
    );

  IF v_invalid_audit_rows <> 0 THEN
    RAISE EXCEPTION 'cp016_cutover_invalid_audit_state'
      USING ERRCODE = '23514';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.finalize_cp016_media_asset_backfill(
  TEXT, UUID, JSONB, JSONB
);
DROP FUNCTION IF EXISTS public.reject_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT
);
DROP FUNCTION IF EXISTS public.reserve_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID, TEXT, SMALLINT,
  TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
);
DROP FUNCTION IF EXISTS private.require_cp016_backfill_rejection(
  TEXT, UUID, TEXT
);
DROP FUNCTION IF EXISTS private.require_cp016_backfill_asset(
  TEXT, TEXT, UUID, TEXT
);
DROP FUNCTION IF EXISTS private.cp016_legacy_source_matches(
  TEXT, UUID, TEXT, TEXT, TEXT
);

COMMENT ON TABLE private.media_asset_migration_audit IS
  'Private, URL-free hashed provenance ledger retained after the completed CP-016 cutover.';

COMMIT;
