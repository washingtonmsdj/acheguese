-- Production hardening for the community lost-and-found runtime.

ALTER TABLE public.lost_found_posts
  DROP CONSTRAINT IF EXISTS valid_contact;

CREATE INDEX IF NOT EXISTS idx_lost_found_posts_location_created_id
  ON public.lost_found_posts (location_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_lost_found_posts_location_type_category_created
  ON public.lost_found_posts (
    location_id,
    tipo,
    categoria,
    created_at DESC,
    id DESC
  );

CREATE INDEX IF NOT EXISTS idx_lost_found_comments_post_created_id
  ON public.lost_found_comments (post_id, created_at ASC, id ASC);

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
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

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

    IF COALESCE(cardinality(NEW.imagens), 0) > 4 THEN
      RAISE EXCEPTION 'lost_found_image_limit_exceeded' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM unnest(COALESCE(NEW.imagens, '{}'::TEXT[])) AS image_url
      WHERE image_url !~ (
        '^https://[^/]+/storage/v1/object/public/post_images/'
        || NEW.autor_id::TEXT
        || '/posts/[0-9]+-[0-9a-f-]+[.]jpg(?:[?].*)?$'
      )
    ) THEN
      RAISE EXCEPTION 'invalid_lost_found_image_url' USING ERRCODE = '22023';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NOT v_is_admin THEN
      IF NOT private.auth_owns_active_profile(OLD.autor_id) THEN
        RAISE EXCEPTION 'lost_found_update_not_authorized' USING ERRCODE = '42501';
      END IF;

      IF NEW.id IS DISTINCT FROM OLD.id
         OR NEW.autor_id IS DISTINCT FROM OLD.autor_id
         OR NEW.location_id IS DISTINCT FROM OLD.location_id
         OR NEW.created_at IS DISTINCT FROM OLD.created_at
         OR NEW.contato_telefone IS DISTINCT FROM OLD.contato_telefone
         OR NEW.contato_email IS DISTINCT FROM OLD.contato_email THEN
        RAISE EXCEPTION 'lost_found_identity_is_immutable' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.imagens IS DISTINCT FROM OLD.imagens THEN
      IF COALESCE(cardinality(NEW.imagens), 0) > 4 THEN
        RAISE EXCEPTION 'lost_found_image_limit_exceeded' USING ERRCODE = '22023';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM unnest(COALESCE(NEW.imagens, '{}'::TEXT[])) AS image_url
        WHERE image_url !~ (
          '^https://[^/]+/storage/v1/object/public/post_images/'
          || NEW.autor_id::TEXT
          || '/posts/[0-9]+-[0-9a-f-]+[.]jpg(?:[?].*)?$'
        )
      ) THEN
        RAISE EXCEPTION 'invalid_lost_found_image_url' USING ERRCODE = '22023';
      END IF;
    END IF;
  ELSE
    IF NOT v_is_admin AND NOT private.auth_owns_active_profile(OLD.autor_id) THEN
      RAISE EXCEPTION 'lost_found_delete_not_authorized' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.guard_lost_found_comment_write
CREATE OR REPLACE FUNCTION private.guard_lost_found_comment_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_location_id UUID;
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();

  IF TG_OP = 'INSERT' THEN
    IF v_actor_profile_id IS NULL THEN
      RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
    END IF;

    SELECT post.location_id
    INTO v_location_id
    FROM public.lost_found_posts post
    WHERE post.id = NEW.post_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'lost_found_post_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_is_admin
       AND (
         v_location_id IS NULL
         OR NOT private.auth_has_verified_residence(
           v_actor_profile_id,
           v_location_id
         )
       ) THEN
      RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
    END IF;

    NEW.autor_id := v_actor_profile_id;
    NEW.created_at := now();

    PERFORM pg_advisory_xact_lock(
      hashtextextended('lost-found-comment:' || v_actor_profile_id::TEXT, 0)
    );

    SELECT count(*)::INTEGER
    INTO v_recent_count
    FROM public.community_social_audit_log audit
    WHERE audit.actor_profile_id = v_actor_profile_id
      AND audit.target_type = 'lost_found_comment'
      AND audit.action = 'insert'
      AND audit.created_at >= now() - interval '1 minute';

    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'lost_found_comment_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'lost_found_comments_are_not_editable' USING ERRCODE = '42501';
  ELSE
    IF NOT v_is_admin AND NOT private.auth_owns_active_profile(OLD.autor_id) THEN
      RAISE EXCEPTION 'lost_found_comment_delete_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.audit_lost_found_change
CREATE OR REPLACE FUNCTION private.audit_lost_found_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::JSONB ELSE to_jsonb(NEW) END;
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::JSONB ELSE to_jsonb(OLD) END;
  v_target_id UUID := COALESCE(v_new->>'id', v_old->>'id')::UUID;
  v_post_id UUID;
  v_location_id UUID;
