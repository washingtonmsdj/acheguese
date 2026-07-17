-- Canonical MediaAsset storage, ownership, quotas and Review/Menu references.

BEGIN;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'media-assets',
  'media-assets',
  TRUE,
  5242880,
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Known public URLs are served by Storage. Metadata listing and browser writes
-- stay closed; only the authenticated Edge broker uses service_role.
DROP POLICY IF EXISTS media_assets_public_select ON storage.objects;
DROP POLICY IF EXISTS media_assets_authenticated_insert ON storage.objects;
DROP POLICY IF EXISTS media_assets_authenticated_update ON storage.objects;
DROP POLICY IF EXISTS media_assets_authenticated_delete ON storage.objects;

CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preset TEXT NOT NULL CHECK (preset IN (
    'user_avatar',
    'post_image',
    'business_logo',
    'business_banner',
    'business_gallery',
    'review_photo',
    'gastronomy_menu_item',
    'classified_image',
    'professional_logo',
    'professional_portfolio',
    'site_banner',
    'attachment_image'
  )),
  preset_version SMALLINT NOT NULL CHECK (preset_version = 1),
  bucket_id TEXT NOT NULL DEFAULT 'media-assets' CHECK (bucket_id = 'media-assets'),
  object_path TEXT NOT NULL UNIQUE,
  storage_reference TEXT GENERATED ALWAYS AS (
    'storage://media-assets/' || object_path
  ) STORED UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type = 'image/jpeg'),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 2400),
  height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 2200),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  state TEXT NOT NULL DEFAULT 'reserved' CHECK (
    state IN ('reserved', 'active', 'failed', 'deleting', 'deleted')
  ),
  attached_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_owner_path CHECK (
    split_part(object_path, '/', 1) = owner_profile_id::TEXT
    AND split_part(object_path, '/', 2) = preset
    AND split_part(object_path, '/', 3) = 'v' || preset_version::TEXT
    AND split_part(object_path, '/', 4) = id::TEXT || '.jpg'
    AND array_length(string_to_array(object_path, '/'), 1) = 4
  )
);

CREATE INDEX media_assets_owner_created_idx
  ON public.media_assets (owner_profile_id, preset, created_at DESC)
  WHERE state IN ('reserved', 'active');
CREATE INDEX media_assets_orphan_scan_idx
  ON public.media_assets (state, updated_at, created_at)
  WHERE state <> 'deleted';

CREATE TABLE public.media_asset_links (
  asset_id UUID PRIMARY KEY REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  aggregate_type TEXT NOT NULL CHECK (aggregate_type IN ('review', 'menu_item')),
  aggregate_id UUID NOT NULL,
  slot TEXT NOT NULL CHECK (slot ~ '^[a-z][a-z0-9_]{1,31}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aggregate_type, aggregate_id, slot)
);

CREATE INDEX media_asset_links_aggregate_idx
  ON public.media_asset_links (aggregate_type, aggregate_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_asset_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.media_assets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.media_asset_links FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.media_assets TO authenticated;
GRANT SELECT ON public.media_asset_links TO authenticated;

CREATE POLICY media_assets_owner_select
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY media_asset_links_owner_select
  ON public.media_asset_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.media_assets asset
      WHERE asset.id = media_asset_links.asset_id
        AND asset.owner_user_id = auth.uid()
    )
  );

