-- CP-016 read-only preflight. Run against the linked remote before any backfill
-- or cutover migration. It never writes and reports every legacy media value.

SELECT 'profiles.avatar_url' AS source, count(*) AS legacy_rows
FROM public.profiles
WHERE NULLIF(btrim(avatar_url), '') IS NOT NULL
  AND avatar_url !~ '^storage://media-assets/[0-9a-f-]{36}/user_avatar/v1/[0-9a-f-]{36}\\.jpg$'
UNION ALL
SELECT 'business_data.metadata', count(*)
FROM public.business_data
WHERE COALESCE(metadata, '{}'::jsonb) ?| ARRAY[
  'logo_url', 'banner_url', 'fotos', 'photos', 'gallery', 'gallery_images'
]
UNION ALL
SELECT 'business_gallery.image_url', count(*)
FROM public.business_gallery
WHERE NULLIF(btrim(image_url), '') IS NOT NULL
  AND image_url !~ '^storage://media-assets/[0-9a-f-]{36}/business_gallery/v1/[0-9a-f-]{36}\\.jpg$'
UNION ALL
SELECT 'classifieds.photos', count(*)
FROM public.classifieds
WHERE photos IS DISTINCT FROM '[]'::jsonb
UNION ALL
SELECT 'professional_data.media', count(*)
FROM public.professional_data
WHERE COALESCE(metadata, '{}'::jsonb) ?| ARRAY['logo_url', 'banner_url', 'portfolio_images']
   OR portfolio_items IS DISTINCT FROM '[]'::jsonb
UNION ALL
SELECT 'banners.image_url', count(*)
FROM public.banners
WHERE NULLIF(btrim(image_url), '') IS NOT NULL
  AND image_url !~ '^storage://media-assets/[0-9a-f-]{36}/site_banner/v1/[0-9a-f-]{36}\\.jpg$'
UNION ALL
SELECT 'site_settings.value', count(*)
FROM public.site_settings
WHERE key IN ('logo_url', 'logo_mobile_url', 'favicon_url')
  AND NULLIF(btrim(value #>> '{}'), '') IS NOT NULL
ORDER BY source;
