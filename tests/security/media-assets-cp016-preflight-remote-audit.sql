-- CP-016 read-only preflight. Run against the linked remote before any backfill
-- or cutover migration. It never writes and counts only non-canonical media.

SELECT 'profiles.avatar_url' AS source, count(*) AS legacy_rows
FROM public.profiles
WHERE NULLIF(btrim(avatar_url), '') IS NOT NULL
  AND avatar_url !~ '^storage://media-assets/[0-9a-f-]{36}/user_avatar/v1/[0-9a-f-]{36}\.jpg$'
UNION ALL
SELECT 'business_data.metadata', count(*)
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
SELECT 'business_gallery.image_url', count(*)
FROM public.business_gallery
WHERE NULLIF(btrim(image_url), '') IS NOT NULL
  AND image_url !~ '^storage://media-assets/[0-9a-f-]{36}/business_gallery/v1/[0-9a-f-]{36}\.jpg$'
UNION ALL
SELECT 'classifieds.photos', count(*)
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
SELECT 'professional_data.media', count(*)
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
        COALESCE(portfolio_items, '[]'::jsonb) IS DISTINCT FROM '[]'::jsonb
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
               OR NULLIF(btrim(portfolio_item.value ->> 'url'), '') IS NULL
               OR portfolio_item.value ->> 'url'
                 !~ '^storage://media-assets/[0-9a-f-]{36}/professional_portfolio/v1/[0-9a-f-]{36}\.jpg$'
          )
        )
      )
UNION ALL
SELECT 'banners.image_url', count(*)
FROM public.banners
WHERE NULLIF(btrim(image_url), '') IS NOT NULL
  AND image_url !~ '^storage://media-assets/[0-9a-f-]{36}/site_banner/v1/[0-9a-f-]{36}\.jpg$'
UNION ALL
SELECT 'site_settings.value', count(*)
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
ORDER BY source;
