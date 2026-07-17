-- Consolidate public image ownership for Avatar, Business, Classified,
-- Professional and Site on the canonical MediaAsset lifecycle.

BEGIN;

ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_preset_check;
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_preset_check CHECK (preset IN (
    'user_avatar',
    'post_image',
    'business_logo',
    'business_banner',
    'business_gallery',
    'review_photo',
    'gastronomy_menu_item',
    'classified_image',
    'professional_logo',
    'professional_banner',
    'professional_portfolio',
    'site_banner',
    'site_logo',
    'site_favicon',
    'attachment_image'
  ));

ALTER TABLE public.media_asset_links
  DROP CONSTRAINT IF EXISTS media_asset_links_aggregate_type_check;
ALTER TABLE public.media_asset_links
  ADD CONSTRAINT media_asset_links_aggregate_type_check CHECK (aggregate_type IN (
    'review',
    'menu_item',
    'profile_avatar',
    'business',
    'business_gallery_item',
    'classified',
    'professional',
    'banner',
    'site_setting'
  ));

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
    WHEN 'professional_banner' THEN 20
    WHEN 'professional_portfolio' THEN 40
    WHEN 'site_banner' THEN 20
    WHEN 'site_logo' THEN 10
    WHEN 'site_favicon' THEN 10
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
    WHEN 'professional_banner' THEN 10
    WHEN 'professional_portfolio' THEN 20
    WHEN 'site_banner' THEN 10
    WHEN 'site_logo' THEN 5
    WHEN 'site_favicon' THEN 5
    WHEN 'attachment_image' THEN 10
    ELSE 0
  END;
$$;

-- security-authority: internal-function private.require_attachable_owned_media_asset
CREATE OR REPLACE FUNCTION private.require_attachable_owned_media_asset(
  p_reference TEXT,
  p_owner_profile_id UUID,
  p_preset TEXT,
  p_aggregate_type TEXT,
  p_aggregate_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  v_asset_id := private.require_media_asset_reference(
    p_reference,
    p_owner_profile_id,
    p_preset
  );

  IF EXISTS (
    SELECT 1
    FROM public.media_asset_links link
    WHERE link.asset_id = v_asset_id
      AND NOT (
        link.aggregate_type = p_aggregate_type
        AND link.aggregate_id = p_aggregate_id
      )
  ) THEN
    RAISE EXCEPTION 'media_asset_already_attached' USING ERRCODE = '23505';
  END IF;

  RETURN v_asset_id;
END;
$$;

-- Site assets are owned by the uploading admin Profile, while their aggregate
-- has no natural Profile owner. Existing attachments may be edited by another
-- authorized admin without transferring asset ownership.
-- security-authority: internal-function private.require_attachable_actor_media_asset
CREATE OR REPLACE FUNCTION private.require_attachable_actor_media_asset(
  p_reference TEXT,
  p_actor_user_id UUID,
  p_preset TEXT,
  p_aggregate_type TEXT,
  p_aggregate_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
  v_owner_user_id UUID;
BEGIN
  SELECT asset.id, asset.owner_user_id
  INTO v_asset_id, v_owner_user_id
  FROM public.media_assets asset
  WHERE asset.storage_reference = p_reference
    AND asset.preset = p_preset
    AND asset.preset_version = 1
    AND asset.state = 'active';

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'invalid_media_asset_reference' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.media_asset_links link
    WHERE link.asset_id = v_asset_id
      AND link.aggregate_type = p_aggregate_type
      AND link.aggregate_id = p_aggregate_id
  ) THEN
    RETURN v_asset_id;
  END IF;

  IF p_actor_user_id IS NULL OR v_owner_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'media_asset_actor_mismatch' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.media_asset_links link WHERE link.asset_id = v_asset_id
  ) THEN
    RAISE EXCEPTION 'media_asset_already_attached' USING ERRCODE = '23505';
  END IF;

  RETURN v_asset_id;
END;
$$;

