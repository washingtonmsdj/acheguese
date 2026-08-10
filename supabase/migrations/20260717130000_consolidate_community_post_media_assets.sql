-- Move Community posts and lost-and-found images to the canonical MediaAsset
-- lifecycle. The legacy bucket is emptied by the fail-closed preflight and its
-- browser writers are removed here; bucket deletion uses the supported API.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.posts post
    WHERE jsonb_typeof(COALESCE(post.images, '[]'::JSONB)) <> 'array'
       OR jsonb_array_length(COALESCE(post.images, '[]'::JSONB)) > 0
  ) OR EXISTS (
    SELECT 1
    FROM public.lost_found_posts post
    WHERE COALESCE(cardinality(post.imagens), 0) > 0
  ) OR EXISTS (
    SELECT 1
    FROM storage.objects object
    WHERE object.bucket_id = 'post_images'
  ) THEN
    RAISE EXCEPTION 'community_media_asset_cutover_requires_backfill'
      USING ERRCODE = '55000';
  END IF;
END $$;

ALTER TABLE public.media_asset_links
  DROP CONSTRAINT IF EXISTS media_asset_links_aggregate_type_check;

ALTER TABLE public.media_asset_links
  ADD CONSTRAINT media_asset_links_aggregate_type_check CHECK (
    aggregate_type IN (
      'review',
      'menu_item',
      'profile_avatar',
      'business',
      'business_gallery_item',
      'classified',
      'professional',
      'banner',
      'site_setting',
      'post',
      'lost_found_post'
    )
  );

-- security-authority: internal-function private.guard_community_post_write
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
  v_reference TEXT;
  v_reference_count INTEGER;
  v_distinct_reference_count INTEGER;
BEGIN
  IF NOT v_is_trusted AND TG_OP = 'INSERT' THEN
    IF NOT private.auth_owns_active_profile(NEW.author_profile_id) THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    IF NOT private.auth_has_verified_residence(
      NEW.author_profile_id,
      NEW.location_id
    ) THEN
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
          RAISE EXCEPTION 'active_moderator_profile_required'
            USING ERRCODE = '42501';
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
         OR NOT private.auth_has_verified_residence(
           OLD.author_profile_id,
           OLD.location_id
         ) THEN
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
        RAISE EXCEPTION 'protected_post_fields_are_server_owned'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF char_length(trim(COALESCE(NEW.content, ''))) < 10
     OR char_length(NEW.content) > 5000 THEN
    RAISE EXCEPTION 'invalid_post_content_length' USING ERRCODE = '22023';
  END IF;

  NEW.images := COALESCE(NEW.images, '[]'::JSONB);
  IF jsonb_typeof(NEW.images) <> 'array'
     OR jsonb_array_length(NEW.images) > 4
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements(NEW.images) image(value)
       WHERE jsonb_typeof(image.value) <> 'string'
     ) THEN
    RAISE EXCEPTION 'invalid_post_images' USING ERRCODE = '22023';
  END IF;

  SELECT count(*), count(DISTINCT value)
  INTO v_reference_count, v_distinct_reference_count
  FROM jsonb_array_elements_text(NEW.images) image(value);
  IF v_reference_count <> v_distinct_reference_count THEN
    RAISE EXCEPTION 'duplicate_post_image_reference' USING ERRCODE = '23505';
  END IF;

  FOR v_reference IN
    SELECT value FROM jsonb_array_elements_text(NEW.images) image(value)
  LOOP
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.author_profile_id,
      'post_image',
      'post',
      NEW.id
    );
  END LOOP;

  IF NEW.image_url IS NOT NULL OR NEW.video_url IS NOT NULL THEN
    RAISE EXCEPTION 'legacy_post_media_fields_not_supported'
      USING ERRCODE = '22023';
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
       FROM unnest(
         COALESCE(NEW.distribution_channels, ARRAY[]::TEXT[])
       ) channel
       WHERE char_length(trim(channel)) NOT BETWEEN 1 AND 40
     )
     OR (
       NEW.content_payload IS NOT NULL
       AND (
         jsonb_typeof(NEW.content_payload) <> 'object'
         OR pg_column_size(NEW.content_payload) > 16384
       )
     ) THEN
    RAISE EXCEPTION 'invalid_post_structured_payload' USING ERRCODE = '22023';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.sync_post_media_asset_links
