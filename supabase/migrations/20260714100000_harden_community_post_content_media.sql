-- Canonical media references, bounded structured payloads and distributed
-- upload quotas for Community posts.

BEGIN;

-- security-authority: internal-function private.normalize_post_image_reference
CREATE OR REPLACE FUNCTION private.normalize_post_image_reference(
  p_value TEXT,
  p_profile_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_temp
AS $$
DECLARE
  v_path TEXT;
BEGIN
  IF p_value IS NULL OR p_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_value LIKE 'storage://post_images/%' THEN
    v_path := substring(p_value FROM char_length('storage://post_images/') + 1);
  ELSE
    v_path := substring(
      p_value FROM '(?i)^https://[^/]+/storage/v1/object/public/post_images/(.+)$'
    );
  END IF;

  IF v_path IS NULL
     OR split_part(v_path, '/', 1) <> p_profile_id::TEXT
     OR v_path !~* '^[0-9a-f-]{36}/posts/[A-Za-z0-9][A-Za-z0-9_-]{15,127}\.(jpg|jpeg)$' THEN
    RETURN NULL;
  END IF;

  RETURN 'storage://post_images/' || v_path;
END;
$$;

REVOKE ALL ON FUNCTION private.normalize_post_image_reference(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.normalize_post_image_reference(TEXT, UUID)
  TO service_role;

-- Reconcile existing rows to one representation. External and malformed media
-- is deliberately discarded instead of preserving an unsafe legacy contract.
WITH normalized AS (
  SELECT
    post.id,
    COALESCE(
      (
        SELECT jsonb_agg(item.reference ORDER BY item.ordinality)
        FROM (
          SELECT
            private.normalize_post_image_reference(
              image.value,
              post.author_profile_id
            ) AS reference,
            image.ordinality
          FROM jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(post.images) = 'array' THEN post.images
              ELSE '[]'::jsonb
            END
          ) WITH ORDINALITY image(value, ordinality)
          WHERE image.ordinality <= 4
        ) item
        WHERE item.reference IS NOT NULL
      ),
      '[]'::jsonb
    ) AS images,
    private.normalize_post_image_reference(
      post.image_url,
      post.author_profile_id
    ) AS image_url_reference
  FROM public.posts post
)
UPDATE public.posts post
SET
  images = CASE
    WHEN jsonb_array_length(normalized.images) = 0
         AND normalized.image_url_reference IS NOT NULL
      THEN jsonb_build_array(normalized.image_url_reference)
    ELSE normalized.images
  END,
  image_url = NULL,
  video_url = NULL
FROM normalized
WHERE normalized.id = post.id;

-- security-authority: internal-function private.can_upload_owned_post_image
CREATE OR REPLACE FUNCTION private.can_upload_owned_post_image(
  p_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, storage, private, pg_temp
AS $$
DECLARE
  v_daily_count INTEGER;
  v_total_count INTEGER;
BEGIN
  IF NOT private.auth_owns_active_profile(p_profile_id) THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.user_residences residence
      ON residence.user_id = profile.user_id
    JOIN public.locations location
      ON location.id = residence.location_id
    WHERE profile.id = p_profile_id
      AND profile.user_id = auth.uid()
      AND residence.is_verified = TRUE
      AND location.status::TEXT = 'active'
  ) THEN
    RETURN FALSE;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('community_post_image_upload'),
    hashtext(p_profile_id::TEXT)
  );

  SELECT
    count(*) FILTER (WHERE object.created_at >= now() - interval '24 hours'),
    count(*)
  INTO v_daily_count, v_total_count
  FROM storage.objects object
  WHERE object.bucket_id = 'post_images'
    AND object.name LIKE p_profile_id::TEXT || '/posts/%';

  RETURN v_daily_count < 20 AND v_total_count < 200;
END;
$$;

REVOKE ALL ON FUNCTION private.can_upload_owned_post_image(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.can_upload_owned_post_image(UUID)
  TO authenticated, service_role;

DROP POLICY IF EXISTS post_images_owner_insert ON storage.objects;
CREATE POLICY post_images_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post_images'
    AND (storage.foldername(name))[2] = 'posts'
    AND lower(storage.extension(name)) IN ('jpg', 'jpeg')
    AND name ~* '^[0-9a-f-]{36}/posts/[A-Za-z0-9][A-Za-z0-9_-]{15,127}\.(jpg|jpeg)$'
    AND private.auth_owns_active_profile(
      CASE
        WHEN COALESCE((storage.foldername(name))[1], '')
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN (storage.foldername(name))[1]::UUID
        ELSE NULL
      END
    )
    AND private.can_upload_owned_post_image(
      CASE
        WHEN COALESCE((storage.foldername(name))[1], '')
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN (storage.foldername(name))[1]::UUID
        ELSE NULL
      END
    )
  );