-- security-authority: internal-function private.attach_media_asset_link
CREATE OR REPLACE FUNCTION private.attach_media_asset_link(
  p_asset_id UUID,
  p_aggregate_type TEXT,
  p_aggregate_id UUID,
  p_slot TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.media_asset_links (
    asset_id,
    aggregate_type,
    aggregate_id,
    slot
  ) VALUES (
    p_asset_id,
    p_aggregate_type,
    p_aggregate_id,
    p_slot
  );

  UPDATE public.media_assets
  SET attached_at = COALESCE(attached_at, now()), updated_at = now()
  WHERE id = p_asset_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_profile_avatar_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.avatar_url IS NULL OR btrim(NEW.avatar_url) = '' THEN
    NEW.avatar_url := NULL;
    RETURN NEW;
  END IF;

  PERFORM private.require_attachable_owned_media_asset(
    NEW.avatar_url,
    NEW.id,
    'user_avatar',
    'profile_avatar',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_profile_avatar_media_asset_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'profile_avatar' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'profile_avatar' AND aggregate_id = NEW.id;

  IF NEW.avatar_url IS NULL THEN RETURN NEW; END IF;
  v_asset_id := private.require_media_asset_reference(
    NEW.avatar_url,
    NEW.id,
    'user_avatar'
  );
  PERFORM private.attach_media_asset_link(
    v_asset_id,
    'profile_avatar',
    NEW.id,
    'primary'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_business_media_assets()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id
     AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata THEN
    RETURN NEW;
  END IF;

  NEW.metadata := COALESCE(NEW.metadata, '{}'::JSONB);
  IF jsonb_typeof(NEW.metadata) <> 'object' THEN
    RAISE EXCEPTION 'business_metadata_must_be_object' USING ERRCODE = '22023';
  END IF;

  IF NEW.metadata ?| ARRAY['fotos', 'photos', 'gallery', 'gallery_images'] THEN
    RAISE EXCEPTION 'business_gallery_must_use_business_gallery' USING ERRCODE = '22023';
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'logo_url'), '');
  IF v_reference IS NULL THEN
    NEW.metadata := NEW.metadata - 'logo_url';
  ELSE
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.profile_id,
      'business_logo',
      'business',
      NEW.id
    );
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'banner_url'), '');
  IF v_reference IS NULL THEN
    NEW.metadata := NEW.metadata - 'banner_url';
  ELSE
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.profile_id,
      'business_banner',
      'business',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_business_media_asset_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_asset_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'business' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id
     AND NEW.metadata IS NOT DISTINCT FROM OLD.metadata THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'business' AND aggregate_id = NEW.id;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'logo_url'), '');
  IF v_reference IS NOT NULL THEN
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.profile_id,
      'business_logo'
    );
    PERFORM private.attach_media_asset_link(v_asset_id, 'business', NEW.id, 'logo');
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'banner_url'), '');
  IF v_reference IS NOT NULL THEN
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.profile_id,
      'business_banner'
    );
    PERFORM private.attach_media_asset_link(v_asset_id, 'business', NEW.id, 'banner');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_business_gallery_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_owner_profile_id UUID;
  v_gallery_count INTEGER;