CREATE OR REPLACE FUNCTION private.sync_post_media_asset_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_asset_id UUID;
  v_index INTEGER := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'post' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.author_profile_id IS NOT DISTINCT FROM OLD.author_profile_id
     AND NEW.images IS NOT DISTINCT FROM OLD.images THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'post' AND aggregate_id = NEW.id;

  FOR v_reference IN
    SELECT value
    FROM jsonb_array_elements_text(COALESCE(NEW.images, '[]'::JSONB)) image(value)
  LOOP
    v_index := v_index + 1;
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.author_profile_id,
      'post_image'
    );
    PERFORM private.attach_media_asset_link(
      v_asset_id,
      'post',
      NEW.id,
      'image_' || v_index
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.guard_lost_found_post_write
CREATE OR REPLACE FUNCTION private.guard_lost_found_post_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_is_trusted BOOLEAN := COALESCE(auth.role(), '') = 'service_role';
  v_recent_count INTEGER;
  v_reference TEXT;
  v_reference_count INTEGER;
  v_distinct_reference_count INTEGER;
BEGIN
  IF NOT v_is_trusted THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
    END IF;

    v_actor_profile_id := private.current_active_profile_id();

    IF TG_OP = 'INSERT' THEN
      IF v_actor_profile_id IS NULL THEN
        RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
      END IF;

      NEW.autor_id := v_actor_profile_id;
      NEW.resolvido := FALSE;
      NEW.created_at := now();
      NEW.updated_at := NEW.created_at;
      NEW.contato_telefone := NULL;
      NEW.contato_email := NULL;

      IF NOT v_is_admin THEN
        IF NEW.location_id IS NULL
           OR NOT private.auth_has_verified_residence(
             v_actor_profile_id,
             NEW.location_id
           ) THEN
          RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
        END IF;

        PERFORM pg_advisory_xact_lock(
          hashtextextended('lost-found-post:' || v_actor_profile_id::TEXT, 0)
        );

        SELECT count(*)::INTEGER
        INTO v_recent_count
        FROM public.community_social_audit_log audit
        WHERE audit.actor_profile_id = v_actor_profile_id
          AND audit.target_type = 'lost_found_post'
          AND audit.action = 'insert'
          AND audit.created_at >= now() - interval '1 hour';

        IF v_recent_count >= 5 THEN
          RAISE EXCEPTION 'lost_found_post_rate_limit_exceeded'
            USING ERRCODE = 'P0001';
        END IF;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NOT v_is_admin THEN
        IF NOT private.auth_owns_active_profile(OLD.autor_id) THEN
          RAISE EXCEPTION 'lost_found_update_not_authorized'
            USING ERRCODE = '42501';
        END IF;

        IF NEW.id IS DISTINCT FROM OLD.id
           OR NEW.autor_id IS DISTINCT FROM OLD.autor_id
           OR NEW.location_id IS DISTINCT FROM OLD.location_id
           OR NEW.created_at IS DISTINCT FROM OLD.created_at
           OR NEW.contato_telefone IS DISTINCT FROM OLD.contato_telefone
           OR NEW.contato_email IS DISTINCT FROM OLD.contato_email THEN
          RAISE EXCEPTION 'lost_found_identity_is_immutable'
            USING ERRCODE = '42501';
        END IF;
      END IF;
    ELSE
      IF NOT v_is_admin
         AND NOT private.auth_owns_active_profile(OLD.autor_id) THEN
        RAISE EXCEPTION 'lost_found_delete_not_authorized'
          USING ERRCODE = '42501';
      END IF;
      RETURN OLD;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.autor_id IS DISTINCT FROM OLD.autor_id
     OR NEW.imagens IS DISTINCT FROM OLD.imagens THEN
    NEW.imagens := COALESCE(NEW.imagens, '{}'::TEXT[]);
    v_reference_count := cardinality(NEW.imagens);
    SELECT count(DISTINCT value)
    INTO v_distinct_reference_count
    FROM unnest(NEW.imagens) image(value);

    IF v_reference_count > 4 THEN
      RAISE EXCEPTION 'lost_found_image_limit_exceeded'
        USING ERRCODE = '22023';
    END IF;
    IF v_reference_count <> v_distinct_reference_count THEN
      RAISE EXCEPTION 'duplicate_lost_found_image_reference'
        USING ERRCODE = '23505';
    END IF;

    FOREACH v_reference IN ARRAY NEW.imagens LOOP
      PERFORM private.require_attachable_owned_media_asset(
        v_reference,
        NEW.autor_id,
        'post_image',
        'lost_found_post',
        NEW.id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.sync_lost_found_media_asset_links
CREATE OR REPLACE FUNCTION private.sync_lost_found_media_asset_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_asset_id UUID;
  v_index INTEGER := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'lost_found_post' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.autor_id IS NOT DISTINCT FROM OLD.autor_id
     AND NEW.imagens IS NOT DISTINCT FROM OLD.imagens THEN
    RETURN NEW;
  END IF;

  IF COALESCE(cardinality(NEW.imagens), 0) > 4 THEN
    RAISE EXCEPTION 'lost_found_image_limit_exceeded' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'lost_found_post' AND aggregate_id = NEW.id;

  FOREACH v_reference IN ARRAY COALESCE(NEW.imagens, '{}'::TEXT[]) LOOP
    v_index := v_index + 1;
    v_asset_id := private.require_attachable_owned_media_asset(
      v_reference,
      NEW.autor_id,
      'post_image',
      'lost_found_post',
      NEW.id
    );
    PERFORM private.attach_media_asset_link(
      v_asset_id,
      'lost_found_post',
      NEW.id,
      'image_' || v_index
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_sync_media_asset_links ON public.posts;

CREATE TRIGGER posts_sync_media_asset_links
  AFTER INSERT OR UPDATE OF images, author_profile_id OR DELETE
  ON public.posts
  FOR EACH ROW EXECUTE FUNCTION private.sync_post_media_asset_links();

DROP TRIGGER IF EXISTS lost_found_posts_sync_media_asset_links
  ON public.lost_found_posts;

CREATE TRIGGER lost_found_posts_sync_media_asset_links
  AFTER INSERT OR UPDATE OF imagens, autor_id OR DELETE
  ON public.lost_found_posts
  FOR EACH ROW EXECUTE FUNCTION private.sync_lost_found_media_asset_links();

DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete their post images" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

DROP POLICY IF EXISTS post_images_owner_insert ON storage.objects;

DROP POLICY IF EXISTS post_images_owner_delete ON storage.objects;

DROP FUNCTION IF EXISTS private.can_upload_owned_post_image(UUID);

REVOKE ALL ON FUNCTION private.guard_community_post_write()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.sync_post_media_asset_links()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.guard_lost_found_post_write()
  FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION private.sync_lost_found_media_asset_links()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION private.sync_post_media_asset_links() IS
  'Maintains canonical MediaAsset lifecycle links for Community post images.';

COMMENT ON FUNCTION private.sync_lost_found_media_asset_links() IS
  'Maintains canonical MediaAsset lifecycle links for lost-and-found images.';

COMMIT;
