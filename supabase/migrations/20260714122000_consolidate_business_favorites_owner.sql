-- Consolidate Business Favorites under an auth-derived, command-only owner.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.business_favorite_tags_are_valid(value TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT
    cardinality(value) <= 10
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(value) AS tag
      WHERE tag IS NULL
        OR char_length(btrim(tag)) NOT BETWEEN 1 AND 32
    );
$$;

REVOKE ALL ON FUNCTION private.business_favorite_tags_are_valid(TEXT[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.business_favorite_tags_are_valid(TEXT[])
  TO service_role;

ALTER TABLE public.user_favorite_businesses
  DROP CONSTRAINT IF EXISTS user_favorite_businesses_notes_length_check,
  DROP CONSTRAINT IF EXISTS user_favorite_businesses_tags_check;

ALTER TABLE public.user_favorite_businesses
  ADD CONSTRAINT user_favorite_businesses_notes_length_check
    CHECK (notes IS NULL OR char_length(notes) <= 500),
  ADD CONSTRAINT user_favorite_businesses_tags_check
    CHECK (tags IS NULL OR private.business_favorite_tags_are_valid(tags));

CREATE TABLE IF NOT EXISTS private.business_favorites_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  favorite_id UUID NOT NULL,
  actor_user_id UUID,
  owner_user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'removed')),
  changed_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp()
);