BEGIN
  SELECT business.profile_id INTO v_owner_profile_id
  FROM public.business_data business
  WHERE business.id = NEW.business_id;

  IF v_owner_profile_id IS NULL THEN
    RAISE EXCEPTION 'business_gallery_owner_not_found' USING ERRCODE = '23503';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('business_gallery_limit'),
    hashtext(NEW.business_id::TEXT)
  );
  SELECT count(*) INTO v_gallery_count
  FROM public.business_gallery gallery
  WHERE gallery.business_id = NEW.business_id
    AND gallery.id <> NEW.id;
  IF v_gallery_count >= 20 THEN
    RAISE EXCEPTION 'business_gallery_limit_exceeded' USING ERRCODE = '22023';
  END IF;

  PERFORM private.require_attachable_owned_media_asset(
    NEW.image_url,
    v_owner_profile_id,
    'business_gallery',
    'business_gallery_item',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_business_gallery_media_asset_link()
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
    WHERE aggregate_type = 'business_gallery_item' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT business.profile_id INTO v_owner_profile_id
  FROM public.business_data business
  WHERE business.id = NEW.business_id;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'business_gallery_item' AND aggregate_id = NEW.id;
  v_asset_id := private.require_media_asset_reference(
    NEW.image_url,
    v_owner_profile_id,
    'business_gallery'
  );
  PERFORM private.attach_media_asset_link(
    v_asset_id,
    'business_gallery_item',
    NEW.id,
    'primary'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_classified_media_assets()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_count INTEGER;
  v_distinct_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.seller_id IS NOT DISTINCT FROM OLD.seller_id
     AND NEW.photos IS NOT DISTINCT FROM OLD.photos THEN
    RETURN NEW;
  END IF;

  NEW.photos := COALESCE(NEW.photos, '[]'::JSONB);
  IF jsonb_typeof(NEW.photos) <> 'array' THEN
    RAISE EXCEPTION 'classified_photos_must_be_array' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(NEW.photos) item
    WHERE jsonb_typeof(item) <> 'string'
  ) THEN
    RAISE EXCEPTION 'classified_photo_must_be_reference' USING ERRCODE = '22023';
  END IF;

  SELECT count(*), count(DISTINCT value)
  INTO v_count, v_distinct_count
  FROM jsonb_array_elements_text(NEW.photos) value;
  IF v_count > 10 THEN
    RAISE EXCEPTION 'classified_photo_limit_exceeded' USING ERRCODE = '22023';
  END IF;
  IF v_count <> v_distinct_count THEN
    RAISE EXCEPTION 'classified_photo_duplicate' USING ERRCODE = '22023';
  END IF;

  FOR v_reference IN
    SELECT value FROM jsonb_array_elements_text(NEW.photos) value
  LOOP
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.seller_id,
      'classified_image',
      'classified',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_classified_media_asset_links()
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
    WHERE aggregate_type = 'classified' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.seller_id IS NOT DISTINCT FROM OLD.seller_id
     AND NEW.photos IS NOT DISTINCT FROM OLD.photos THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'classified' AND aggregate_id = NEW.id;
  FOR v_reference IN
    SELECT value FROM jsonb_array_elements_text(COALESCE(NEW.photos, '[]'::JSONB)) value
  LOOP
    v_index := v_index + 1;
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.seller_id,
      'classified_image'
    );
    PERFORM private.attach_media_asset_link(
      v_asset_id,
      'classified',
      NEW.id,
      'photo_' || v_index
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_professional_media_assets()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_item JSONB;
  v_count INTEGER;
  v_distinct_count INTEGER;
  v_cover_count INTEGER;
BEGIN
  NEW.metadata := COALESCE(NEW.metadata, '{}'::JSONB);
  NEW.portfolio_items := COALESCE(NEW.portfolio_items, '[]'::JSONB);
  IF jsonb_typeof(NEW.metadata) <> 'object' THEN
    RAISE EXCEPTION 'professional_metadata_must_be_object' USING ERRCODE = '22023';
  END IF;
  IF NEW.metadata ? 'portfolio_images' THEN
    RAISE EXCEPTION 'professional_portfolio_must_use_portfolio_items' USING ERRCODE = '22023';
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'logo_url'), '');
  IF v_reference IS NULL THEN
    NEW.metadata := NEW.metadata - 'logo_url';
  ELSE
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.profile_id,
      'professional_logo',
      'professional',
      NEW.id
    );
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'banner_url'), '');
  IF v_reference IS NULL THEN
    NEW.metadata := NEW.metadata - 'banner_url';
  ELSE
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.profile_id,
      'professional_banner',
      'professional',
      NEW.id
    );
  END IF;

  IF jsonb_typeof(NEW.portfolio_items) <> 'array' THEN
    RAISE EXCEPTION 'professional_portfolio_must_be_array' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(NEW.portfolio_items) > 10 THEN
    RAISE EXCEPTION 'professional_portfolio_limit_exceeded' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(NEW.portfolio_items) value
  LOOP
    IF jsonb_typeof(v_item) <> 'object'
       OR (v_item - ARRAY['url', 'caption', 'media_type', 'is_cover']) <> '{}'::JSONB
       OR jsonb_typeof(v_item -> 'url') <> 'string'
       OR (v_item ? 'caption' AND jsonb_typeof(v_item -> 'caption') <> 'string')
       OR length(COALESCE(v_item ->> 'caption', '')) > 240
       OR (v_item ? 'media_type' AND v_item ->> 'media_type' <> 'image')
       OR (v_item ? 'is_cover' AND jsonb_typeof(v_item -> 'is_cover') <> 'boolean') THEN
      RAISE EXCEPTION 'invalid_professional_portfolio_item' USING ERRCODE = '22023';
    END IF;

    v_reference := v_item ->> 'url';
    PERFORM private.require_attachable_owned_media_asset(
      v_reference,
      NEW.profile_id,
      'professional_portfolio',
      'professional',
      NEW.id
    );
  END LOOP;

  SELECT count(*), count(DISTINCT item ->> 'url'),
         count(*) FILTER (WHERE item ->> 'is_cover' = 'true')
  INTO v_count, v_distinct_count, v_cover_count
  FROM jsonb_array_elements(NEW.portfolio_items) item;
  IF v_count <> v_distinct_count THEN
    RAISE EXCEPTION 'professional_portfolio_duplicate' USING ERRCODE = '22023';
  END IF;
  IF v_cover_count > 1 THEN
    RAISE EXCEPTION 'professional_portfolio_multiple_covers' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_professional_media_asset_links()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_item JSONB;
  v_asset_id UUID;
  v_index INTEGER := 0;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'professional' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'professional' AND aggregate_id = NEW.id;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'logo_url'), '');
  IF v_reference IS NOT NULL THEN
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.profile_id,
      'professional_logo'
    );
    PERFORM private.attach_media_asset_link(v_asset_id, 'professional', NEW.id, 'logo');
  END IF;

  v_reference := NULLIF(btrim(NEW.metadata ->> 'banner_url'), '');
  IF v_reference IS NOT NULL THEN
    v_asset_id := private.require_media_asset_reference(
      v_reference,
      NEW.profile_id,
      'professional_banner'
    );
    PERFORM private.attach_media_asset_link(v_asset_id, 'professional', NEW.id, 'banner');
  END IF;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(COALESCE(NEW.portfolio_items, '[]'::JSONB)) value
  LOOP
    v_index := v_index + 1;
    v_asset_id := private.require_media_asset_reference(
      v_item ->> 'url',
      NEW.profile_id,
      'professional_portfolio'
    );
    PERFORM private.attach_media_asset_link(
      v_asset_id,
      'professional',
      NEW.id,
      'portfolio_' || v_index
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_banner_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.image_url IS NULL OR btrim(NEW.image_url) = '' THEN
    RAISE EXCEPTION 'banner_image_required' USING ERRCODE = '23502';
  END IF;
  PERFORM private.require_attachable_actor_media_asset(
    NEW.image_url,
    auth.uid(),
    'site_banner',
    'banner',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_banner_media_asset_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'banner' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'banner' AND aggregate_id = NEW.id;
  SELECT asset.id INTO v_asset_id
  FROM public.media_assets asset
  WHERE asset.storage_reference = NEW.image_url
    AND asset.preset = 'site_banner'
    AND asset.preset_version = 1
    AND asset.state = 'active';
  PERFORM private.attach_media_asset_link(v_asset_id, 'banner', NEW.id, 'primary');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_site_setting_media_asset()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_preset TEXT;
BEGIN
  v_preset := CASE NEW.key
    WHEN 'logo_url' THEN 'site_logo'
    WHEN 'logo_mobile_url' THEN 'site_logo'
    WHEN 'favicon_url' THEN 'site_favicon'
    ELSE NULL
  END;
  IF v_preset IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.key IS NOT DISTINCT FROM OLD.key
     AND NEW.value IS NOT DISTINCT FROM OLD.value THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.value) <> 'string' THEN
    RAISE EXCEPTION 'site_media_setting_must_be_string' USING ERRCODE = '22023';
  END IF;
  v_reference := NULLIF(btrim(NEW.value #>> '{}'), '');
  IF v_reference IS NULL THEN
    NEW.value := '""'::JSONB;
    RETURN NEW;
  END IF;

  PERFORM private.require_attachable_actor_media_asset(
    v_reference,
    NEW.updated_by,
    v_preset,
    'site_setting',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_site_setting_media_asset_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_reference TEXT;
  v_preset TEXT;
  v_asset_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.media_asset_links
    WHERE aggregate_type = 'site_setting' AND aggregate_id = OLD.id;
    RETURN OLD;
  END IF;

  v_preset := CASE NEW.key
    WHEN 'logo_url' THEN 'site_logo'
    WHEN 'logo_mobile_url' THEN 'site_logo'
    WHEN 'favicon_url' THEN 'site_favicon'
    ELSE NULL
  END;
  IF v_preset IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.key IS NOT DISTINCT FROM OLD.key
     AND NEW.value IS NOT DISTINCT FROM OLD.value THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.media_asset_links
  WHERE aggregate_type = 'site_setting' AND aggregate_id = NEW.id;
  v_reference := NULLIF(btrim(NEW.value #>> '{}'), '');
  IF v_reference IS NULL THEN RETURN NEW; END IF;

  SELECT asset.id INTO v_asset_id
  FROM public.media_assets asset
  WHERE asset.storage_reference = v_reference
    AND asset.preset = v_preset
    AND asset.preset_version = 1
    AND asset.state = 'active';
  PERFORM private.attach_media_asset_link(
    v_asset_id,
    'site_setting',
    NEW.id,
    CASE WHEN NEW.key = 'favicon_url' THEN 'favicon' ELSE NEW.key END
  );
  RETURN NEW;
END;
$$;

-- Existing values are intentionally preserved. This migration only enforces
-- canonical references on future writes to the media fields below. A separate,
-- explicitly approved backfill/cutover may remove legacy values after the
-- read-only CP-016 audit proves the data can be migrated without loss.

DROP TRIGGER IF EXISTS profiles_guard_avatar_media_asset ON public.profiles;
CREATE TRIGGER profiles_guard_avatar_media_asset
  BEFORE INSERT OR UPDATE OF avatar_url, id
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.guard_profile_avatar_media_asset();

DROP TRIGGER IF EXISTS profiles_sync_avatar_media_asset_link ON public.profiles;
CREATE TRIGGER profiles_sync_avatar_media_asset_link
  AFTER INSERT OR UPDATE OF avatar_url, id OR DELETE
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.sync_profile_avatar_media_asset_link();

DROP TRIGGER IF EXISTS business_data_guard_media_assets ON public.business_data;
CREATE TRIGGER business_data_guard_media_assets
  BEFORE INSERT OR UPDATE OF metadata, profile_id
  ON public.business_data
  FOR EACH ROW EXECUTE FUNCTION private.guard_business_media_assets();

DROP TRIGGER IF EXISTS business_data_sync_media_asset_links ON public.business_data;
CREATE TRIGGER business_data_sync_media_asset_links
  AFTER INSERT OR UPDATE OF metadata, profile_id OR DELETE
  ON public.business_data
  FOR EACH ROW EXECUTE FUNCTION private.sync_business_media_asset_links();

DROP TRIGGER IF EXISTS business_gallery_guard_media_asset ON public.business_gallery;
CREATE TRIGGER business_gallery_guard_media_asset
  BEFORE INSERT OR UPDATE OF image_url, business_id
  ON public.business_gallery
  FOR EACH ROW EXECUTE FUNCTION private.guard_business_gallery_media_asset();

DROP TRIGGER IF EXISTS business_gallery_sync_media_asset_link ON public.business_gallery;
CREATE TRIGGER business_gallery_sync_media_asset_link
  AFTER INSERT OR UPDATE OF image_url, business_id OR DELETE
  ON public.business_gallery
  FOR EACH ROW EXECUTE FUNCTION private.sync_business_gallery_media_asset_link();

DROP TRIGGER IF EXISTS classifieds_guard_media_assets ON public.classifieds;
CREATE TRIGGER classifieds_guard_media_assets
  BEFORE INSERT OR UPDATE OF photos, seller_id
  ON public.classifieds
  FOR EACH ROW EXECUTE FUNCTION private.guard_classified_media_assets();

DROP TRIGGER IF EXISTS classifieds_sync_media_asset_links ON public.classifieds;
CREATE TRIGGER classifieds_sync_media_asset_links
  AFTER INSERT OR UPDATE OF photos, seller_id OR DELETE
  ON public.classifieds
  FOR EACH ROW EXECUTE FUNCTION private.sync_classified_media_asset_links();

DROP TRIGGER IF EXISTS professional_data_guard_media_assets ON public.professional_data;
CREATE TRIGGER professional_data_guard_media_assets
  BEFORE INSERT OR UPDATE OF metadata, portfolio_items, profile_id
  ON public.professional_data
  FOR EACH ROW EXECUTE FUNCTION private.guard_professional_media_assets();

DROP TRIGGER IF EXISTS professional_data_sync_media_asset_links ON public.professional_data;
CREATE TRIGGER professional_data_sync_media_asset_links
  AFTER INSERT OR UPDATE OF metadata, portfolio_items, profile_id OR DELETE
  ON public.professional_data
  FOR EACH ROW EXECUTE FUNCTION private.sync_professional_media_asset_links();

DROP TRIGGER IF EXISTS banners_guard_media_asset ON public.banners;
CREATE TRIGGER banners_guard_media_asset
  BEFORE INSERT OR UPDATE OF image_url
  ON public.banners
  FOR EACH ROW EXECUTE FUNCTION private.guard_banner_media_asset();

DROP TRIGGER IF EXISTS banners_sync_media_asset_link ON public.banners;
CREATE TRIGGER banners_sync_media_asset_link
  AFTER INSERT OR UPDATE OF image_url OR DELETE
  ON public.banners
  FOR EACH ROW EXECUTE FUNCTION private.sync_banner_media_asset_link();

DROP TRIGGER IF EXISTS site_settings_guard_media_asset ON public.site_settings;
CREATE TRIGGER site_settings_guard_media_asset
  BEFORE INSERT OR UPDATE OF key, value, updated_by
  ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION private.guard_site_setting_media_asset();

DROP TRIGGER IF EXISTS site_settings_sync_media_asset_link ON public.site_settings;
CREATE TRIGGER site_settings_sync_media_asset_link
  AFTER INSERT OR UPDATE OF key, value, updated_by OR DELETE
  ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION private.sync_site_setting_media_asset_link();

REVOKE ALL ON FUNCTION private.require_attachable_owned_media_asset(
  TEXT, UUID, TEXT, TEXT, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.require_attachable_actor_media_asset(
  TEXT, UUID, TEXT, TEXT, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.attach_media_asset_link(UUID, TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_profile_avatar_media_asset()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_profile_avatar_media_asset_link()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_business_media_assets()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_business_media_asset_links()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_business_gallery_media_asset()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_business_gallery_media_asset_link()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_classified_media_assets()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_classified_media_asset_links()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_professional_media_assets()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_professional_media_asset_links()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_banner_media_asset()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_banner_media_asset_link()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.guard_site_setting_media_asset()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_site_setting_media_asset_link()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION private.require_attachable_owned_media_asset(
  TEXT, UUID, TEXT, TEXT, UUID
) IS 'Validates canonical owner, preset, lifecycle state and single aggregate attachment.';
COMMENT ON FUNCTION private.require_attachable_actor_media_asset(
  TEXT, UUID, TEXT, TEXT, UUID
) IS 'Validates site media against the authenticated uploader or its existing aggregate link.';

COMMIT;