BEGIN
  IF TG_ARGV[0] = 'lost_found_post' THEN
    v_location_id := COALESCE(v_new->>'location_id', v_old->>'location_id')::UUID;
  ELSE
    v_post_id := COALESCE(v_new->>'post_id', v_old->>'post_id')::UUID;
    SELECT post.location_id
    INTO v_location_id
    FROM public.lost_found_posts post
    WHERE post.id = v_post_id;
  END IF;

  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  ) VALUES (
    auth.uid(),
    private.current_active_profile_id(),
    lower(TG_OP),
    TG_ARGV[0],
    v_target_id,
    v_location_id,
    jsonb_strip_nulls(jsonb_build_object(
      'post_id', v_post_id,
      'type', COALESCE(v_new->>'tipo', v_old->>'tipo'),
      'resolved', v_new->>'resolvido',
      'previous_resolved', v_old->>'resolvido'
    ))
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_lost_found_post_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.guard_lost_found_comment_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_lost_found_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_lost_found_post_write
  ON public.lost_found_posts;
CREATE TRIGGER trg_guard_lost_found_post_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.lost_found_posts
  FOR EACH ROW EXECUTE FUNCTION private.guard_lost_found_post_write();

DROP TRIGGER IF EXISTS trg_guard_lost_found_comment_write
  ON public.lost_found_comments;
CREATE TRIGGER trg_guard_lost_found_comment_write
  BEFORE INSERT OR UPDATE OR DELETE ON public.lost_found_comments
  FOR EACH ROW EXECUTE FUNCTION private.guard_lost_found_comment_write();

DROP TRIGGER IF EXISTS trg_audit_lost_found_post_change
  ON public.lost_found_posts;
CREATE TRIGGER trg_audit_lost_found_post_change
  AFTER INSERT OR UPDATE OR DELETE ON public.lost_found_posts
  FOR EACH ROW EXECUTE FUNCTION private.audit_lost_found_change(
    'lost_found_post'
  );

DROP TRIGGER IF EXISTS trg_audit_lost_found_comment_change
  ON public.lost_found_comments;
CREATE TRIGGER trg_audit_lost_found_comment_change
  AFTER INSERT OR DELETE ON public.lost_found_comments
  FOR EACH ROW EXECUTE FUNCTION private.audit_lost_found_change(
    'lost_found_comment'
  );

DO $$
DECLARE
  policy_row RECORD;
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'lost_found_posts',
    'lost_found_comments'
  ] LOOP
    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format(
        'DROP POLICY %I ON public.%I',
        policy_row.policyname,
        table_name
      );
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.lost_found_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY lost_found_posts_public_read
  ON public.lost_found_posts FOR SELECT TO anon, authenticated
  USING (TRUE);

CREATE POLICY lost_found_posts_verified_insert
  ON public.lost_found_posts FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_has_verified_residence(autor_id, location_id)
  );

CREATE POLICY lost_found_posts_owner_or_admin_update
  ON public.lost_found_posts FOR UPDATE TO authenticated
  USING (
    private.auth_owns_active_profile(autor_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  )
  WITH CHECK (
    private.auth_owns_active_profile(autor_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE POLICY lost_found_posts_owner_or_admin_delete
  ON public.lost_found_posts FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(autor_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE POLICY lost_found_comments_public_read
  ON public.lost_found_comments FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lost_found_posts post
      WHERE post.id = lost_found_comments.post_id
    )
  );

CREATE POLICY lost_found_comments_verified_insert
  ON public.lost_found_comments FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(autor_id)
    AND EXISTS (
      SELECT 1
      FROM public.lost_found_posts post
      WHERE post.id = lost_found_comments.post_id
        AND private.auth_has_verified_residence(autor_id, post.location_id)
    )
  );

CREATE POLICY lost_found_comments_owner_or_admin_delete
  ON public.lost_found_comments FOR DELETE TO authenticated
  USING (
    private.auth_owns_active_profile(autor_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

REVOKE ALL ON TABLE public.lost_found_posts FROM anon, authenticated;
GRANT SELECT (
  id,
  autor_id,
  tipo,
  titulo,
  descricao,
  categoria,
  local_perdido,
  data_perdido,
  imagens,
  location_id,
  resolvido,
  created_at,
  updated_at
) ON public.lost_found_posts TO anon, authenticated;
GRANT INSERT (
  tipo,
  titulo,
  descricao,
  categoria,
  local_perdido,
  data_perdido,
  imagens,
  location_id
) ON public.lost_found_posts TO authenticated;
GRANT UPDATE (
  tipo,
  titulo,
  descricao,
  categoria,
  local_perdido,
  data_perdido,
  imagens,
  location_id,
  resolvido
) ON public.lost_found_posts TO authenticated;
GRANT DELETE ON public.lost_found_posts TO authenticated;

REVOKE ALL ON TABLE public.lost_found_comments FROM anon, authenticated;
GRANT SELECT (
  id,
  post_id,
  autor_id,
  conteudo,
  created_at
) ON public.lost_found_comments TO anon, authenticated;
GRANT INSERT (post_id, conteudo)
  ON public.lost_found_comments TO authenticated;
GRANT DELETE ON public.lost_found_comments TO authenticated;

COMMENT ON COLUMN public.lost_found_posts.contato_telefone IS
  'Restricted legacy PII. Not exposed to anon or authenticated clients.';
COMMENT ON COLUMN public.lost_found_posts.contato_email IS
  'Restricted legacy PII. Not exposed to anon or authenticated clients.';
COMMENT ON FUNCTION private.guard_lost_found_post_write() IS
  'Derives actor identity, enforces local authorization, immutable ownership, upload provenance and anti-flood limits.';
COMMENT ON FUNCTION private.guard_lost_found_comment_write() IS
  'Derives comment author and enforces local authorization and anti-flood limits.';
COMMENT ON FUNCTION private.audit_lost_found_change() IS
  'Appends content-free lost-and-found mutations to the canonical community audit log.';