CREATE OR REPLACE FUNCTION private.guard_community_post_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_is_trusted BOOLEAN := COALESCE(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR COALESCE(current_setting('acheguese.internal_social_write', TRUE), '') = 'on';
  v_actor_profile_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF NOT v_is_trusted AND TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.author_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    IF NOT private.auth_has_verified_residence(NEW.author_profile_id, NEW.location_id) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('community_post_rate'),
      hashtext(NEW.author_profile_id::TEXT)
    );
    SELECT count(*) INTO v_recent_count
    FROM public.posts post
    WHERE post.author_profile_id = NEW.author_profile_id
      AND post.created_at >= now() - interval '24 hours';
    IF v_recent_count >= 5 THEN
      RAISE EXCEPTION 'post_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;

    NEW.likes_count := 0;
    NEW.comments_count := 0;
    NEW.shares_count := 0;
    NEW.confirmations_count := 0;
    NEW.is_verified := FALSE;
    NEW.is_hidden := FALSE;
    NEW.is_removed := FALSE;
    NEW.removed_reason := NULL;
    NEW.removed_at := NULL;
    NEW.removed_by := NULL;
  ELSIF NOT v_is_trusted THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.author_profile_id IS DISTINCT FROM OLD.author_profile_id
       OR NEW.location_id IS DISTINCT FROM OLD.location_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.type IS DISTINCT FROM OLD.type
       OR NEW.content_intent IS DISTINCT FROM OLD.content_intent
       OR NEW.display_format IS DISTINCT FROM OLD.display_format
       OR NEW.distribution_channels IS DISTINCT FROM OLD.distribution_channels
       OR NEW.content_payload IS DISTINCT FROM OLD.content_payload
       OR NEW.reach IS DISTINCT FROM OLD.reach THEN
      RAISE EXCEPTION 'post_identity_is_immutable' USING ERRCODE = '42501';
    END IF;

    IF v_is_admin THEN
      IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at THEN
        v_actor_profile_id := private.current_active_profile_id();
        IF v_actor_profile_id IS NULL THEN
          RAISE EXCEPTION 'active_moderator_profile_required' USING ERRCODE = '42501';
        END IF;
        NEW.removed_by := CASE
          WHEN NEW.is_hidden OR NEW.is_removed THEN v_actor_profile_id
          ELSE NULL
        END;
        NEW.removed_at := CASE
          WHEN NEW.is_removed THEN COALESCE(NEW.removed_at, now())
          ELSE NULL
        END;
      END IF;
    ELSE
      IF NOT private.auth_owns_active_profile(OLD.author_profile_id)
         OR NOT private.auth_has_verified_residence(OLD.author_profile_id, OLD.location_id) THEN
        RAISE EXCEPTION 'post_update_not_authorized' USING ERRCODE = '42501';
      END IF;

      IF NEW.likes_count IS DISTINCT FROM OLD.likes_count
         OR NEW.comments_count IS DISTINCT FROM OLD.comments_count
         OR NEW.shares_count IS DISTINCT FROM OLD.shares_count
         OR NEW.confirmations_count IS DISTINCT FROM OLD.confirmations_count
         OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
         OR NEW.is_hidden IS DISTINCT FROM OLD.is_hidden
         OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
         OR NEW.removed_reason IS DISTINCT FROM OLD.removed_reason
         OR NEW.removed_at IS DISTINCT FROM OLD.removed_at
         OR NEW.removed_by IS DISTINCT FROM OLD.removed_by THEN
        RAISE EXCEPTION 'protected_post_fields_are_server_owned' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.content, ''))) < 10
     OR char_length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'invalid_post_content_length' USING ERRCODE = '22023';
  END IF;

  IF NEW.images IS NOT NULL AND (
    jsonb_typeof(NEW.images) <> 'array'
    OR jsonb_array_length(NEW.images) > 4
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.images) image(value)
      WHERE jsonb_typeof(image.value) <> 'string'
        OR image.value #>> '{}' !~* format(
          '^storage://post_images/%s/posts/[A-Za-z0-9][A-Za-z0-9_-]{15,127}\.(jpg|jpeg)$',
          NEW.author_profile_id::TEXT
        )
    )
  ) THEN
    RAISE EXCEPTION 'invalid_post_images' USING ERRCODE = '22023';
  END IF;

  IF NEW.image_url IS NOT NULL OR NEW.video_url IS NOT NULL THEN
    RAISE EXCEPTION 'legacy_post_media_fields_not_supported' USING ERRCODE = '22023';
  END IF;

  IF NEW.tags IS NOT NULL AND (
    jsonb_typeof(NEW.tags) <> 'array'
    OR jsonb_array_length(NEW.tags) > 5
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(NEW.tags) tag(value)
      WHERE jsonb_typeof(tag.value) <> 'string'
        OR char_length(trim(BOTH '"' FROM tag.value::TEXT)) NOT BETWEEN 1 AND 30
    )
  ) THEN
    RAISE EXCEPTION 'invalid_post_tags' USING ERRCODE = '22023';
  END IF;

  IF char_length(COALESCE(NEW.content_intent, '')) > 64
     OR char_length(COALESCE(NEW.display_format, '')) > 64
     OR COALESCE(cardinality(NEW.distribution_channels), 0) > 8
     OR EXISTS (
       SELECT 1
       FROM unnest(COALESCE(NEW.distribution_channels, ARRAY[]::TEXT[])) channel
       WHERE char_length(trim(channel)) NOT BETWEEN 1 AND 40
     )
     OR (NEW.content_payload IS NOT NULL AND (
       jsonb_typeof(NEW.content_payload) <> 'object'
       OR pg_column_size(NEW.content_payload) > 16384
     )) THEN
    RAISE EXCEPTION 'invalid_post_structured_payload' USING ERRCODE = '22023';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_post_write() FROM PUBLIC;

COMMENT ON FUNCTION private.can_upload_owned_post_image(UUID) IS
  'Transactional per-profile quota for canonical Community post media uploads.';
COMMENT ON FUNCTION private.normalize_post_image_reference(TEXT, UUID) IS
  'One-time reconciliation helper from public post image URLs to storage references.';

COMMIT;
