-- Atomic, server-authorized alert reports and alert moderation mutations.

CREATE INDEX IF NOT EXISTS idx_community_alert_reports_reporter_created
  ON public.community_alert_reports (reporter_id, created_at DESC);

-- security-authority: internal-function private.guard_community_alert_report_write
CREATE OR REPLACE FUNCTION private.guard_community_alert_report_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID;
  v_alert public.community_alerts%ROWTYPE;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_actor_profile_id := private.current_active_profile_id();
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_alert
  FROM public.community_alerts alert
  WHERE alert.id = NEW.alert_id;

  IF NOT FOUND OR v_alert.status <> 'ativo' OR v_alert.removed_at IS NOT NULL THEN
    RAISE EXCEPTION 'active_alert_required' USING ERRCODE = '42501';
  END IF;

  IF v_alert.profile_id = v_actor_profile_id THEN
    RAISE EXCEPTION 'self_report_is_not_allowed' USING ERRCODE = '42501';
  END IF;

  IF v_alert.location_id IS NULL
     OR NOT private.auth_has_verified_residence(
       v_actor_profile_id,
       v_alert.location_id
     ) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('community-alert-report:' || v_actor_profile_id::TEXT, 0)
  );

  SELECT count(*)::INTEGER
  INTO v_recent_count
  FROM public.community_alert_reports report
  WHERE report.reporter_id = v_actor_profile_id
    AND report.created_at >= now() - interval '1 day';

  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'community_alert_report_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.reporter_id := v_actor_profile_id;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.get_community_alert_admin_stats
CREATE OR REPLACE FUNCTION private.get_community_alert_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  WITH alert_stats AS (
    SELECT
      count(*)::BIGINT AS total,
      count(*) FILTER (WHERE status = 'ativo')::BIGINT AS active,
      count(*) FILTER (WHERE status = 'encerrado')::BIGINT AS ended,
      count(*) FILTER (WHERE status = 'expirado')::BIGINT AS expired,
      count(*) FILTER (WHERE status = 'removido')::BIGINT AS removed,
      count(*) FILTER (WHERE under_review)::BIGINT AS under_review,
      COALESCE(sum(report_count), 0)::BIGINT AS total_reports
    FROM public.community_alerts
  ),
  category_stats AS (
    SELECT COALESCE(
      jsonb_object_agg(category, category_count),
      '{}'::JSONB
    ) AS categories
    FROM (
      SELECT type AS category, count(*)::BIGINT AS category_count
      FROM public.community_alerts
      GROUP BY type
    ) grouped_categories
  )
  SELECT jsonb_build_object(
    'total', alert_stats.total,
    'active', alert_stats.active,
    'ended', alert_stats.ended,
    'expired', alert_stats.expired,
    'removed', alert_stats.removed,
    'under_review', alert_stats.under_review,
    'total_reports', alert_stats.total_reports,
    'categories', category_stats.categories
  )
  INTO v_result
  FROM alert_stats
  CROSS JOIN category_stats;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- security-authority: internal-function private.audit_community_alert_report
CREATE OR REPLACE FUNCTION private.audit_community_alert_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  INSERT INTO public.community_social_audit_log (
    actor_user_id,
    actor_profile_id,
    action,
    target_type,
    target_id,
    location_id,
    metadata
  )
  SELECT
    auth.uid(),
    private.current_active_profile_id(),
    'insert',
    'community_alert_report',
    NEW.id,
    alert.location_id,
    jsonb_build_object(
      'alert_id', NEW.alert_id,
      'reason', NEW.reason
    )
  FROM public.community_alerts alert
  WHERE alert.id = NEW.alert_id;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.sync_community_alert_report_count
CREATE OR REPLACE FUNCTION private.sync_community_alert_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_alert_id UUID := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.alert_id
    ELSE NEW.alert_id
  END;
  v_report_count INTEGER;
BEGIN
  SELECT count(*)::INTEGER
  INTO v_report_count
  FROM public.community_alert_reports report
  WHERE report.alert_id = v_alert_id;

  UPDATE public.community_alerts
  SET report_count = v_report_count,
      under_review = v_report_count >= 3,
      updated_at = now()
  WHERE id = v_alert_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.mutate_community_alert
