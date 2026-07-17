-- Community MediaAsset cutover read-only audit.
-- Returns aggregate counts only; never returns content, URLs, paths or ids.

WITH post_references AS (
  SELECT
    post.id AS aggregate_id,
    post.author_profile_id AS owner_profile_id,
    image.value AS reference
  FROM public.posts post
  CROSS JOIN LATERAL jsonb_array_elements_text(
    COALESCE(post.images, '[]'::JSONB)
  ) image(value)
),
lost_found_references AS (
  SELECT
    post.id AS aggregate_id,
    post.autor_id AS owner_profile_id,
    image.value AS reference
  FROM public.lost_found_posts post
  CROSS JOIN LATERAL unnest(COALESCE(post.imagens, '{}'::TEXT[])) image(value)
),
post_audit AS (
  SELECT
    count(*)::BIGINT AS reference_count,
    count(*) FILTER (
      WHERE asset.id IS NULL
         OR asset.owner_profile_id <> reference.owner_profile_id
         OR asset.preset <> 'post_image'
         OR asset.preset_version <> 1
         OR asset.state <> 'active'
    )::BIGINT AS invalid_reference_count,
    count(*) FILTER (
      WHERE link.asset_id IS NULL
         OR link.aggregate_type <> 'post'
         OR link.aggregate_id <> reference.aggregate_id
    )::BIGINT AS missing_link_count
  FROM post_references reference
  LEFT JOIN public.media_assets asset
    ON asset.storage_reference = reference.reference
  LEFT JOIN public.media_asset_links link
    ON link.asset_id = asset.id
),
lost_found_audit AS (
  SELECT
    count(*)::BIGINT AS reference_count,
    count(*) FILTER (
      WHERE asset.id IS NULL
         OR asset.owner_profile_id <> reference.owner_profile_id
         OR asset.preset <> 'post_image'
         OR asset.preset_version <> 1
         OR asset.state <> 'active'
    )::BIGINT AS invalid_reference_count,
    count(*) FILTER (
      WHERE link.asset_id IS NULL
         OR link.aggregate_type <> 'lost_found_post'
         OR link.aggregate_id <> reference.aggregate_id
    )::BIGINT AS missing_link_count
  FROM lost_found_references reference
  LEFT JOIN public.media_assets asset
    ON asset.storage_reference = reference.reference
  LEFT JOIN public.media_asset_links link
    ON link.asset_id = asset.id
)
SELECT
  post_audit.reference_count AS post_references,
  post_audit.invalid_reference_count AS invalid_post_references,
  post_audit.missing_link_count AS missing_post_links,
  lost_found_audit.reference_count AS lost_found_references,
  lost_found_audit.invalid_reference_count AS invalid_lost_found_references,
  lost_found_audit.missing_link_count AS missing_lost_found_links,
  (
    SELECT count(*)::BIGINT
    FROM storage.buckets bucket
    WHERE bucket.id = 'post_images'
  ) AS legacy_bucket_count,
  (
    SELECT count(*)::BIGINT
    FROM pg_policies policy
    WHERE policy.schemaname = 'storage'
      AND policy.tablename = 'objects'
      AND policy.policyname IN (
        'Post images are publicly accessible',
        'Authenticated users can upload post images',
        'Users can upload their own post images',
        'Users can delete their post images',
        'Users can delete their own post images',
        'post_images_owner_insert',
        'post_images_owner_delete'
      )
  ) AS legacy_policy_count,
  (
    SELECT count(*)::BIGINT
    FROM pg_proc procedure
    JOIN pg_namespace namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = 'private'
      AND procedure.proname = 'can_upload_owned_post_image'
  ) AS legacy_function_count
FROM post_audit
CROSS JOIN lost_found_audit;