-- security-authority: internal-function private.media_preset_daily_limit
CREATE OR REPLACE FUNCTION private.media_preset_daily_limit(p_preset TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = pg_temp
AS $$
  SELECT CASE p_preset
    WHEN 'user_avatar' THEN 10
    WHEN 'post_image' THEN 20
    WHEN 'business_logo' THEN 20
    WHEN 'business_banner' THEN 20
    WHEN 'business_gallery' THEN 40
    WHEN 'review_photo' THEN 30
    WHEN 'gastronomy_menu_item' THEN 50
    WHEN 'classified_image' THEN 40
    WHEN 'professional_logo' THEN 20
    WHEN 'professional_portfolio' THEN 40
    WHEN 'site_banner' THEN 20
    WHEN 'attachment_image' THEN 20
    ELSE 0
  END;
$$;

-- security-authority: internal-function private.media_preset_unattached_limit
CREATE OR REPLACE FUNCTION private.media_preset_unattached_limit(p_preset TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = pg_temp
AS $$
  SELECT CASE p_preset
    WHEN 'user_avatar' THEN 3
    WHEN 'post_image' THEN 20
    WHEN 'business_logo' THEN 10
    WHEN 'business_banner' THEN 10
    WHEN 'business_gallery' THEN 20
    WHEN 'review_photo' THEN 12
    WHEN 'gastronomy_menu_item' THEN 20
    WHEN 'classified_image' THEN 20
    WHEN 'professional_logo' THEN 10
    WHEN 'professional_portfolio' THEN 20
    WHEN 'site_banner' THEN 10
    WHEN 'attachment_image' THEN 10
    ELSE 0
  END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.reserve_media_asset_upload(
  p_asset_id UUID,
  p_owner_user_id UUID,
  p_owner_profile_id UUID,
  p_preset TEXT,
  p_preset_version SMALLINT,
  p_object_path TEXT,
  p_mime_type TEXT,
  p_byte_size INTEGER,
  p_width INTEGER,
  p_height INTEGER,
  p_sha256 TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_daily_count INTEGER;
  v_unattached_count INTEGER;
  v_daily_limit INTEGER := private.media_preset_daily_limit(p_preset);
  v_unattached_limit INTEGER := private.media_preset_unattached_limit(p_preset);
BEGIN
  IF p_asset_id IS NULL
     OR p_owner_user_id IS NULL
     OR p_owner_profile_id IS NULL
     OR v_daily_limit = 0
     OR v_unattached_limit = 0
     OR p_preset_version <> 1
     OR p_mime_type <> 'image/jpeg'
     OR p_object_path <> format(
       '%s/%s/v%s/%s.jpg',
       p_owner_profile_id,
       p_preset,
       p_preset_version,
       p_asset_id
     ) THEN
    RAISE EXCEPTION 'invalid_media_asset_reservation' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = p_owner_profile_id
      AND profile.user_id = p_owner_user_id
      AND profile.is_active = TRUE
      AND profile.is_suspended = FALSE
      AND profile.suspended = FALSE
  ) THEN
    RAISE EXCEPTION 'media_asset_owner_not_active' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('media_asset_upload'),
    hashtext(p_owner_profile_id::TEXT || ':' || p_preset)
  );

  SELECT count(*) INTO v_daily_count
  FROM public.media_assets asset
  WHERE asset.owner_profile_id = p_owner_profile_id
    AND asset.preset = p_preset
    AND asset.state IN ('reserved', 'active')
    AND asset.created_at >= now() - interval '24 hours';

  SELECT count(*) INTO v_unattached_count
  FROM public.media_assets asset
  WHERE asset.owner_profile_id = p_owner_profile_id
    AND asset.preset = p_preset
    AND asset.state IN ('reserved', 'active')
    AND NOT EXISTS (
      SELECT 1 FROM public.media_asset_links link WHERE link.asset_id = asset.id
    );

  IF v_daily_count >= v_daily_limit OR v_unattached_count >= v_unattached_limit THEN
    RAISE EXCEPTION 'media_asset_quota_exceeded' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.media_assets (
    id,
    owner_user_id,
    owner_profile_id,
    preset,
    preset_version,
    object_path,
    mime_type,
    byte_size,
    width,
    height,
    sha256,
    state
  ) VALUES (
    p_asset_id,
    p_owner_user_id,
    p_owner_profile_id,
    p_preset,
    p_preset_version,
    p_object_path,
    p_mime_type,
    p_byte_size,
    p_width,
    p_height,
    lower(p_sha256),
    'reserved'
  );

  RETURN p_asset_id;
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.activate_media_asset_upload(p_asset_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.media_assets
  SET state = 'active', updated_at = now()
  WHERE id = p_asset_id AND state = 'reserved';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'media_asset_reservation_not_found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.fail_media_asset_upload(p_asset_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.media_assets
  SET state = 'failed', updated_at = now()
  WHERE id = p_asset_id AND state = 'reserved';
$$;

-- security-authority: internal-function private.require_media_asset_reference
CREATE OR REPLACE FUNCTION private.require_media_asset_reference(
  p_reference TEXT,
  p_owner_profile_id UUID,
  p_preset TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  SELECT asset.id INTO v_asset_id
  FROM public.media_assets asset
  WHERE asset.storage_reference = p_reference
    AND asset.owner_profile_id = p_owner_profile_id
    AND asset.preset = p_preset
    AND asset.preset_version = 1
    AND asset.state = 'active';

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'invalid_media_asset_reference' USING ERRCODE = '22023';
  END IF;
  RETURN v_asset_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_review_media_assets()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_asset_id UUID;
BEGIN
  IF COALESCE(cardinality(NEW.photos), 0) > 6 THEN
    RAISE EXCEPTION 'review_photo_limit_exceeded' USING ERRCODE = '22023';
  END IF;

  FOREACH v_reference IN ARRAY COALESCE(NEW.photos, ARRAY[]::TEXT[]) LOOP
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.reviewer_profile_id,
      'review_photo'
    );
    IF EXISTS (
      SELECT 1 FROM public.media_asset_links link
      WHERE link.asset_id = v_asset_id
        AND NOT (
          link.aggregate_type = 'review'
          AND link.aggregate_id = NEW.id
        )
    ) THEN
      RAISE EXCEPTION 'media_asset_already_attached' USING ERRCODE = '23505';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_review_media_asset_links()
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
    WHERE aggregate_type = 'review' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'review' AND aggregate_id = NEW.id;
  FOREACH v_reference IN ARRAY COALESCE(NEW.photos, ARRAY[]::TEXT[]) LOOP
    v_index := v_index + 1;
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.reviewer_profile_id,
      'review_photo'
    );
    INSERT INTO public.media_asset_links (asset_id, aggregate_type, aggregate_id, slot)
    VALUES (v_asset_id, 'review', NEW.id, 'photo_' || v_index);
    UPDATE public.media_assets
    SET attached_at = COALESCE(attached_at, now()), updated_at = now()
    WHERE id = v_asset_id;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_menu_item_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_owner_profile_id UUID;
  v_asset_id UUID;
BEGIN
  IF NEW.image_url IS NULL OR btrim(NEW.image_url) = '' THEN
    NEW.image_url := NULL;
    RETURN NEW;
  END IF;

  SELECT business.profile_id INTO v_owner_profile_id
  FROM public.menu_categories category
  JOIN public.menus menu ON menu.id = category.menu_id
  JOIN public.business_data business ON business.id = menu.business_id
  WHERE category.id = NEW.category_id;

  IF v_owner_profile_id IS NULL THEN
    RAISE EXCEPTION 'menu_item_owner_not_found' USING ERRCODE = '23503';
  END IF;

  v_asset_id := private.require_media_asset_reference(
    NEW.image_url,
    v_owner_profile_id,
    'gastronomy_menu_item'
  );
  IF EXISTS (
    SELECT 1 FROM public.media_asset_links link
    WHERE link.asset_id = v_asset_id
      AND NOT (
        link.aggregate_type = 'menu_item'
        AND link.aggregate_id = NEW.id
      )
  ) THEN
    RAISE EXCEPTION 'media_asset_already_attached' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_menu_item_media_asset_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_owner_profile_id UUID;
  v_asset_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'menu_item' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'menu_item' AND aggregate_id = NEW.id;
  IF NEW.image_url IS NULL THEN RETURN NEW; END IF;

  SELECT business.profile_id INTO v_owner_profile_id
  FROM public.menu_categories category
  JOIN public.menus menu ON menu.id = category.menu_id
  JOIN public.business_data business ON business.id = menu.business_id
  WHERE category.id = NEW.category_id;

  v_asset_id := private.require_media_asset_reference(
    NEW.image_url,
    v_owner_profile_id,
    'gastronomy_menu_item'
  );
  INSERT INTO public.media_asset_links (asset_id, aggregate_type, aggregate_id, slot)
  VALUES (v_asset_id, 'menu_item', NEW.id, 'primary');
  UPDATE public.media_assets
  SET attached_at = COALESCE(attached_at, now()), updated_at = now()
  WHERE id = v_asset_id;
  RETURN NEW;
END;
$$;

-- Development has no production clients. Unsafe URL-only media is removed
-- instead of preserving a second mutable contract.
UPDATE public.reviews
SET photos = ARRAY[]::TEXT[]
WHERE COALESCE(cardinality(photos), 0) > 0;

UPDATE public.menu_items
SET image_url = NULL
WHERE image_url IS NOT NULL;

DROP TRIGGER IF EXISTS reviews_guard_media_assets ON public.reviews;
CREATE TRIGGER reviews_guard_media_assets
  BEFORE INSERT OR UPDATE OF photos, reviewer_profile_id
  ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION private.guard_review_media_assets();

DROP TRIGGER IF EXISTS reviews_sync_media_asset_links ON public.reviews;
CREATE TRIGGER reviews_sync_media_asset_links
  AFTER INSERT OR UPDATE OR DELETE
  ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION private.sync_review_media_asset_links();

DROP TRIGGER IF EXISTS menu_items_guard_media_asset ON public.menu_items;
CREATE TRIGGER menu_items_guard_media_asset
  BEFORE INSERT OR UPDATE OF image_url, category_id
  ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION private.guard_menu_item_media_asset();

DROP TRIGGER IF EXISTS menu_items_sync_media_asset_link ON public.menu_items;
CREATE TRIGGER menu_items_sync_media_asset_link
  AFTER INSERT OR UPDATE OR DELETE
  ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION private.sync_menu_item_media_asset_link();

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.list_media_asset_orphans(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (id UUID, object_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT asset.id
    FROM public.media_assets asset
    WHERE (
      asset.state IN ('reserved', 'failed', 'deleting')
      AND asset.updated_at < now() - interval '1 hour'
    ) OR (
      asset.state = 'active'
      AND asset.created_at < now() - interval '24 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.media_asset_links link WHERE link.asset_id = asset.id
      )
    )
    ORDER BY asset.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
  ), claimed AS (
    UPDATE public.media_assets asset
    SET state = 'deleting', updated_at = now()
    FROM candidates
    WHERE asset.id = candidates.id
    RETURNING asset.id, asset.object_path
  )
  SELECT claimed.id, claimed.object_path FROM claimed;
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.mark_media_assets_deleted(p_asset_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.media_assets
  SET state = 'deleted', deleted_at = now(), updated_at = now()
  WHERE id = ANY(COALESCE(p_asset_ids, ARRAY[]::UUID[]))
    AND state = 'deleting';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_media_asset_upload(
  UUID, UUID, UUID, TEXT, SMALLINT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_media_asset_upload(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_media_asset_upload(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_media_asset_orphans(INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_media_assets_deleted(UUID[])
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_media_asset_upload(
  UUID, UUID, UUID, TEXT, SMALLINT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_media_asset_upload(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_media_asset_upload(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_media_asset_orphans(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_media_assets_deleted(UUID[]) TO service_role;

REVOKE ALL ON FUNCTION private.media_preset_daily_limit(TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.media_preset_unattached_limit(TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.require_media_asset_reference(TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_review_media_assets()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_review_media_asset_links()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_menu_item_media_asset()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_menu_item_media_asset_link()
  FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.media_assets IS
  'Canonical immutable metadata for server-validated media objects.';
COMMENT ON TABLE public.media_asset_links IS
  'Single aggregate attachment for each canonical MediaAsset.';
COMMENT ON FUNCTION public.reserve_media_asset_upload(
  UUID, UUID, UUID, TEXT, SMALLINT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) IS 'Service-role-only atomic MediaAsset reservation and distributed quota.';
COMMENT ON FUNCTION public.list_media_asset_orphans(INTEGER) IS
  'Service-role-only bounded orphan claim using SKIP LOCKED.';

COMMIT;