CREATE OR REPLACE FUNCTION private.mutate_community_alert(
  p_alert_id UUID,
  p_action TEXT,
  p_description TEXT DEFAULT NULL,
  p_still_risky BOOLEAN DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_alert public.community_alerts%ROWTYPE;
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_is_owner BOOLEAN;
  v_action_type TEXT;
  v_metadata JSONB := '{}'::JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_alert
  FROM public.community_alerts alert
  WHERE alert.id = p_alert_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_alert_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_is_owner := v_actor_profile_id IS NOT NULL
    AND v_alert.profile_id = v_actor_profile_id;

  IF p_action = 'update' THEN
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'community_alert_update_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    IF v_alert.status = 'removido' THEN
      RAISE EXCEPTION 'removed_alert_is_immutable' USING ERRCODE = '42501';
    END IF;
    IF p_description IS NULL AND p_still_risky IS NULL THEN
      RAISE EXCEPTION 'community_alert_update_is_empty' USING ERRCODE = '22023';
    END IF;
    IF p_description IS NOT NULL
       AND char_length(btrim(p_description)) NOT BETWEEN 3 AND 2000 THEN
      RAISE EXCEPTION 'invalid_community_alert_description'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_alerts
    SET description = COALESCE(btrim(p_description), description),
        status = CASE
          WHEN p_still_risky IS NULL THEN status
          WHEN p_still_risky THEN 'ativo'
          ELSE 'encerrado'
        END,
        edit_count = edit_count + 1
    WHERE id = p_alert_id;

    v_action_type := 'updated';
    v_metadata := jsonb_strip_nulls(
      jsonb_build_object('still_risky', p_still_risky)
    );
  ELSIF p_action = 'end' THEN
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'community_alert_end_not_authorized'
        USING ERRCODE = '42501';
    END IF;

    UPDATE public.community_alerts
    SET status = 'encerrado'
    WHERE id = p_alert_id AND status <> 'removido';

    v_action_type := 'ended';
  ELSIF p_action = 'remove' THEN
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'community_alert_remove_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    IF p_reason IS NULL
       OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 500 THEN
      RAISE EXCEPTION 'invalid_community_alert_removal_reason'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_alerts
    SET status = 'removido',
        removed_at = now(),
        removal_reason = btrim(p_reason)
    WHERE id = p_alert_id;

    v_action_type := 'removed';
    v_metadata := jsonb_build_object('reason', btrim(p_reason));
  ELSIF p_action = 'clear_review' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;

    UPDATE public.community_alerts
    SET under_review = FALSE
    WHERE id = p_alert_id;

    v_action_type := 'reviewed_cleared';
  ELSE
    RAISE EXCEPTION 'invalid_community_alert_action' USING ERRCODE = '22023';
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
    v_actor_profile_id,
    'update',
    'community_alert',
    p_alert_id,
    v_alert.location_id,
    jsonb_set(v_metadata, '{operation}', to_jsonb(v_action_type), TRUE)
  );
END;
$$;

-- security-authority: internal-function private.list_community_alert_audit
CREATE OR REPLACE FUNCTION private.list_community_alert_audit(
  p_alert_id UUID,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  alert_id UUID,
  actor_id UUID,
  action_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    audit.id,
    audit.target_id,
    audit.actor_user_id,
    COALESCE(audit.metadata->>'operation', audit.action),
    audit.metadata,
    audit.created_at
  FROM public.community_social_audit_log audit
  WHERE audit.target_type = 'community_alert'
    AND audit.target_id = p_alert_id
  ORDER BY audit.created_at ASC, audit.id ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 200);
END;
$$;

