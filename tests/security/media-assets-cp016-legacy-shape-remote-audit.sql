-- CP-016 read-only legacy shape audit. It returns aggregate counts only and
-- never returns URLs, object paths, aggregate ids or owner ids.

WITH legacy_containers AS (
  SELECT
    'business_data.metadata'::text AS source,
    media_key.key_name AS field,
    COALESCE(business.profile_id::text, business.ctid::text) AS aggregate_key,
    business.profile_id::text AS owner_key,
    1::bigint AS owner_profile_candidates,
    business.metadata -> media_key.key_name AS container,
    jsonb_typeof(business.metadata -> media_key.key_name) IN ('string', 'array')
      AS valid_shape
  FROM public.business_data business
  CROSS JOIN LATERAL unnest(ARRAY[
    'logo_url',
    'banner_url',
    'fotos',
    'photos',
    'gallery',
    'gallery_images'
  ]::text[]) AS media_key(key_name)
  WHERE COALESCE(business.metadata, '{}'::jsonb) ? media_key.key_name

  UNION ALL

  SELECT
    'classifieds.photos',
    'all',
    classified.id::text,
    classified.seller_id::text,
    1::bigint,
    classified.photos,
    jsonb_typeof(classified.photos) = 'array'
  FROM public.classifieds classified
  WHERE classified.photos IS DISTINCT FROM '[]'::jsonb

  UNION ALL

  SELECT
    'site_settings.value',
    setting.key,
    setting.key,
    setting.updated_by::text,
    (
      SELECT count(*)
      FROM public.profiles profile
      WHERE profile.user_id = setting.updated_by
        AND profile.is_active = TRUE
        AND profile.is_suspended = FALSE
        AND profile.suspended = FALSE
    )::bigint,
    setting.value,
    jsonb_typeof(setting.value) = 'string'
  FROM public.site_settings setting
  WHERE setting.key IN ('logo_url', 'logo_mobile_url', 'favicon_url')
    AND NULLIF(btrim(setting.value #>> '{}'), '') IS NOT NULL
), legacy_values AS (
  SELECT
    container.source,
    container.field,
    container.aggregate_key,
    container.owner_key,
    container.owner_profile_candidates,
    container.valid_shape,
    expanded.value,
    CASE
      WHEN jsonb_typeof(expanded.value) = 'string' THEN expanded.value #>> '{}'
      ELSE NULL
    END AS value_text
  FROM legacy_containers container
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(container.container) = 'array' THEN container.container
      ELSE jsonb_build_array(container.container)
    END
  ) AS expanded(value) ON true
), owner_loads AS (
  SELECT
    value.source,
    value.field,
    value.owner_key,
    count(value.value)::bigint AS media_values
  FROM legacy_values value
  WHERE value.owner_key IS NOT NULL
  GROUP BY value.source, value.field, value.owner_key
), owner_distributions AS (
  SELECT
    load.source,
    load.field,
    jsonb_agg(load.media_values ORDER BY load.media_values) AS media_values,
    max(load.media_values)::bigint AS max_media_values
  FROM owner_loads load
  GROUP BY load.source, load.field
)
SELECT
  value.source,
  value.field,
  count(DISTINCT value.aggregate_key)::bigint AS aggregate_rows,
  count(value.value)::bigint AS media_values,
  count(DISTINCT value.aggregate_key) FILTER (
    WHERE NOT value.valid_shape
  )::bigint AS invalid_shape_rows,
  count(value.value) FILTER (
    WHERE jsonb_typeof(value.value) <> 'string'
       OR NULLIF(btrim(value.value_text), '') IS NULL
  )::bigint AS invalid_value_rows,
  count(DISTINCT value.owner_key)::bigint AS owner_profiles,
  min(value.owner_profile_candidates)::bigint
    AS min_owner_profile_candidates,
  max(value.owner_profile_candidates)::bigint
    AS max_owner_profile_candidates,
  COALESCE(distribution.media_values, '[]'::jsonb)
    AS owner_media_distribution,
  COALESCE(distribution.max_media_values, 0)::bigint
    AS max_media_values_per_owner,
  count(DISTINCT value.aggregate_key) FILTER (
    WHERE value.owner_key IS NULL
  )::bigint AS missing_owner_rows,
  count(value.value) FILTER (
    WHERE value.value_text ~ '^storage://media-assets/'
  )::bigint AS canonical_values,
  count(value.value) FILTER (
    WHERE value.value_text ~ '^storage://[^/]+'
      AND value.value_text !~ '^storage://media-assets/'
  )::bigint AS legacy_storage_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^https?://'
  )::bigint AS http_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^https?://[^/]+/storage/v1/object/public/'
  )::bigint AS public_storage_url_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^https?://[^/]+\.supabase\.co/storage/v1/object/'
  )::bigint AS supabase_storage_url_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^https?://(images|source)\.unsplash\.com/'
  )::bigint AS unsplash_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^https?://'
      AND value.value_text !~* '^https?://[^/]+\.supabase\.co/storage/v1/object/'
      AND value.value_text !~* '^https?://(images|source)\.unsplash\.com/'
  )::bigint AS other_http_values,
  count(value.value) FILTER (
    WHERE value.value_text ~ '^/'
      AND value.value_text !~ '^//'
  )::bigint AS relative_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '^data:'
  )::bigint AS data_url_values,
  count(value.value) FILTER (
    WHERE value.value_text ~* '\.(jpe?g|png|webp|gif)([?#].*)?$'
  )::bigint AS supported_image_extension_values,
  count(value.value) FILTER (
    WHERE NULLIF(btrim(value.value_text), '') IS NOT NULL
      AND value.value_text !~ '^storage://'
      AND value.value_text !~* '^https?://'
      AND NOT (
        value.value_text ~ '^/'
        AND value.value_text !~ '^//'
      )
      AND value.value_text !~* '^data:'
  )::bigint AS other_values
FROM legacy_values value
LEFT JOIN owner_distributions distribution
  ON distribution.source = value.source
 AND distribution.field = value.field
GROUP BY
  value.source,
  value.field,
  distribution.media_values,
  distribution.max_media_values
ORDER BY value.source, value.field;
