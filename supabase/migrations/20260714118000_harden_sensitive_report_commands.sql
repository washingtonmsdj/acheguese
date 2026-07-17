-- Harden sensitive report commands across Classifieds, Jobs, Reviews and Rides.
-- Domain report tables remain independent; actor derivation, moderation actor,
-- audit envelope, rate limiting and immutable identity follow one protocol.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- security-authority: internal-table private.sensitive_report_audit_log
CREATE TABLE IF NOT EXISTS private.sensitive_report_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('classified', 'vaga', 'review', 'ride')),
  action TEXT NOT NULL CHECK (action IN ('created', 'reviewed')),
  report_id UUID NOT NULL,
  actor_user_id UUID,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status TEXT,
  next_status TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object' AND pg_column_size(metadata) <= 4096),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sensitive_report_audit_report
  ON private.sensitive_report_audit_log(domain, report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensitive_report_audit_actor
  ON private.sensitive_report_audit_log(actor_profile_id, created_at DESC)
  WHERE actor_profile_id IS NOT NULL;

REVOKE ALL ON TABLE private.sensitive_report_audit_log
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.sensitive_report_audit_log TO service_role;

-- security-authority: internal-function private.audit_sensitive_report_write
CREATE OR REPLACE FUNCTION private.audit_sensitive_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_new JSONB := to_jsonb(NEW);
  v_old JSONB := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
  v_domain TEXT := TG_ARGV[0];
  v_actor_profile_id UUID;
  v_target_id UUID;
BEGIN
  v_actor_profile_id := COALESCE(
    NULLIF(v_new->>'reviewed_by', '')::UUID,
    NULLIF(v_new->>'reviewed_by_profile_id', '')::UUID,
    NULLIF(v_new->>'reporter_id', '')::UUID,
    NULLIF(v_new->>'reporter_profile_id', '')::UUID
  );
  v_target_id := COALESCE(
    NULLIF(v_new->>'classified_id', '')::UUID,
    NULLIF(v_new->>'vaga_id', '')::UUID,
    NULLIF(v_new->>'review_id', '')::UUID,
    NULLIF(v_new->>'ride_id', '')::UUID
  );

  INSERT INTO private.sensitive_report_audit_log (
    domain,
    action,
    report_id,
    actor_user_id,
    actor_profile_id,
    previous_status,
    next_status,
    metadata
  ) VALUES (
    v_domain,
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'reviewed' END,
    NEW.id,
    auth.uid(),
    v_actor_profile_id,
    CASE WHEN TG_OP = 'UPDATE' THEN v_old->>'status' ELSE NULL END,
    v_new->>'status',
    jsonb_strip_nulls(jsonb_build_object(
      'target_id', v_target_id,
      'reason', COALESCE(v_new->>'reason', v_new->>'report_type'),
      'severity', v_new->>'severity'
    ))
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.audit_sensitive_report_write() FROM PUBLIC;

-- --------------------------------------------------------------------------
-- Classified reports
-- --------------------------------------------------------------------------

ALTER TABLE public.classified_reports
  ALTER COLUMN reporter_id SET NOT NULL;

ALTER TABLE public.classified_reports
  DROP CONSTRAINT IF EXISTS classified_reports_description_length_check;
ALTER TABLE public.classified_reports
  ADD CONSTRAINT classified_reports_description_length_check
  CHECK (description IS NULL OR char_length(trim(description)) BETWEEN 3 AND 1000)
  NOT VALID;

ALTER TABLE public.classified_reports
  DROP CONSTRAINT IF EXISTS classified_reports_admin_notes_length_check;
ALTER TABLE public.classified_reports
  ADD CONSTRAINT classified_reports_admin_notes_length_check
  CHECK (admin_notes IS NULL OR char_length(trim(admin_notes)) BETWEEN 3 AND 2000)
  NOT VALID;

-- security-authority: internal-function private.guard_classified_report_write
CREATE OR REPLACE FUNCTION private.guard_classified_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_owner_profile_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT c.seller_id INTO v_owner_profile_id
    FROM public.classifieds c
    WHERE c.id = NEW.classified_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'classified_not_found' USING ERRCODE = 'P0002';
    END IF;
    IF v_owner_profile_id = v_actor_profile_id THEN
      RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext('classified_report_rate'),
      hashtext(v_actor_profile_id::text)
    );
    SELECT count(*)::INTEGER INTO v_recent_count
    FROM public.classified_reports r
    WHERE r.reporter_id = v_actor_profile_id
      AND r.created_at >= now() - interval '1 hour';
    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'classified_report_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;

    NEW.reporter_id := v_actor_profile_id;
    NEW.description := NULLIF(trim(COALESCE(NEW.description, '')), '');
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.admin_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.classified_id IS DISTINCT FROM OLD.classified_id
       OR NEW.reporter_id IS DISTINCT FROM OLD.reporter_id
       OR NEW.reason IS DISTINCT FROM OLD.reason
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'classified_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'classified_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF OLD.status IN ('resolved', 'dismissed') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'classified_report_is_terminal' USING ERRCODE = '22023';
    END IF;
    IF NEW.status NOT IN ('reviewed', 'resolved', 'dismissed') THEN
      RAISE EXCEPTION 'invalid_classified_report_status' USING ERRCODE = '22023';
    END IF;
    NEW.reviewed_by := v_actor_profile_id;
    NEW.reviewed_at := now();
    NEW.admin_notes := NULLIF(trim(COALESCE(NEW.admin_notes, '')), '');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_classified_report_write() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_guard_classified_report_write ON public.classified_reports;
CREATE TRIGGER trg_guard_classified_report_write
  BEFORE INSERT OR UPDATE ON public.classified_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_classified_report_write();

DROP TRIGGER IF EXISTS trg_audit_classified_report_write ON public.classified_reports;
CREATE TRIGGER trg_audit_classified_report_write
  AFTER INSERT OR UPDATE ON public.classified_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_sensitive_report_write('classified');

DROP POLICY IF EXISTS classified_reports_insert_own ON public.classified_reports;
CREATE POLICY classified_reports_insert_own
  ON public.classified_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = private.current_active_profile_id());