REVOKE ALL ON FUNCTION private.guard_community_alert_report_write()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_community_alert_report()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_community_alert_report_count()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.mutate_community_alert(
  UUID,
  TEXT,
  TEXT,
  BOOLEAN,
  TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.mutate_community_alert(
  UUID,
  TEXT,
  TEXT,
  BOOLEAN,
  TEXT
) TO authenticated;
REVOKE ALL ON FUNCTION private.get_community_alert_admin_stats()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_community_alert_admin_stats()
  TO authenticated;
REVOKE ALL ON FUNCTION private.list_community_alert_audit(UUID, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.list_community_alert_audit(UUID, INTEGER)
  TO authenticated;

-- security-authority: public-rpc public.mutate_community_alert
CREATE OR REPLACE FUNCTION public.mutate_community_alert(
  p_alert_id UUID,
  p_action TEXT,
  p_description TEXT DEFAULT NULL,
  p_still_risky BOOLEAN DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.mutate_community_alert(
    p_alert_id,
    p_action,
    p_description,
    p_still_risky,
    p_reason
  );
$$;

REVOKE ALL ON FUNCTION public.mutate_community_alert(
  UUID,
  TEXT,
  TEXT,
  BOOLEAN,
  TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mutate_community_alert(
  UUID,
  TEXT,
  TEXT,
  BOOLEAN,
  TEXT
) TO authenticated;

-- security-authority: public-rpc public.get_community_alert_admin_stats
CREATE OR REPLACE FUNCTION public.get_community_alert_admin_stats()
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.get_community_alert_admin_stats();
$$;

REVOKE ALL ON FUNCTION public.get_community_alert_admin_stats()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_alert_admin_stats()
  TO authenticated;

-- security-authority: public-rpc public.list_community_alert_audit
CREATE OR REPLACE FUNCTION public.list_community_alert_audit(
  p_alert_id UUID,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  alert_id UUID,
  actor_id UUID,
  action_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT * FROM private.list_community_alert_audit(p_alert_id, p_limit);
$$;

REVOKE ALL ON FUNCTION public.list_community_alert_audit(UUID, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_community_alert_audit(UUID, INTEGER)
  TO authenticated;

DROP TRIGGER IF EXISTS trg_guard_community_alert_report_write
  ON public.community_alert_reports;
CREATE TRIGGER trg_guard_community_alert_report_write
  BEFORE INSERT ON public.community_alert_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_alert_report_write();

DROP TRIGGER IF EXISTS trg_audit_community_alert_report
  ON public.community_alert_reports;
CREATE TRIGGER trg_audit_community_alert_report
  AFTER INSERT ON public.community_alert_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_community_alert_report();

DROP TRIGGER IF EXISTS sync_community_alert_report_count_trigger
  ON public.community_alert_reports;
DROP TRIGGER IF EXISTS trg_sync_community_alert_report_count
  ON public.community_alert_reports;
CREATE TRIGGER trg_sync_community_alert_report_count
  AFTER INSERT OR DELETE ON public.community_alert_reports
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_alert_report_count();

DROP FUNCTION IF EXISTS public.increment_alert_edit_count(UUID);

DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_alert_reports'
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.community_alert_reports',
      policy_row.policyname
    );
  END LOOP;
END $$;

CREATE POLICY community_alert_reports_verified_insert
  ON public.community_alert_reports FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(reporter_id)
    AND EXISTS (
      SELECT 1
      FROM public.community_alerts alert
      WHERE alert.id = community_alert_reports.alert_id
        AND alert.status = 'ativo'
        AND alert.removed_at IS NULL
        AND alert.profile_id <> community_alert_reports.reporter_id
        AND private.auth_has_verified_residence(
          community_alert_reports.reporter_id,
          alert.location_id
        )
    )
  );

CREATE POLICY community_alert_reports_own_or_admin_read
  ON public.community_alert_reports FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(reporter_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

REVOKE ALL ON TABLE public.community_alert_reports FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_alert_reports TO authenticated;
GRANT INSERT (alert_id, reason, details)
  ON public.community_alert_reports TO authenticated;

COMMENT ON FUNCTION private.guard_community_alert_report_write() IS
  'Derives reporter identity and enforces local eligibility, self-report denial and anti-flood limits.';
COMMENT ON FUNCTION private.mutate_community_alert(UUID, TEXT, TEXT, BOOLEAN, TEXT) IS
  'Private atomic owner/admin alert mutation with server-owned audit.';
COMMENT ON FUNCTION public.mutate_community_alert(UUID, TEXT, TEXT, BOOLEAN, TEXT) IS
  'Authenticated SECURITY INVOKER broker for atomic community alert mutations.';
COMMENT ON FUNCTION private.get_community_alert_admin_stats() IS
  'Admin-only aggregate alert statistics without transferring the alert table to clients.';
COMMENT ON FUNCTION public.get_community_alert_admin_stats() IS
  'Authenticated SECURITY INVOKER broker for admin-only aggregate alert statistics.';
COMMENT ON FUNCTION public.list_community_alert_audit(UUID, INTEGER) IS
  'Admin-only bounded alert audit view backed by the canonical community social audit log.';
