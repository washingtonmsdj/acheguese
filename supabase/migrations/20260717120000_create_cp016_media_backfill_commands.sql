-- Temporary, service-role-only commands for the bounded CP-016 media backfill.
-- Raw source URLs are never persisted; only a SHA-256 provenance hash is kept.

BEGIN;

CREATE TABLE IF NOT EXISTS private.media_asset_migration_audit (
  migration_key TEXT NOT NULL CHECK (migration_key = 'CP-016'),
  domain TEXT NOT NULL CHECK (
    domain IN ('business', 'classified', 'site_setting')
  ),
  aggregate_id UUID NOT NULL,
  slot TEXT NOT NULL CHECK (slot ~ '^[a-z][a-z0-9_]{1,31}$'),
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('unsplash', 'legacy_supabase_storage')
  ),
  source_sha256 TEXT NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  disposition TEXT NOT NULL DEFAULT 'migrated' CHECK (
    disposition IN ('migrated', 'dropped')
  ),
  rejection_reason TEXT CHECK (rejection_reason IN ('http_404')),
  asset_id UUID REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attached_at TIMESTAMPTZ,
  PRIMARY KEY (migration_key, domain, aggregate_id, slot),
  UNIQUE (asset_id),
  CHECK (
    (
      disposition = 'migrated'
      AND asset_id IS NOT NULL
      AND rejection_reason IS NULL
    )
    OR (
      disposition = 'dropped'
      AND asset_id IS NULL
      AND rejection_reason = 'http_404'
    )
  )
);