DROP POLICY IF EXISTS classified_reports_select_own_or_admin ON public.classified_reports;
CREATE POLICY classified_reports_select_own_or_admin
  ON public.classified_reports FOR SELECT TO authenticated
  USING (
    reporter_id = private.current_active_profile_id()
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

DROP POLICY IF EXISTS classified_reports_admin_update ON public.classified_reports;
CREATE POLICY classified_reports_admin_update
  ON public.classified_reports FOR UPDATE TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE))
  WITH CHECK (COALESCE(private.is_admin_user(auth.uid()), FALSE));

REVOKE INSERT, UPDATE, DELETE ON public.classified_reports FROM authenticated;

-- security-authority: internal-function private.create_classified_report
CREATE OR REPLACE FUNCTION private.create_classified_report(
  p_classified_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS public.classified_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_report public.classified_reports;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF p_reason NOT IN (
    'fraud', 'fake', 'inappropriate', 'spam',
    'duplicate', 'wrong-category', 'sold', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_classified_report_reason' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(trim(COALESCE(p_description, '')), '') IS NOT NULL
     AND char_length(trim(p_description)) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_classified_report_description' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.classified_reports (classified_id, reporter_id, reason, description)
  VALUES (p_classified_id, private.current_active_profile_id(), p_reason, p_description)
  RETURNING * INTO v_report;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.create_classified_report
CREATE OR REPLACE FUNCTION public.create_classified_report(
  p_classified_id UUID,
  p_reason TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS public.classified_reports
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.create_classified_report(p_classified_id, p_reason, p_description);
$$;

-- security-authority: internal-function private.moderate_classified_report
CREATE OR REPLACE FUNCTION private.moderate_classified_report(
  p_report_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.classified_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_report public.classified_reports;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'classified_report_review_not_authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.classified_reports
  SET status = p_status, admin_notes = p_admin_notes
  WHERE id = p_report_id
  RETURNING * INTO v_report;
  IF v_report.id IS NULL THEN
    RAISE EXCEPTION 'classified_report_not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.moderate_classified_report
CREATE OR REPLACE FUNCTION public.moderate_classified_report(
  p_report_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.classified_reports
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.moderate_classified_report(p_report_id, p_status, p_admin_notes);
$$;

REVOKE ALL ON FUNCTION private.create_classified_report(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.moderate_classified_report(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_classified_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.moderate_classified_report(UUID, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_classified_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_classified_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_classified_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_classified_report(UUID, TEXT, TEXT) TO authenticated;

-- --------------------------------------------------------------------------
-- Vaga reports
-- --------------------------------------------------------------------------

-- security-authority: internal-function private.guard_vaga_report_write
CREATE OR REPLACE FUNCTION private.guard_vaga_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_owner_profile_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT v.owner_profile_id INTO v_owner_profile_id FROM public.vagas v WHERE v.id = NEW.vaga_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'vaga_not_found' USING ERRCODE = 'P0002'; END IF;
    IF v_owner_profile_id = v_actor_profile_id THEN
      RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('vaga_report_rate'), hashtext(v_actor_profile_id::text));
    SELECT count(*)::INTEGER INTO v_recent_count FROM public.vaga_reports r
    WHERE r.reporter_profile_id = v_actor_profile_id
      AND r.created_at >= now() - interval '1 hour';
    IF v_recent_count >= 10 THEN
      RAISE EXCEPTION 'vaga_report_rate_limit_exceeded' USING ERRCODE = 'P0001';
    END IF;
    NEW.reporter_profile_id := v_actor_profile_id;
    NEW.description := NULLIF(trim(COALESCE(NEW.description, '')), '');
    NEW.status := 'pending';
    NEW.reviewed_by_profile_id := NULL;
    NEW.reviewed_at := NULL;
    NEW.admin_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.vaga_id IS DISTINCT FROM OLD.vaga_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reason IS DISTINCT FROM OLD.reason OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'vaga_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'vaga_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF OLD.status IN ('resolved', 'dismissed') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'vaga_report_is_terminal' USING ERRCODE = '22023';
    END IF;
    IF NEW.status NOT IN ('reviewed', 'resolved', 'dismissed') THEN
      RAISE EXCEPTION 'invalid_vaga_report_status' USING ERRCODE = '22023';
    END IF;
    NEW.reviewed_by_profile_id := v_actor_profile_id;
    NEW.reviewed_at := now();
    NEW.admin_notes := NULLIF(trim(COALESCE(NEW.admin_notes, '')), '');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_vaga_report_write() FROM PUBLIC;
DROP TRIGGER IF EXISTS trg_guard_vaga_report_write ON public.vaga_reports;
CREATE TRIGGER trg_guard_vaga_report_write BEFORE INSERT OR UPDATE ON public.vaga_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_vaga_report_write();
DROP TRIGGER IF EXISTS trg_audit_vaga_report_write ON public.vaga_reports;
CREATE TRIGGER trg_audit_vaga_report_write AFTER INSERT OR UPDATE ON public.vaga_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_sensitive_report_write('vaga');

DROP POLICY IF EXISTS vaga_reports_insert_own ON public.vaga_reports;
CREATE POLICY vaga_reports_insert_own ON public.vaga_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id = private.current_active_profile_id());
DROP POLICY IF EXISTS vaga_reports_select_own_or_admin ON public.vaga_reports;
CREATE POLICY vaga_reports_select_own_or_admin ON public.vaga_reports FOR SELECT TO authenticated
  USING (
    reporter_profile_id = private.current_active_profile_id()
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
DROP POLICY IF EXISTS vaga_reports_admin_update ON public.vaga_reports;
CREATE POLICY vaga_reports_admin_update ON public.vaga_reports FOR UPDATE TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE))
  WITH CHECK (COALESCE(private.is_admin_user(auth.uid()), FALSE));
REVOKE INSERT, UPDATE, DELETE ON public.vaga_reports FROM authenticated;

-- security-authority: internal-function private.create_vaga_report
CREATE OR REPLACE FUNCTION private.create_vaga_report(
  p_vaga_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS public.vaga_reports
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.vaga_reports;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  IF p_reason NOT IN ('fraud', 'fake-company', 'inappropriate', 'spam', 'expired', 'misleading', 'discrimination', 'other') THEN
    RAISE EXCEPTION 'invalid_vaga_report_reason' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(trim(COALESCE(p_description, '')), '') IS NOT NULL
     AND char_length(trim(p_description)) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_vaga_report_description' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.vaga_reports(vaga_id, reporter_profile_id, reason, description)
  VALUES (p_vaga_id, private.current_active_profile_id(), p_reason, p_description)
  RETURNING * INTO v_report;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.create_vaga_report
CREATE OR REPLACE FUNCTION public.create_vaga_report(
  p_vaga_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS public.vaga_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$ SELECT private.create_vaga_report(p_vaga_id, p_reason, p_description); $$;

-- security-authority: internal-function private.moderate_vaga_report
CREATE OR REPLACE FUNCTION private.moderate_vaga_report(
  p_report_id UUID, p_status TEXT, p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.vaga_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.vaga_reports;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'vaga_report_review_not_authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.vaga_reports SET status = p_status, admin_notes = p_admin_notes
  WHERE id = p_report_id RETURNING * INTO v_report;
  IF v_report.id IS NULL THEN RAISE EXCEPTION 'vaga_report_not_found' USING ERRCODE = 'P0002'; END IF;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.moderate_vaga_report
CREATE OR REPLACE FUNCTION public.moderate_vaga_report(
  p_report_id UUID, p_status TEXT, p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.vaga_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$ SELECT private.moderate_vaga_report(p_report_id, p_status, p_admin_notes); $$;

REVOKE ALL ON FUNCTION private.create_vaga_report(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.moderate_vaga_report(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_vaga_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.moderate_vaga_report(UUID, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_vaga_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_vaga_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_vaga_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_vaga_report(UUID, TEXT, TEXT) TO authenticated;

-- --------------------------------------------------------------------------
-- Review reports
-- --------------------------------------------------------------------------

ALTER TABLE public.review_reports
  DROP CONSTRAINT IF EXISTS review_reports_description_length_check;
ALTER TABLE public.review_reports
  ADD CONSTRAINT review_reports_description_length_check
  CHECK (description IS NULL OR char_length(trim(description)) BETWEEN 3 AND 1000)
  NOT VALID;
ALTER TABLE public.review_reports
  DROP CONSTRAINT IF EXISTS review_reports_moderator_notes_length_check;
ALTER TABLE public.review_reports
  ADD CONSTRAINT review_reports_moderator_notes_length_check
  CHECK (moderator_notes IS NULL OR char_length(trim(moderator_notes)) BETWEEN 3 AND 2000)
  NOT VALID;

-- security-authority: internal-function private.guard_review_report_write
CREATE OR REPLACE FUNCTION private.guard_review_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_review_author_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF v_actor_profile_id IS NULL THEN RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT r.reviewer_profile_id INTO v_review_author_id FROM public.reviews r WHERE r.id = NEW.review_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'review_not_found' USING ERRCODE = 'P0002'; END IF;
    IF v_review_author_id = v_actor_profile_id THEN
      RAISE EXCEPTION 'self_report_not_allowed' USING ERRCODE = '23514';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('review_report_rate'), hashtext(v_actor_profile_id::text));
    SELECT count(*)::INTEGER INTO v_recent_count FROM public.review_reports r
    WHERE r.reporter_profile_id = v_actor_profile_id AND r.created_at >= now() - interval '1 hour';
    IF v_recent_count >= 10 THEN RAISE EXCEPTION 'review_report_rate_limit_exceeded' USING ERRCODE = 'P0001'; END IF;
    NEW.reporter_profile_id := v_actor_profile_id;
    NEW.description := NULLIF(trim(COALESCE(NEW.description, '')), '');
    NEW.status := 'pending'; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL; NEW.moderator_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.review_id IS DISTINCT FROM OLD.review_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reason IS DISTINCT FROM OLD.reason OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'review_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'review_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF OLD.status IN ('accepted', 'rejected') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'review_report_is_terminal' USING ERRCODE = '22023';
    END IF;
    IF NEW.status NOT IN ('reviewed', 'accepted', 'rejected') THEN
      RAISE EXCEPTION 'invalid_review_report_status' USING ERRCODE = '22023';
    END IF;
    NEW.reviewed_by := v_actor_profile_id; NEW.reviewed_at := now();
    NEW.moderator_notes := NULLIF(trim(COALESCE(NEW.moderator_notes, '')), '');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_review_report_write() FROM PUBLIC;
DROP TRIGGER IF EXISTS trg_guard_review_report_write ON public.review_reports;
CREATE TRIGGER trg_guard_review_report_write BEFORE INSERT OR UPDATE ON public.review_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_review_report_write();
DROP TRIGGER IF EXISTS trg_audit_review_report_write ON public.review_reports;
CREATE TRIGGER trg_audit_review_report_write AFTER INSERT OR UPDATE ON public.review_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_sensitive_report_write('review');

DROP POLICY IF EXISTS "Users can report reviews" ON public.review_reports;
DROP POLICY IF EXISTS review_reports_insert_active_profile ON public.review_reports;
CREATE POLICY review_reports_insert_active_profile ON public.review_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id = private.current_active_profile_id());
DROP POLICY IF EXISTS "Users view own reports" ON public.review_reports;
DROP POLICY IF EXISTS review_reports_select_own_or_admin ON public.review_reports;
CREATE POLICY review_reports_select_own_or_admin ON public.review_reports FOR SELECT TO authenticated
  USING (
    reporter_profile_id = private.current_active_profile_id()
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
DROP POLICY IF EXISTS review_reports_admin_update ON public.review_reports;
CREATE POLICY review_reports_admin_update ON public.review_reports FOR UPDATE TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE))
  WITH CHECK (COALESCE(private.is_admin_user(auth.uid()), FALSE));
REVOKE INSERT, UPDATE, DELETE ON public.review_reports FROM authenticated;

-- security-authority: internal-function private.create_review_report
CREATE OR REPLACE FUNCTION private.create_review_report(
  p_review_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS public.review_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.review_reports;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  IF p_reason NOT IN ('spam', 'offensive', 'fake', 'inappropriate', 'other') THEN
    RAISE EXCEPTION 'invalid_review_report_reason' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(trim(COALESCE(p_description, '')), '') IS NOT NULL
     AND char_length(trim(p_description)) NOT BETWEEN 3 AND 1000 THEN
    RAISE EXCEPTION 'invalid_review_report_description' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.review_reports(review_id, reporter_profile_id, reason, description)
  VALUES (p_review_id, private.current_active_profile_id(), p_reason, p_description)
  RETURNING * INTO v_report;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.create_review_report
CREATE OR REPLACE FUNCTION public.create_review_report(
  p_review_id UUID, p_reason TEXT, p_description TEXT DEFAULT NULL
)
RETURNS public.review_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$ SELECT private.create_review_report(p_review_id, p_reason, p_description); $$;

-- security-authority: internal-function private.moderate_review_report
CREATE OR REPLACE FUNCTION private.moderate_review_report(
  p_report_id UUID, p_status TEXT, p_moderator_notes TEXT DEFAULT NULL
)
RETURNS public.review_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.review_reports;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'review_report_review_not_authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.review_reports SET status = p_status, moderator_notes = p_moderator_notes
  WHERE id = p_report_id RETURNING * INTO v_report;
  IF v_report.id IS NULL THEN RAISE EXCEPTION 'review_report_not_found' USING ERRCODE = 'P0002'; END IF;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.moderate_review_report
CREATE OR REPLACE FUNCTION public.moderate_review_report(
  p_report_id UUID, p_status TEXT, p_moderator_notes TEXT DEFAULT NULL
)
RETURNS public.review_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$ SELECT private.moderate_review_report(p_report_id, p_status, p_moderator_notes); $$;

REVOKE ALL ON FUNCTION private.create_review_report(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.moderate_review_report(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_review_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION private.moderate_review_report(UUID, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_review_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_review_report(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_review_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_review_report(UUID, TEXT, TEXT) TO authenticated;

-- --------------------------------------------------------------------------
-- Ride reports
-- --------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ride_reports_reporter_created
  ON public.ride_reports(reporter_profile_id, created_at DESC);

ALTER TABLE public.ride_reports
  DROP CONSTRAINT IF EXISTS ride_reports_title_length_check;
ALTER TABLE public.ride_reports
  ADD CONSTRAINT ride_reports_title_length_check
  CHECK (char_length(trim(title)) BETWEEN 3 AND 160) NOT VALID;
ALTER TABLE public.ride_reports
  DROP CONSTRAINT IF EXISTS ride_reports_description_length_check;
ALTER TABLE public.ride_reports
  ADD CONSTRAINT ride_reports_description_length_check
  CHECK (char_length(trim(description)) BETWEEN 10 AND 4000) NOT VALID;
ALTER TABLE public.ride_reports
  DROP CONSTRAINT IF EXISTS ride_reports_notes_length_check;
ALTER TABLE public.ride_reports
  ADD CONSTRAINT ride_reports_notes_length_check
  CHECK (
    (resolution_notes IS NULL OR char_length(trim(resolution_notes)) BETWEEN 3 AND 2000)
    AND (admin_notes IS NULL OR char_length(trim(admin_notes)) BETWEEN 3 AND 2000)
  ) NOT VALID;
ALTER TABLE public.ride_reports
  DROP CONSTRAINT IF EXISTS ride_reports_evidence_limit_check;
ALTER TABLE public.ride_reports
  ADD CONSTRAINT ride_reports_evidence_limit_check
  CHECK (evidence_urls IS NULL OR cardinality(evidence_urls) <= 5) NOT VALID;

-- security-authority: internal-function private.guard_ride_report_write
CREATE OR REPLACE FUNCTION private.guard_ride_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_passenger_profile_id UUID;
  v_driver_profile_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF v_actor_profile_id IS NULL THEN RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501'; END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT r.passenger_profile_id, r.driver_profile_id
    INTO v_passenger_profile_id, v_driver_profile_id
    FROM public.ride_requests r WHERE r.id = NEW.ride_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'ride_not_found' USING ERRCODE = 'P0002'; END IF;
    IF v_actor_profile_id = v_passenger_profile_id THEN NEW.reporter_type := 'passenger';
    ELSIF v_actor_profile_id = v_driver_profile_id THEN NEW.reporter_type := 'driver';
    ELSIF COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN NEW.reporter_type := 'admin';
    ELSE RAISE EXCEPTION 'ride_report_participant_required' USING ERRCODE = '42501';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext('ride_report_rate'), hashtext(v_actor_profile_id::text));
    SELECT count(*)::INTEGER INTO v_recent_count FROM public.ride_reports r
    WHERE r.reporter_profile_id = v_actor_profile_id AND r.created_at >= now() - interval '1 hour';
    IF v_recent_count >= 10 THEN RAISE EXCEPTION 'ride_report_rate_limit_exceeded' USING ERRCODE = 'P0001'; END IF;
    IF EXISTS (
      SELECT 1 FROM public.ride_reports r
      WHERE r.ride_id = NEW.ride_id AND r.reporter_profile_id = v_actor_profile_id
        AND r.report_type = NEW.report_type AND r.status IN ('pending', 'under_review')
    ) THEN RAISE EXCEPTION 'ride_report_already_pending' USING ERRCODE = '23505'; END IF;
    NEW.reporter_profile_id := v_actor_profile_id;
    NEW.title := trim(NEW.title); NEW.description := trim(NEW.description);
    NEW.status := 'pending'; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL;
    NEW.resolution_notes := NULL; NEW.admin_notes := NULL;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.ride_id IS DISTINCT FROM OLD.ride_id
       OR NEW.reporter_profile_id IS DISTINCT FROM OLD.reporter_profile_id
       OR NEW.reporter_type IS DISTINCT FROM OLD.reporter_type
       OR NEW.report_type IS DISTINCT FROM OLD.report_type OR NEW.severity IS DISTINCT FROM OLD.severity
       OR NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.evidence_urls IS DISTINCT FROM OLD.evidence_urls
       OR NEW.location_lat IS DISTINCT FROM OLD.location_lat OR NEW.location_lng IS DISTINCT FROM OLD.location_lng
       OR NEW.reported_at IS DISTINCT FROM OLD.reported_at OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'ride_report_identity_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
      RAISE EXCEPTION 'ride_report_review_not_authorized' USING ERRCODE = '42501';
    END IF;
    IF OLD.status IN ('resolved', 'dismissed') AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'ride_report_is_terminal' USING ERRCODE = '22023';
    END IF;
    IF NEW.status NOT IN ('under_review', 'resolved', 'dismissed') THEN
      RAISE EXCEPTION 'invalid_ride_report_status' USING ERRCODE = '22023';
    END IF;
    NEW.reviewed_by := v_actor_profile_id; NEW.reviewed_at := now();
    NEW.resolution_notes := NULLIF(trim(COALESCE(NEW.resolution_notes, '')), '');
    NEW.admin_notes := NULLIF(trim(COALESCE(NEW.admin_notes, '')), '');
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_ride_report_write() FROM PUBLIC;
DROP TRIGGER IF EXISTS trg_guard_ride_report_write ON public.ride_reports;
CREATE TRIGGER trg_guard_ride_report_write BEFORE INSERT OR UPDATE ON public.ride_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_ride_report_write();
DROP TRIGGER IF EXISTS trg_audit_ride_report_write ON public.ride_reports;
CREATE TRIGGER trg_audit_ride_report_write AFTER INSERT OR UPDATE ON public.ride_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_sensitive_report_write('ride');

DROP POLICY IF EXISTS "Users can create reports" ON public.ride_reports;
DROP POLICY IF EXISTS ride_reports_insert_participant ON public.ride_reports;
CREATE POLICY ride_reports_insert_participant ON public.ride_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_profile_id = private.current_active_profile_id());
DROP POLICY IF EXISTS "Users can view their own reports" ON public.ride_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.ride_reports;
DROP POLICY IF EXISTS ride_reports_select_own_or_admin ON public.ride_reports;
CREATE POLICY ride_reports_select_own_or_admin ON public.ride_reports FOR SELECT TO authenticated
  USING (
    reporter_profile_id = private.current_active_profile_id()
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );
DROP POLICY IF EXISTS "Admins can update reports" ON public.ride_reports;
DROP POLICY IF EXISTS ride_reports_admin_update ON public.ride_reports;
CREATE POLICY ride_reports_admin_update ON public.ride_reports FOR UPDATE TO authenticated
  USING (COALESCE(private.is_admin_user(auth.uid()), FALSE))
  WITH CHECK (COALESCE(private.is_admin_user(auth.uid()), FALSE));
REVOKE INSERT, UPDATE, DELETE ON public.ride_reports FROM authenticated;

-- security-authority: internal-function private.create_ride_report
CREATE OR REPLACE FUNCTION private.create_ride_report(
  p_ride_id UUID,
  p_report_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_evidence_urls TEXT[] DEFAULT NULL,
  p_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_location_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS public.ride_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.ride_reports;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501'; END IF;
  IF p_report_type NOT IN ('safety_concern', 'driver_behavior', 'passenger_behavior', 'route_issue', 'payment_issue', 'vehicle_condition', 'cancellation_abuse', 'fraud_suspicion', 'other') THEN
    RAISE EXCEPTION 'invalid_ride_report_type' USING ERRCODE = '22023';
  END IF;
  IF p_severity NOT IN ('low', 'medium', 'high', 'critical') THEN
    RAISE EXCEPTION 'invalid_ride_report_severity' USING ERRCODE = '22023';
  END IF;
  IF char_length(trim(COALESCE(p_title, ''))) NOT BETWEEN 3 AND 160
     OR char_length(trim(COALESCE(p_description, ''))) NOT BETWEEN 10 AND 4000 THEN
    RAISE EXCEPTION 'invalid_ride_report_content' USING ERRCODE = '22023';
  END IF;
  IF p_location_lat IS NOT NULL AND (p_location_lat < -90 OR p_location_lat > 90) THEN
    RAISE EXCEPTION 'invalid_ride_report_latitude' USING ERRCODE = '22023';
  END IF;
  IF p_location_lng IS NOT NULL AND (p_location_lng < -180 OR p_location_lng > 180) THEN
    RAISE EXCEPTION 'invalid_ride_report_longitude' USING ERRCODE = '22023';
  END IF;
  IF cardinality(COALESCE(p_evidence_urls, ARRAY[]::TEXT[])) > 5
     OR EXISTS (
       SELECT 1 FROM unnest(COALESCE(p_evidence_urls, ARRAY[]::TEXT[])) url
       WHERE char_length(url) > 2048 OR url !~ '^https://'
     ) THEN RAISE EXCEPTION 'invalid_ride_report_evidence' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.ride_reports(
    ride_id, reporter_profile_id, reporter_type, report_type, severity,
    title, description, evidence_urls, location_lat, location_lng
  ) VALUES (
    p_ride_id, private.current_active_profile_id(), 'passenger', p_report_type,
    p_severity, p_title, p_description, p_evidence_urls, p_location_lat, p_location_lng
  ) RETURNING * INTO v_report;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.create_ride_report
CREATE OR REPLACE FUNCTION public.create_ride_report(
  p_ride_id UUID,
  p_report_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_evidence_urls TEXT[] DEFAULT NULL,
  p_location_lat DOUBLE PRECISION DEFAULT NULL,
  p_location_lng DOUBLE PRECISION DEFAULT NULL
)
RETURNS public.ride_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$
  SELECT private.create_ride_report(
    p_ride_id, p_report_type, p_severity, p_title, p_description,
    p_evidence_urls, p_location_lat, p_location_lng
  );
$$;

-- security-authority: internal-function private.moderate_ride_report
CREATE OR REPLACE FUNCTION private.moderate_ride_report(
  p_report_id UUID,
  p_status TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.ride_reports
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private, pg_temp
AS $$
DECLARE v_report public.ride_reports;
BEGIN
  IF NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'ride_report_review_not_authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.ride_reports
  SET status = p_status, resolution_notes = p_resolution_notes, admin_notes = p_admin_notes
  WHERE id = p_report_id RETURNING * INTO v_report;
  IF v_report.id IS NULL THEN RAISE EXCEPTION 'ride_report_not_found' USING ERRCODE = 'P0002'; END IF;
  RETURN v_report;
END;
$$;

-- security-authority: public-rpc public.moderate_ride_report
CREATE OR REPLACE FUNCTION public.moderate_ride_report(
  p_report_id UUID,
  p_status TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS public.ride_reports
LANGUAGE sql SECURITY INVOKER SET search_path = private, pg_temp
AS $$ SELECT private.moderate_ride_report(p_report_id, p_status, p_resolution_notes, p_admin_notes); $$;

REVOKE ALL ON FUNCTION private.create_ride_report(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.moderate_ride_report(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.create_ride_report(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION private.moderate_ride_report(UUID, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_ride_report(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], DOUBLE PRECISION, DOUBLE PRECISION) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.moderate_ride_report(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_ride_report(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_ride_report(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON TABLE private.sensitive_report_audit_log IS
  'Append-only metadata envelope for sensitive report create/review commands; excludes free-text content and evidence URLs.';
COMMENT ON FUNCTION public.create_classified_report(UUID, TEXT, TEXT) IS
  'Creates a classified report with reporter derived from the active profile.';
COMMENT ON FUNCTION public.moderate_classified_report(UUID, TEXT, TEXT) IS
  'Reviews a classified report with moderator identity derived in the database.';
COMMENT ON FUNCTION public.create_vaga_report(UUID, TEXT, TEXT) IS
  'Creates a job report with reporter derived from the active profile.';
COMMENT ON FUNCTION public.moderate_vaga_report(UUID, TEXT, TEXT) IS
  'Reviews a job report with moderator identity derived in the database.';
COMMENT ON FUNCTION public.create_review_report(UUID, TEXT, TEXT) IS
  'Creates a review report with reporter derived from the active profile.';
COMMENT ON FUNCTION public.moderate_review_report(UUID, TEXT, TEXT) IS
  'Reviews a review report with moderator identity derived in the database.';
COMMENT ON FUNCTION public.create_ride_report(UUID, TEXT, TEXT, TEXT, TEXT, TEXT[], DOUBLE PRECISION, DOUBLE PRECISION) IS
  'Creates a ride report with participant identity and role derived in the database.';
COMMENT ON FUNCTION public.moderate_ride_report(UUID, TEXT, TEXT, TEXT) IS
  'Reviews a ride report with moderator identity derived in the database.';