CREATE INDEX IF NOT EXISTS business_favorites_audit_owner_created_idx
  ON private.business_favorites_audit_log (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS business_favorites_audit_business_created_idx
  ON private.business_favorites_audit_log (business_id, created_at DESC);

REVOKE ALL ON TABLE private.business_favorites_audit_log
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.business_favorites_audit_log TO service_role;

CREATE OR REPLACE FUNCTION private.enforce_business_favorite_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'business_favorite_identity_is_immutable'
      USING ERRCODE = '22000';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.audit_business_favorite_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  previous public.user_favorite_businesses := OLD;
  current public.user_favorite_businesses := NEW;
  changed TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current.notify_on_promotions IS DISTINCT FROM previous.notify_on_promotions THEN
      changed := array_append(changed, 'notify_on_promotions');
    END IF;
    IF current.notify_on_new_items IS DISTINCT FROM previous.notify_on_new_items THEN
      changed := array_append(changed, 'notify_on_new_items');
    END IF;
    IF current.notes IS DISTINCT FROM previous.notes THEN
      changed := array_append(changed, 'notes');
    END IF;
    IF current.tags IS DISTINCT FROM previous.tags THEN
      changed := array_append(changed, 'tags');
    END IF;
  ELSE
    changed := ARRAY['favorite_membership'];
  END IF;

  INSERT INTO private.business_favorites_audit_log (
    favorite_id,
    actor_user_id,
    owner_user_id,
    business_id,
    action,
    changed_fields
  ) VALUES (
    COALESCE(current.id, previous.id),
    auth.uid(),
    COALESCE(current.user_id, previous.user_id),
    COALESCE(current.business_id, previous.business_id),
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'removed'
    END,
    changed
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_business_favorite_identity()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.audit_business_favorite_mutation()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_business_favorite_identity
  ON public.user_favorite_businesses;
CREATE TRIGGER enforce_business_favorite_identity
  BEFORE UPDATE ON public.user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_business_favorite_identity();

DROP TRIGGER IF EXISTS audit_business_favorite_mutation
  ON public.user_favorite_businesses;
CREATE TRIGGER audit_business_favorite_mutation
  AFTER INSERT OR UPDATE OR DELETE ON public.user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_business_favorite_mutation();

DROP POLICY IF EXISTS "Users manage own favorites"
  ON public.user_favorite_businesses;
DROP POLICY IF EXISTS "Users read own business favorites"
  ON public.user_favorite_businesses;
CREATE POLICY "Users read own business favorites"
  ON public.user_favorite_businesses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_favorite_businesses
  FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_current_user_business_favorites(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS SETOF public.user_favorite_businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'invalid_limit' USING ERRCODE = '22023';
  END IF;
  IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 10000 THEN
    RAISE EXCEPTION 'invalid_offset' USING ERRCODE = '22023';
  END IF;
  IF p_tags IS NOT NULL
     AND NOT private.business_favorite_tags_are_valid(p_tags) THEN
    RAISE EXCEPTION 'invalid_tags' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT favorite.*
  FROM public.user_favorite_businesses AS favorite
  WHERE favorite.user_id = current_user_id
    AND (p_tags IS NULL OR favorite.tags @> p_tags)
  ORDER BY favorite.created_at DESC, favorite.id DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_business_favorite(
  p_business_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id_required' USING ERRCODE = '22023';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_favorite_businesses AS favorite
    WHERE favorite.user_id = current_user_id
      AND favorite.business_id = p_business_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_current_user_business_favorite(
  p_business_id UUID,
  p_favorited BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_business_id IS NULL OR p_favorited IS NULL THEN
    RAISE EXCEPTION 'business_id_and_favorited_are_required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      current_user_id::TEXT || ':' || p_business_id::TEXT,
      0
    )
  );

  IF p_favorited THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.business_data AS business
      WHERE business.id = p_business_id
        AND business.status = 'active'
    ) THEN
      RAISE EXCEPTION 'active_business_not_found' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.user_favorite_businesses (user_id, business_id)
    VALUES (current_user_id, p_business_id)
    ON CONFLICT ON CONSTRAINT unique_user_favorite DO NOTHING;
  ELSE
    DELETE FROM public.user_favorite_businesses AS favorite
    WHERE favorite.user_id = current_user_id
      AND favorite.business_id = p_business_id;
  END IF;

  RETURN p_favorited;
END;
$$;

CREATE OR REPLACE FUNCTION public.patch_current_user_business_favorite(
  p_favorite_id UUID,
  p_notify_on_promotions BOOLEAN DEFAULT NULL,
  p_notify_on_new_items BOOLEAN DEFAULT NULL,
  p_notes_set BOOLEAN DEFAULT FALSE,
  p_notes TEXT DEFAULT NULL,
  p_tags_set BOOLEAN DEFAULT FALSE,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS public.user_favorite_businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_favorite public.user_favorite_businesses;
  normalized_tags TEXT[];
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '28000';
  END IF;
  IF p_favorite_id IS NULL THEN
    RAISE EXCEPTION 'favorite_id_required' USING ERRCODE = '22023';
  END IF;
  IF p_notes_set AND char_length(COALESCE(p_notes, '')) > 500 THEN
    RAISE EXCEPTION 'notes_too_long' USING ERRCODE = '22023';
  END IF;
  IF p_tags_set AND p_tags IS NOT NULL
     AND NOT private.business_favorite_tags_are_valid(p_tags) THEN
    RAISE EXCEPTION 'invalid_tags' USING ERRCODE = '22023';
  END IF;

  IF p_tags_set AND p_tags IS NOT NULL THEN
    SELECT COALESCE(
      array_agg(tag ORDER BY tag),
      ARRAY[]::TEXT[]
    )
    INTO normalized_tags
    FROM (
      SELECT DISTINCT lower(btrim(raw_tag)) AS tag
      FROM unnest(p_tags) AS raw_tag
      WHERE btrim(raw_tag) <> ''
    ) AS normalized;
  ELSE
    normalized_tags := NULL;
  END IF;

  SELECT favorite.*
  INTO current_favorite
  FROM public.user_favorite_businesses AS favorite
  WHERE favorite.id = p_favorite_id
    AND favorite.user_id = current_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'business_favorite_not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.user_favorite_businesses AS favorite
  SET
    notify_on_promotions = COALESCE(
      p_notify_on_promotions,
      favorite.notify_on_promotions
    ),
    notify_on_new_items = COALESCE(
      p_notify_on_new_items,
      favorite.notify_on_new_items
    ),
    notes = CASE
      WHEN p_notes_set THEN NULLIF(btrim(p_notes), '')
      ELSE favorite.notes
    END,
    tags = CASE
      WHEN p_tags_set THEN normalized_tags
      ELSE favorite.tags
    END
  WHERE favorite.id = current_favorite.id
  RETURNING favorite.* INTO current_favorite;

  RETURN current_favorite;
END;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_business_favorites(INTEGER, INTEGER, TEXT[])
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_current_user_business_favorite(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_current_user_business_favorite(UUID, BOOLEAN)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.patch_current_user_business_favorite(
  UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_current_user_business_favorites(INTEGER, INTEGER, TEXT[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_current_user_business_favorite(UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_current_user_business_favorite(UUID, BOOLEAN)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.patch_current_user_business_favorite(
  UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT[]
) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_user_favorite_businesses(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.is_business_favorited(UUID, UUID);
DROP FUNCTION IF EXISTS public.toggle_business_favorite(UUID, UUID);

COMMENT ON TABLE public.user_favorite_businesses IS
  'Canonical account-owned Business Favorites storage. Browser writes use auth-derived commands.';
COMMENT ON FUNCTION public.get_current_user_business_favorites(INTEGER, INTEGER, TEXT[]) IS
  'Lists the authenticated account business favorites with bounded pagination and optional tags.';
COMMENT ON FUNCTION public.is_current_user_business_favorite(UUID) IS
  'Checks the authenticated account favorite state without accepting a client identity.';
COMMENT ON FUNCTION public.set_current_user_business_favorite(UUID, BOOLEAN) IS
  'Idempotently sets the authenticated account favorite state under a per-owner/business lock.';
COMMENT ON FUNCTION public.patch_current_user_business_favorite(
  UUID, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, BOOLEAN, TEXT[]
) IS
  'Atomically patches preferences for an authenticated account-owned business favorite.';