REVOKE ALL ON TABLE private.media_asset_migration_audit
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.cp016_legacy_source_matches
CREATE OR REPLACE FUNCTION private.cp016_legacy_source_matches(
  p_domain TEXT,
  p_aggregate_id UUID,
  p_preset TEXT,
  p_source_kind TEXT,
  p_source_sha256 TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
  v_matches BOOLEAN := FALSE;
BEGIN
  IF p_domain = 'business' THEN
    IF p_preset = 'business_logo' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.business_data business
        WHERE business.id = p_aggregate_id
          AND encode(
            extensions.digest(
              convert_to(COALESCE(business.metadata ->> 'logo_url', ''), 'UTF8'),
              'sha256'
            ),
            'hex'
          ) = lower(p_source_sha256)
          AND CASE p_source_kind
            WHEN 'unsplash' THEN
              business.metadata ->> 'logo_url'
                ~* '^https://(images|source)\.unsplash\.com/'
            WHEN 'legacy_supabase_storage' THEN
              business.metadata ->> 'logo_url'
                ~* '^https://[^/]+/storage/v1/object/public/'
            ELSE FALSE
          END
      ) INTO v_matches;
    ELSIF p_preset = 'business_banner' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.business_data business
        WHERE business.id = p_aggregate_id
          AND encode(
            extensions.digest(
              convert_to(COALESCE(business.metadata ->> 'banner_url', ''), 'UTF8'),
              'sha256'
            ),
            'hex'
          ) = lower(p_source_sha256)
          AND CASE p_source_kind
            WHEN 'unsplash' THEN
              business.metadata ->> 'banner_url'
                ~* '^https://(images|source)\.unsplash\.com/'
            WHEN 'legacy_supabase_storage' THEN
              business.metadata ->> 'banner_url'
                ~* '^https://[^/]+/storage/v1/object/public/'
            ELSE FALSE
          END
      ) INTO v_matches;
    ELSIF p_preset = 'business_gallery' THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.business_data business
        CROSS JOIN LATERAL unnest(ARRAY[
          'fotos', 'photos', 'gallery', 'gallery_images'
        ]::TEXT[]) media_key(key_name)
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(business.metadata -> media_key.key_name) = 'array'
              THEN business.metadata -> media_key.key_name
            ELSE jsonb_build_array(business.metadata -> media_key.key_name)
          END
        ) source(value)
        WHERE business.id = p_aggregate_id
          AND jsonb_typeof(source.value) = 'string'
          AND encode(
            extensions.digest(
              convert_to(source.value #>> '{}', 'UTF8'),
              'sha256'
            ),
            'hex'
          ) = lower(p_source_sha256)
          AND CASE p_source_kind
            WHEN 'unsplash' THEN
              source.value #>> '{}' ~* '^https://(images|source)\.unsplash\.com/'
            WHEN 'legacy_supabase_storage' THEN
              source.value #>> '{}'
                ~* '^https://[^/]+/storage/v1/object/public/'
            ELSE FALSE
          END
      ) INTO v_matches;
    END IF;
  ELSIF p_domain = 'classified' AND p_preset = 'classified_image' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.classifieds classified
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(classified.photos) = 'array'
            THEN classified.photos
          ELSE '[]'::JSONB
        END
      ) source(value)
      WHERE classified.id = p_aggregate_id
        AND jsonb_typeof(source.value) = 'string'
        AND encode(
          extensions.digest(
            convert_to(source.value #>> '{}', 'UTF8'),
            'sha256'
          ),
          'hex'
        ) = lower(p_source_sha256)
        AND CASE p_source_kind
          WHEN 'unsplash' THEN
            source.value #>> '{}' ~* '^https://(images|source)\.unsplash\.com/'
          WHEN 'legacy_supabase_storage' THEN
            source.value #>> '{}'
              ~* '^https://[^/]+/storage/v1/object/public/'
          ELSE FALSE
        END
    ) INTO v_matches;
  ELSIF p_domain = 'site_setting'
        AND p_preset IN ('site_logo', 'site_favicon') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.site_settings setting
      WHERE setting.id = p_aggregate_id
        AND encode(
          extensions.digest(
            convert_to(COALESCE(setting.value #>> '{}', ''), 'UTF8'),
            'sha256'
          ),
          'hex'
        ) = lower(p_source_sha256)
        AND CASE p_source_kind
          WHEN 'unsplash' THEN
            setting.value #>> '{}' ~* '^https://(images|source)\.unsplash\.com/'
          WHEN 'legacy_supabase_storage' THEN
            setting.value #>> '{}'
              ~* '^https://[^/]+/storage/v1/object/public/'
          ELSE FALSE
        END
    ) INTO v_matches;
  END IF;

  RETURN COALESCE(v_matches, FALSE);
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.reserve_cp016_media_asset_backfill(
  p_domain TEXT,
  p_aggregate_id UUID,
  p_slot TEXT,
  p_source_kind TEXT,
  p_source_sha256 TEXT,
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
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
  v_existing_asset_id UUID;
  v_existing_source_kind TEXT;
  v_existing_source_sha256 TEXT;
  v_existing_state TEXT;
BEGIN
  IF p_domain IS NULL
     OR p_aggregate_id IS NULL
     OR p_slot IS NULL
     OR p_source_kind NOT IN ('unsplash', 'legacy_supabase_storage')
     OR p_source_sha256 !~ '^[0-9a-f]{64}$'
     OR p_asset_id IS NULL
     OR p_owner_user_id IS NULL
     OR p_owner_profile_id IS NULL
     OR p_preset_version <> 1
     OR p_mime_type <> 'image/jpeg'
     OR p_sha256 !~ '^[0-9a-f]{64}$'
     OR p_object_path <> format(
       '%s/%s/v%s/%s.jpg',
       p_owner_profile_id,
       p_preset,
       p_preset_version,
       p_asset_id
     ) THEN
    RAISE EXCEPTION 'invalid_cp016_backfill_reservation'
      USING ERRCODE = '22023';
  END IF;

  IF NOT (
    (
      p_domain = 'business'
      AND (
        (p_slot = 'logo' AND p_preset = 'business_logo')
        OR (p_slot = 'banner' AND p_preset = 'business_banner')
        OR (
          p_slot ~ '^gallery_([1-9]|1[0-9]|20)$'
          AND p_preset = 'business_gallery'
        )
      )
      AND EXISTS (
        SELECT 1
        FROM public.business_data business
        WHERE business.id = p_aggregate_id
          AND business.profile_id = p_owner_profile_id
      )
    )
    OR (
      p_domain = 'classified'
      AND p_slot ~ '^photo_([1-9]|10)$'
      AND p_preset = 'classified_image'
      AND EXISTS (
        SELECT 1
        FROM public.classifieds classified
        WHERE classified.id = p_aggregate_id
          AND classified.seller_id = p_owner_profile_id
      )
    )
    OR (
      p_domain = 'site_setting'
      AND p_slot = 'primary'
      AND p_preset IN ('site_logo', 'site_favicon')
      AND EXISTS (
        SELECT 1
        FROM public.site_settings setting
        JOIN public.profiles profile
          ON profile.id = p_owner_profile_id
         AND profile.user_id = p_owner_user_id
        WHERE setting.id = p_aggregate_id
          AND setting.updated_by = p_owner_user_id
          AND (
            (setting.key IN ('logo_url', 'logo_mobile_url')
              AND p_preset = 'site_logo')
            OR (setting.key = 'favicon_url' AND p_preset = 'site_favicon')
          )
      )
    )
  ) THEN
    RAISE EXCEPTION 'cp016_backfill_owner_or_slot_mismatch'
      USING ERRCODE = '42501';
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
    RAISE EXCEPTION 'cp016_backfill_owner_not_active'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.cp016_legacy_source_matches(
    p_domain,
    p_aggregate_id,
    p_preset,
    p_source_kind,
    lower(p_source_sha256)
  ) THEN
    RAISE EXCEPTION 'cp016_backfill_source_mismatch'
      USING ERRCODE = '40001';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('cp016_media_backfill'),
    hashtext(p_domain || ':' || p_aggregate_id::TEXT || ':' || p_slot)
  );

  SELECT
    audit.asset_id,
    audit.source_kind,
    audit.source_sha256,
    asset.state
  INTO
    v_existing_asset_id,
    v_existing_source_kind,
    v_existing_source_sha256,
    v_existing_state
  FROM private.media_asset_migration_audit audit
  JOIN public.media_assets asset ON asset.id = audit.asset_id
  WHERE audit.migration_key = 'CP-016'
    AND audit.domain = p_domain
    AND audit.aggregate_id = p_aggregate_id
    AND audit.slot = p_slot
  FOR UPDATE OF audit;

  IF v_existing_asset_id IS NOT NULL THEN
    IF v_existing_source_kind <> p_source_kind
       OR v_existing_source_sha256 <> lower(p_source_sha256) THEN
      RAISE EXCEPTION 'cp016_backfill_source_changed'
        USING ERRCODE = '40001';
    END IF;

    IF v_existing_state IN ('reserved', 'active') THEN
      RETURN v_existing_asset_id;
    END IF;

    IF v_existing_state NOT IN ('failed', 'deleted') THEN
      RAISE EXCEPTION 'cp016_backfill_asset_not_reusable'
        USING ERRCODE = '55000';
    END IF;
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

  INSERT INTO private.media_asset_migration_audit (
    migration_key,
    domain,
    aggregate_id,
    slot,
    source_kind,
    source_sha256,
    disposition,
    rejection_reason,
    asset_id
  ) VALUES (
    'CP-016',
    p_domain,
    p_aggregate_id,
    p_slot,
    p_source_kind,
    lower(p_source_sha256),
    'migrated',
    NULL,
    p_asset_id
  )
  ON CONFLICT (migration_key, domain, aggregate_id, slot)
  DO UPDATE SET
    source_kind = EXCLUDED.source_kind,
    source_sha256 = EXCLUDED.source_sha256,
    disposition = 'migrated',
    rejection_reason = NULL,
    asset_id = EXCLUDED.asset_id,
    created_at = now(),
    attached_at = NULL;

  RETURN p_asset_id;
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.reject_cp016_media_asset_backfill(
  p_domain TEXT,
  p_aggregate_id UUID,
  p_slot TEXT,
  p_preset TEXT,
  p_source_kind TEXT,
  p_source_sha256 TEXT,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
  v_existing_asset_id UUID;
  v_existing_source_kind TEXT;
  v_existing_source_sha256 TEXT;
  v_existing_state TEXT;
BEGIN
  IF p_reason <> 'http_404'
     OR p_source_kind <> 'unsplash'
     OR p_source_sha256 !~ '^[0-9a-f]{64}$'
     OR NOT (
       (
         p_domain = 'business'
         AND (
           (p_slot = 'logo' AND p_preset = 'business_logo')
           OR (p_slot = 'banner' AND p_preset = 'business_banner')
           OR (
             p_slot ~ '^gallery_([1-9]|1[0-9]|20)$'
             AND p_preset = 'business_gallery'
           )
         )
       )
       OR (
         p_domain = 'classified'
         AND p_slot ~ '^photo_([1-9]|10)$'
         AND p_preset = 'classified_image'
       )
       OR (
         p_domain = 'site_setting'
         AND p_slot = 'primary'
         AND p_preset IN ('site_logo', 'site_favicon')
       )
     ) THEN
    RAISE EXCEPTION 'invalid_cp016_backfill_rejection'
      USING ERRCODE = '22023';
  END IF;

  IF NOT private.cp016_legacy_source_matches(
    p_domain,
    p_aggregate_id,
    p_preset,
    p_source_kind,
    lower(p_source_sha256)
  ) THEN
    RAISE EXCEPTION 'cp016_backfill_rejection_source_mismatch'
      USING ERRCODE = '40001';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext('cp016_media_backfill'),
    hashtext(p_domain || ':' || p_aggregate_id::TEXT || ':' || p_slot)
  );

  SELECT
    audit.asset_id,
    audit.source_kind,
    audit.source_sha256,
    asset.state
  INTO
    v_existing_asset_id,
    v_existing_source_kind,
    v_existing_source_sha256,
    v_existing_state
  FROM private.media_asset_migration_audit audit
  LEFT JOIN public.media_assets asset ON asset.id = audit.asset_id
  WHERE audit.migration_key = 'CP-016'
    AND audit.domain = p_domain
    AND audit.aggregate_id = p_aggregate_id
    AND audit.slot = p_slot
  FOR UPDATE OF audit;

  IF v_existing_source_sha256 IS NOT NULL THEN
    IF v_existing_source_kind <> p_source_kind
       OR v_existing_source_sha256 <> lower(p_source_sha256) THEN
      RAISE EXCEPTION 'cp016_backfill_rejection_source_changed'
        USING ERRCODE = '40001';
    END IF;
    IF v_existing_asset_id IS NOT NULL
       AND v_existing_state IN ('reserved', 'active') THEN
      RAISE EXCEPTION 'cp016_backfill_active_asset_cannot_be_rejected'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  INSERT INTO private.media_asset_migration_audit (
    migration_key,
    domain,
    aggregate_id,
    slot,
    source_kind,
    source_sha256,
    disposition,
    rejection_reason,
    asset_id
  ) VALUES (
    'CP-016',
    p_domain,
    p_aggregate_id,
    p_slot,
    p_source_kind,
    lower(p_source_sha256),
    'dropped',
    'http_404',
    NULL
  )
  ON CONFLICT (migration_key, domain, aggregate_id, slot)
  DO UPDATE SET
    disposition = 'dropped',
    rejection_reason = 'http_404',
    asset_id = NULL,
    created_at = now(),
    attached_at = NULL;
END;
$$;

-- security-authority: internal-function private.require_cp016_backfill_rejection
CREATE OR REPLACE FUNCTION private.require_cp016_backfill_rejection(
  p_domain TEXT,
  p_aggregate_id UUID,
  p_slot TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = private, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM private.media_asset_migration_audit audit
    WHERE audit.migration_key = 'CP-016'
      AND audit.domain = p_domain
      AND audit.aggregate_id = p_aggregate_id
      AND audit.slot = p_slot
      AND audit.disposition = 'dropped'
      AND audit.rejection_reason = 'http_404'
      AND audit.asset_id IS NULL
  ) THEN
    RAISE EXCEPTION 'missing_cp016_backfill_rejection'
      USING ERRCODE = '22023';
  END IF;
  RETURN TRUE;
END;
$$;

-- security-authority: internal-function private.require_cp016_backfill_asset
CREATE OR REPLACE FUNCTION private.require_cp016_backfill_asset(
  p_reference TEXT,
  p_domain TEXT,
  p_aggregate_id UUID,
  p_slot TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_asset_id UUID;
BEGIN
  SELECT asset.id INTO v_asset_id
  FROM private.media_asset_migration_audit audit
  JOIN public.media_assets asset ON asset.id = audit.asset_id
  WHERE audit.migration_key = 'CP-016'
    AND audit.domain = p_domain
    AND audit.aggregate_id = p_aggregate_id
    AND audit.slot = p_slot
    AND audit.disposition = 'migrated'
    AND asset.storage_reference = p_reference
    AND asset.state = 'active';

  IF v_asset_id IS NULL THEN
    RAISE EXCEPTION 'invalid_cp016_backfill_reference'
      USING ERRCODE = '22023';
  END IF;

  RETURN v_asset_id;
END;
$$;

-- security-authority: security-definer service-role-command
CREATE OR REPLACE FUNCTION public.finalize_cp016_media_asset_backfill(
  p_domain TEXT,
  p_aggregate_id UUID,
  p_expected_legacy JSONB,
  p_references JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_current JSONB;
  v_item JSONB;
  v_new_metadata JSONB;
  v_new_references JSONB := '[]'::JSONB;
  v_reference TEXT;
  v_expected_gallery_count INTEGER := 0;
  v_index INTEGER := 0;
  v_existing_order INTEGER := 0;
BEGIN
  IF p_domain = 'business' THEN
    IF jsonb_typeof(p_expected_legacy) <> 'object'
       OR jsonb_typeof(p_references) <> 'object'
       OR (p_references - ARRAY['logo', 'banner', 'gallery']) <> '{}'::JSONB
       OR jsonb_typeof(COALESCE(p_references -> 'gallery', '[]'::JSONB))
          <> 'array'
       OR (
         p_references ? 'logo'
         AND jsonb_typeof(p_references -> 'logo') NOT IN ('string', 'null')
       )
       OR (
         p_references ? 'banner'
         AND jsonb_typeof(p_references -> 'banner') NOT IN ('string', 'null')
       ) THEN
      RAISE EXCEPTION 'invalid_cp016_business_backfill_payload'
        USING ERRCODE = '22023';
    END IF;

    SELECT business.metadata INTO v_current
    FROM public.business_data business
    WHERE business.id = p_aggregate_id
    FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM p_expected_legacy THEN
      RAISE EXCEPTION 'cp016_business_changed_since_preflight'
        USING ERRCODE = '40001';
    END IF;

    SELECT count(*) INTO v_expected_gallery_count
    FROM unnest(ARRAY[
      'fotos', 'photos', 'gallery', 'gallery_images'
    ]::TEXT[]) media_key(key_name)
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(p_expected_legacy -> media_key.key_name) = 'array'
          THEN p_expected_legacy -> media_key.key_name
        WHEN p_expected_legacy ? media_key.key_name
          THEN jsonb_build_array(p_expected_legacy -> media_key.key_name)
        ELSE '[]'::JSONB
      END
    ) source(value)
    WHERE jsonb_typeof(source.value) = 'string';

    IF jsonb_array_length(COALESCE(p_references -> 'gallery', '[]'::JSONB))
       <> v_expected_gallery_count THEN
      RAISE EXCEPTION 'cp016_business_gallery_count_mismatch'
        USING ERRCODE = '22023';
    END IF;

    v_new_metadata := p_expected_legacy
      - ARRAY['logo_url', 'banner_url', 'fotos', 'photos', 'gallery', 'gallery_images'];

    v_reference := NULLIF(btrim(p_references ->> 'logo'), '');
    IF NULLIF(btrim(p_expected_legacy ->> 'logo_url'), '') IS NOT NULL
       AND v_reference IS NULL THEN
      RAISE EXCEPTION 'cp016_business_logo_missing'
        USING ERRCODE = '22023';
    END IF;
    IF v_reference IS NOT NULL THEN
      PERFORM private.require_cp016_backfill_asset(
        v_reference,
        'business',
        p_aggregate_id,
        'logo'
      );
      v_new_metadata := jsonb_set(
        v_new_metadata,
        '{logo_url}',
        to_jsonb(v_reference),
        TRUE
      );
    END IF;

    v_reference := NULLIF(btrim(p_references ->> 'banner'), '');
    IF NULLIF(btrim(p_expected_legacy ->> 'banner_url'), '') IS NOT NULL
       AND v_reference IS NULL THEN
      RAISE EXCEPTION 'cp016_business_banner_missing'
        USING ERRCODE = '22023';
    END IF;
    IF v_reference IS NOT NULL THEN
      PERFORM private.require_cp016_backfill_asset(
        v_reference,
        'business',
        p_aggregate_id,
        'banner'
      );
      v_new_metadata := jsonb_set(
        v_new_metadata,
        '{banner_url}',
        to_jsonb(v_reference),
        TRUE
      );
    END IF;

    FOR v_item, v_index IN
      SELECT source.value, source.ordinality::INTEGER
      FROM jsonb_array_elements(
        COALESCE(p_references -> 'gallery', '[]'::JSONB)
      ) WITH ORDINALITY source(value, ordinality)
    LOOP
      IF jsonb_typeof(v_item) = 'string' THEN
        v_reference := v_item #>> '{}';
        PERFORM private.require_cp016_backfill_asset(
          v_reference,
          'business',
          p_aggregate_id,
          'gallery_' || v_index
        );
        v_new_references :=
          v_new_references || jsonb_build_array(v_reference);
      ELSIF jsonb_typeof(v_item) = 'null' THEN
        PERFORM private.require_cp016_backfill_rejection(
          'business',
          p_aggregate_id,
          'gallery_' || v_index
        );
      ELSE
        RAISE EXCEPTION 'invalid_cp016_business_gallery_reference'
          USING ERRCODE = '22023';
      END IF;
    END LOOP;

    UPDATE public.business_data
    SET metadata = v_new_metadata
    WHERE id = p_aggregate_id;

    SELECT COALESCE(max(gallery.display_order), -1) + 1
    INTO v_existing_order
    FROM public.business_gallery gallery
    WHERE gallery.business_id = p_aggregate_id;

    v_index := 0;
    FOR v_reference IN
      SELECT value
      FROM jsonb_array_elements_text(v_new_references) value
    LOOP
      INSERT INTO public.business_gallery (
        business_id,
        image_url,
        display_order,
        is_featured
      ) VALUES (
        p_aggregate_id,
        v_reference,
        v_existing_order + v_index,
        FALSE
      );
      v_index := v_index + 1;
    END LOOP;
  ELSIF p_domain = 'classified' THEN
    IF jsonb_typeof(p_expected_legacy) <> 'array'
       OR jsonb_typeof(p_references) <> 'array'
       OR jsonb_array_length(p_expected_legacy)
          <> jsonb_array_length(p_references)
       OR jsonb_array_length(p_references) > 10 THEN
      RAISE EXCEPTION 'invalid_cp016_classified_backfill_payload'
        USING ERRCODE = '22023';
    END IF;

    SELECT classified.photos INTO v_current
    FROM public.classifieds classified
    WHERE classified.id = p_aggregate_id
    FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM p_expected_legacy THEN
      RAISE EXCEPTION 'cp016_classified_changed_since_preflight'
        USING ERRCODE = '40001';
    END IF;

    v_new_references := '[]'::JSONB;
    FOR v_item, v_index IN
      SELECT source.value, source.ordinality::INTEGER
      FROM jsonb_array_elements(p_references)
        WITH ORDINALITY source(value, ordinality)
    LOOP
      IF jsonb_typeof(v_item) = 'string' THEN
        v_reference := v_item #>> '{}';
        PERFORM private.require_cp016_backfill_asset(
          v_reference,
          'classified',
          p_aggregate_id,
          'photo_' || v_index
        );
        v_new_references :=
          v_new_references || jsonb_build_array(v_reference);
      ELSIF jsonb_typeof(v_item) = 'null' THEN
        PERFORM private.require_cp016_backfill_rejection(
          'classified',
          p_aggregate_id,
          'photo_' || v_index
        );
      ELSE
        RAISE EXCEPTION 'invalid_cp016_classified_reference'
          USING ERRCODE = '22023';
      END IF;
    END LOOP;

    UPDATE public.classifieds
    SET photos = v_new_references
    WHERE id = p_aggregate_id;
  ELSIF p_domain = 'site_setting' THEN
    IF jsonb_typeof(p_expected_legacy) <> 'string'
       OR jsonb_typeof(p_references) <> 'string' THEN
      RAISE EXCEPTION 'invalid_cp016_site_backfill_payload'
        USING ERRCODE = '22023';
    END IF;

    SELECT setting.value INTO v_current
    FROM public.site_settings setting
    WHERE setting.id = p_aggregate_id
    FOR UPDATE;
    IF NOT FOUND OR v_current IS DISTINCT FROM p_expected_legacy THEN
      RAISE EXCEPTION 'cp016_site_setting_changed_since_preflight'
        USING ERRCODE = '40001';
    END IF;

    v_reference := p_references #>> '{}';
    PERFORM private.require_cp016_backfill_asset(
      v_reference,
      'site_setting',
      p_aggregate_id,
      'primary'
    );

    UPDATE public.site_settings
    SET value = to_jsonb(v_reference),
        updated_at = now()
    WHERE id = p_aggregate_id;
  ELSE
    RAISE EXCEPTION 'unsupported_cp016_backfill_domain'
      USING ERRCODE = '22023';
  END IF;

  UPDATE private.media_asset_migration_audit audit
  SET attached_at = COALESCE(audit.attached_at, now())
  WHERE audit.migration_key = 'CP-016'
    AND audit.domain = p_domain
    AND audit.aggregate_id = p_aggregate_id;

  RETURN CASE p_domain
    WHEN 'business' THEN
      jsonb_array_length(COALESCE(p_references -> 'gallery', '[]'::JSONB))
      + CASE WHEN NULLIF(btrim(p_references ->> 'logo'), '') IS NULL THEN 0 ELSE 1 END
      + CASE WHEN NULLIF(btrim(p_references ->> 'banner'), '') IS NULL THEN 0 ELSE 1 END
    WHEN 'classified' THEN jsonb_array_length(p_references)
    ELSE 1
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID, TEXT, SMALLINT,
  TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_cp016_media_asset_backfill(
  TEXT, UUID, JSONB, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID, TEXT, SMALLINT,
  TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_cp016_media_asset_backfill(
  TEXT, UUID, JSONB, JSONB
) TO service_role;

REVOKE ALL ON FUNCTION private.cp016_legacy_source_matches(
  TEXT, UUID, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.require_cp016_backfill_rejection(
  TEXT, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.require_cp016_backfill_asset(
  TEXT, TEXT, UUID, TEXT
) FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE private.media_asset_migration_audit IS
  'Hashed, URL-free provenance ledger for controlled MediaAsset migrations.';
COMMENT ON FUNCTION public.reserve_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, UUID, UUID, UUID, TEXT, SMALLINT,
  TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT
) IS
  'Temporary CP-016 service-role reservation bounded to an existing hashed legacy source.';
COMMENT ON FUNCTION public.reject_cp016_media_asset_backfill(
  TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT
) IS
  'Temporary CP-016 service-role rejection limited to a verified unavailable Unsplash source.';
COMMENT ON FUNCTION public.finalize_cp016_media_asset_backfill(
  TEXT, UUID, JSONB, JSONB
) IS
  'Temporary CP-016 service-role atomic compare-and-swap cutover per aggregate.';

COMMIT;
