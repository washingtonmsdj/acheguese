-- Production hardening for territorial community issues.
-- All mutations, counters and audit events are server-owned and atomic.

CREATE INDEX IF NOT EXISTS idx_community_issues_location_created_id
  ON public.community_issues (location_id, created_at DESC, id DESC)
  WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_community_issue_reports_profile_created
  ON public.community_issue_reports (profile_id, created_at DESC);

WITH ranked_reports AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY issue_id, profile_id
      ORDER BY created_at ASC, id ASC
    ) AS duplicate_rank
  FROM public.community_issue_reports
)
DELETE FROM public.community_issue_reports report
USING ranked_reports ranked
WHERE report.id = ranked.id
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_issue_reports_unique_profile
  ON public.community_issue_reports (issue_id, profile_id);

ALTER TABLE public.community_issue_reports
  ALTER COLUMN profile_id SET DEFAULT private.current_active_profile_id();

CREATE TABLE IF NOT EXISTS private.community_issue_support_rate_limits (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.community_issues(id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  toggle_count INTEGER NOT NULL DEFAULT 0 CHECK (toggle_count >= 0),
  last_toggled_at TIMESTAMPTZ,
  PRIMARY KEY (profile_id, issue_id)
);

REVOKE ALL ON TABLE private.community_issue_support_rate_limits
  FROM PUBLIC, anon, authenticated;

-- security-authority: internal-function private.create_community_issue
CREATE OR REPLACE FUNCTION private.create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_location public.locations%ROWTYPE;
  v_location_id UUID;
  v_issue_id UUID;
  v_category TEXT := lower(btrim(COALESCE(payload->>'category', '')));
  v_title TEXT := btrim(COALESCE(payload->>'title', ''));
  v_description TEXT := btrim(COALESCE(payload->>'description', ''));
  v_address_reference TEXT := NULLIF(btrim(COALESCE(payload->>'address_reference', '')), '');
  v_priority TEXT := lower(btrim(COALESCE(payload->>'priority', 'media')));
  v_images TEXT[] := '{}'::TEXT[];
  v_recent_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;
  IF v_actor_profile_id IS NULL THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  BEGIN
    v_location_id := (payload->>'location_id')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END;

  IF v_location_id IS NULL THEN
    RETURN jsonb_build_object('error', 'location_id_required');
  END IF;

  SELECT location.*
  INTO v_location
  FROM public.locations location
  WHERE location.id = v_location_id
    AND location.status::TEXT = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'location_not_found');
  END IF;
  IF v_location.type::TEXT <> 'district' THEN
    RETURN jsonb_build_object('error', 'location_must_be_district');
  END IF;
  IF NOT private.auth_has_verified_residence(
    v_actor_profile_id,
    v_location_id
  ) THEN
    RETURN jsonb_build_object('error', 'verified_residence_required');
  END IF;

  IF v_category NOT IN (
    'buraco_via',
    'calcada_danificada',
    'iluminacao_publica',
    'lixo_acumulado',
    'alagamento_cronico',
    'arvore_risco',
    'sinalizacao_danificada',
    'esgoto_aberto',
    'pichacao_vandalismo',
    'outro'
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_category');
  END IF;
  IF char_length(v_title) NOT BETWEEN 10 AND 100 THEN
    RETURN jsonb_build_object('error', 'invalid_title_length');
  END IF;
  IF char_length(v_description) NOT BETWEEN 20 AND 500 THEN
    RETURN jsonb_build_object('error', 'invalid_description_length');
  END IF;
  IF v_address_reference IS NOT NULL
     AND char_length(v_address_reference) > 300 THEN
    RETURN jsonb_build_object('error', 'invalid_address_reference');
  END IF;
  IF v_priority NOT IN ('baixa', 'media', 'alta', 'urgente') THEN
    RETURN jsonb_build_object('error', 'invalid_priority');
  END IF;

  IF payload ? 'images' THEN
    IF jsonb_typeof(payload->'images') <> 'array'
       OR jsonb_array_length(payload->'images') > 4 THEN
      RETURN jsonb_build_object('error', 'invalid_images');
    END IF;
    SELECT COALESCE(array_agg(image_url), '{}'::TEXT[])
    INTO v_images
    FROM jsonb_array_elements_text(payload->'images') AS image_url;

    IF EXISTS (
      SELECT 1
      FROM unnest(v_images) AS image_url
      WHERE image_url !~ (
        '^https://[^/]+/storage/v1/object/public/post_images/'
        || v_actor_profile_id::TEXT
        || '/posts/[0-9]+-[0-9a-f-]+[.]jpg(?:[?].*)?$'
      )
    ) THEN
      RETURN jsonb_build_object('error', 'invalid_images');
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('community-issue-create:' || v_actor_profile_id::TEXT, 0)
  );

  SELECT count(*)::INTEGER
  INTO v_recent_count
  FROM public.community_social_audit_log audit
  WHERE audit.actor_profile_id = v_actor_profile_id
    AND audit.target_type = 'community_issue'
    AND audit.action = 'insert'
    AND audit.created_at >= now() - interval '1 day';

  IF v_recent_count >= 5 THEN
    RETURN jsonb_build_object('error', 'rate_limit_exceeded');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.community_issues issue
    WHERE issue.author_profile_id = v_actor_profile_id
      AND issue.category = v_category
      AND issue.location_id = v_location_id
      AND issue.created_at >= now() - interval '1 day'
      AND issue.removed_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'duplicate_issue');
  END IF;

  INSERT INTO public.community_issues (
    author_profile_id,
    profile_id,
    location_id,
    category,
    status,
    priority,
    title,
    description,
    images,
    neighborhood,
    neighborhood_display,
    city,
    address_reference,
    support_count,
    comments_count,
    report_count,
    under_review
  )
  SELECT
    v_actor_profile_id,
    v_actor_profile_id,
    v_location_id,
    v_category,
    'aberto',
    v_priority,
    v_title,
    v_description,
    v_images,
    lower(btrim(v_location.name)),
    v_location.name,
    lower(btrim(COALESCE(parent.name, v_location.name))),
    v_address_reference,
    0,
    0,
    0,
    FALSE
  FROM (SELECT 1) seed
  LEFT JOIN public.locations parent ON parent.id = v_location.parent_id
  RETURNING id INTO v_issue_id;

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
    'insert',
    'community_issue',
    v_issue_id,
    v_location_id,
    jsonb_build_object('category', v_category, 'priority', v_priority)
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'issue_id', v_issue_id,
    'location_id', v_location_id
  );
END;
$$;

-- security-authority: internal-function private.mutate_community_issue
CREATE OR REPLACE FUNCTION private.mutate_community_issue(
  p_issue_id UUID,
  p_action TEXT,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT NULL,
  p_address_reference TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_issue public.community_issues%ROWTYPE;
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_is_admin BOOLEAN := COALESCE(private.is_admin_user(auth.uid()), FALSE);
  v_is_owner BOOLEAN;
  v_operation TEXT;
  v_metadata JSONB := '{}'::JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_issue
  FROM public.community_issues issue
  WHERE issue.id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_issue_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_is_owner := v_actor_profile_id IS NOT NULL
    AND v_issue.author_profile_id = v_actor_profile_id;

  IF p_action = 'update' THEN
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'community_issue_update_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    IF v_issue.removed_at IS NOT NULL
       OR v_issue.status NOT IN ('aberto', 'em_analise') THEN
      RAISE EXCEPTION 'community_issue_is_not_editable' USING ERRCODE = '42501';
    END IF;
    IF p_title IS NULL
       AND p_description IS NULL
       AND p_images IS NULL
       AND p_address_reference IS NULL THEN
      RAISE EXCEPTION 'community_issue_update_is_empty' USING ERRCODE = '22023';
    END IF;
    IF p_title IS NOT NULL
       AND char_length(btrim(p_title)) NOT BETWEEN 10 AND 100 THEN
      RAISE EXCEPTION 'invalid_title_length' USING ERRCODE = '22023';
    END IF;
    IF p_description IS NOT NULL
       AND char_length(btrim(p_description)) NOT BETWEEN 20 AND 500 THEN
      RAISE EXCEPTION 'invalid_description_length' USING ERRCODE = '22023';
    END IF;
    IF p_address_reference IS NOT NULL
       AND char_length(btrim(p_address_reference)) > 300 THEN
      RAISE EXCEPTION 'invalid_address_reference' USING ERRCODE = '22023';
    END IF;
    IF p_images IS NOT NULL AND (
      cardinality(p_images) > 4
      OR EXISTS (
        SELECT 1
        FROM unnest(p_images) AS image_url
        WHERE image_url !~ (
          '^https://[^/]+/storage/v1/object/public/post_images/'
          || v_issue.author_profile_id::TEXT
          || '/posts/[0-9]+-[0-9a-f-]+[.]jpg(?:[?].*)?$'
        )
      )
    ) THEN
      RAISE EXCEPTION 'invalid_images' USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_issues
    SET title = COALESCE(btrim(p_title), title),
        description = COALESCE(btrim(p_description), description),
        images = COALESCE(p_images, images),
        address_reference = CASE
          WHEN p_address_reference IS NULL THEN address_reference
          ELSE NULLIF(btrim(p_address_reference), '')
        END,
        updated_at = now()
    WHERE id = p_issue_id;
    v_operation := 'updated';
  ELSIF p_action = 'status' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;
    IF p_status NOT IN (
      'aberto', 'em_analise', 'em_andamento', 'resolvido', 'rejeitado'
    ) THEN
      RAISE EXCEPTION 'invalid_community_issue_status' USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_issues
    SET status = p_status,
        resolved_at = CASE WHEN p_status = 'resolvido' THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = p_issue_id;
    v_operation := 'status_changed';
    v_metadata := jsonb_build_object(
      'previous_status', v_issue.status,
      'new_status', p_status
    );
  ELSIF p_action = 'priority' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;
    IF p_priority NOT IN ('baixa', 'media', 'alta', 'urgente') THEN
      RAISE EXCEPTION 'invalid_community_issue_priority'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_issues
    SET priority = p_priority, updated_at = now()
    WHERE id = p_issue_id;
    v_operation := 'priority_changed';
    v_metadata := jsonb_build_object(
      'previous_priority', v_issue.priority,
      'new_priority', p_priority
    );
  ELSIF p_action = 'remove' THEN
    IF NOT (v_is_owner OR v_is_admin) THEN
      RAISE EXCEPTION 'community_issue_remove_not_authorized'
        USING ERRCODE = '42501';
    END IF;
    IF p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 500 THEN
      RAISE EXCEPTION 'invalid_community_issue_removal_reason'
        USING ERRCODE = '22023';
    END IF;

    UPDATE public.community_issues
    SET removed_at = now(),
        removal_reason = btrim(p_reason),
        updated_at = now()
    WHERE id = p_issue_id;
    v_operation := 'removed';
    v_metadata := jsonb_build_object('reason', btrim(p_reason));
  ELSIF p_action = 'clear_review' THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
    END IF;
    UPDATE public.community_issues
    SET under_review = FALSE, updated_at = now()
    WHERE id = p_issue_id;
    v_operation := 'reviewed_cleared';
  ELSE
    RAISE EXCEPTION 'invalid_community_issue_action' USING ERRCODE = '22023';
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
    'community_issue',
    p_issue_id,
    v_issue.location_id,
    jsonb_set(v_metadata, '{operation}', to_jsonb(v_operation), TRUE)
  );
END;
$$;

-- security-authority: internal-function private.toggle_community_issue_support
CREATE OR REPLACE FUNCTION private.toggle_community_issue_support(p_issue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_issue public.community_issues%ROWTYPE;
  v_support_id UUID;
  v_rate private.community_issue_support_rate_limits%ROWTYPE;
  v_supported BOOLEAN;
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_issue
  FROM public.community_issues issue
  WHERE issue.id = p_issue_id
    AND issue.removed_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_issue_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF NOT private.auth_has_verified_residence(
    v_actor_profile_id,
    v_issue.location_id
  ) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'community-issue-support:' || v_actor_profile_id::TEXT || ':' || p_issue_id::TEXT,
      0
    )
  );

  SELECT * INTO v_rate
  FROM private.community_issue_support_rate_limits rate_limit
  WHERE rate_limit.profile_id = v_actor_profile_id
    AND rate_limit.issue_id = p_issue_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_rate.last_toggled_at IS NOT NULL
       AND v_rate.last_toggled_at > now() - interval '500 milliseconds' THEN
      RAISE EXCEPTION 'community_issue_support_too_fast' USING ERRCODE = 'P0001';
    END IF;
    IF v_rate.window_started_at > now() - interval '1 minute'
       AND v_rate.toggle_count >= 20 THEN
      RAISE EXCEPTION 'community_issue_support_rate_limit_exceeded'
        USING ERRCODE = 'P0001';
    END IF;
    UPDATE private.community_issue_support_rate_limits
    SET window_started_at = CASE
          WHEN window_started_at <= now() - interval '1 minute' THEN now()
          ELSE window_started_at
        END,
        toggle_count = CASE
          WHEN window_started_at <= now() - interval '1 minute' THEN 1
          ELSE toggle_count + 1
        END,
        last_toggled_at = now()
    WHERE profile_id = v_actor_profile_id AND issue_id = p_issue_id;
  ELSE
    INSERT INTO private.community_issue_support_rate_limits (
      profile_id, issue_id, window_started_at, toggle_count, last_toggled_at
    ) VALUES (v_actor_profile_id, p_issue_id, now(), 1, now());
  END IF;

  SELECT support.id INTO v_support_id
  FROM public.community_issue_supports support
  WHERE support.issue_id = p_issue_id
    AND support.profile_id = v_actor_profile_id
  FOR UPDATE;

  IF v_support_id IS NULL THEN
    INSERT INTO public.community_issue_supports (issue_id, profile_id)
    VALUES (p_issue_id, v_actor_profile_id);
    v_supported := TRUE;
  ELSE
    DELETE FROM public.community_issue_supports WHERE id = v_support_id;
    v_supported := FALSE;
  END IF;

  SELECT issue.support_count INTO v_count
  FROM public.community_issues issue WHERE issue.id = p_issue_id;
  RETURN jsonb_build_object(
    'supported', v_supported,
    'new_count', COALESCE(v_count, 0)
  );
END;
$$;

-- security-authority: internal-function private.guard_community_issue_report
CREATE OR REPLACE FUNCTION private.guard_community_issue_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_actor_profile_id UUID := private.current_active_profile_id();
  v_issue public.community_issues%ROWTYPE;
  v_recent_count INTEGER;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_issue
  FROM public.community_issues issue
  WHERE issue.id = NEW.issue_id
    AND issue.removed_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'community_issue_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_issue.author_profile_id = v_actor_profile_id THEN
    RAISE EXCEPTION 'self_report_is_not_allowed' USING ERRCODE = '42501';
  END IF;
  IF NOT private.auth_has_verified_residence(
    v_actor_profile_id,
    v_issue.location_id
  ) THEN
    RAISE EXCEPTION 'verified_residence_required' USING ERRCODE = '42501';
  END IF;
  IF NEW.reason NOT IN (
    'duplicate', 'false_report', 'inappropriate_content', 'spam', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_community_issue_report_reason'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('community-issue-report:' || v_actor_profile_id::TEXT, 0)
  );
  SELECT count(*)::INTEGER INTO v_recent_count
  FROM public.community_issue_reports report
  WHERE report.profile_id = v_actor_profile_id
    AND report.created_at >= now() - interval '1 day';
  IF v_recent_count >= 20 THEN
    RAISE EXCEPTION 'community_issue_report_rate_limit_exceeded'
      USING ERRCODE = 'P0001';
  END IF;

  NEW.profile_id := v_actor_profile_id;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_community_issue_support_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_issue_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.issue_id ELSE NEW.issue_id END;
BEGIN
  UPDATE public.community_issues issue
  SET support_count = (
    SELECT count(*)::INTEGER FROM public.community_issue_supports support
    WHERE support.issue_id = v_issue_id
  ),
      updated_at = now()
  WHERE issue.id = v_issue_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_community_issue_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  v_issue_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.issue_id ELSE NEW.issue_id END;
  v_count INTEGER;
BEGIN
  SELECT count(*)::INTEGER INTO v_count
  FROM public.community_issue_reports report
  WHERE report.issue_id = v_issue_id;
  UPDATE public.community_issues
  SET report_count = v_count,
      under_review = v_count >= 3,
      updated_at = now()
  WHERE id = v_issue_id;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.audit_community_issue_report()
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
    'community_issue_report',
    NEW.id,
    issue.location_id,
    jsonb_build_object('issue_id', NEW.issue_id, 'reason', NEW.reason)
  FROM public.community_issues issue
  WHERE issue.id = NEW.issue_id;
  RETURN NEW;
END;
$$;

-- security-authority: internal-function private.get_community_issue_admin_stats
CREATE OR REPLACE FUNCTION private.get_community_issue_admin_stats()
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

  WITH issue_stats AS (
    SELECT
      count(*)::BIGINT AS total,
      count(*) FILTER (WHERE status = 'aberto')::BIGINT AS aberto,
      count(*) FILTER (WHERE status = 'em_analise')::BIGINT AS em_analise,
      count(*) FILTER (WHERE status = 'em_andamento')::BIGINT AS em_andamento,
      count(*) FILTER (WHERE status = 'resolvido')::BIGINT AS resolvido,
      count(*) FILTER (WHERE status = 'rejeitado')::BIGINT AS rejeitado,
      count(*) FILTER (WHERE under_review)::BIGINT AS under_review,
      COALESCE(sum(report_count), 0)::BIGINT AS total_reports,
      COALESCE(sum(support_count), 0)::BIGINT AS total_supports
    FROM public.community_issues
  ),
  category_stats AS (
    SELECT COALESCE(jsonb_object_agg(category, category_count), '{}'::JSONB) AS categories
    FROM (
      SELECT COALESCE(category, 'outro') AS category, count(*)::BIGINT AS category_count
      FROM public.community_issues
      GROUP BY COALESCE(category, 'outro')
    ) grouped_categories
  )
  SELECT jsonb_build_object(
    'total', issue_stats.total,
    'aberto', issue_stats.aberto,
    'em_analise', issue_stats.em_analise,
    'em_andamento', issue_stats.em_andamento,
    'resolvido', issue_stats.resolvido,
    'rejeitado', issue_stats.rejeitado,
    'under_review', issue_stats.under_review,
    'total_reports', issue_stats.total_reports,
    'total_supports', issue_stats.total_supports,
    'categories', category_stats.categories
  )
  INTO v_result
  FROM issue_stats
  CROSS JOIN category_stats;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;

-- security-authority: internal-function private.list_community_issue_audit
CREATE OR REPLACE FUNCTION private.list_community_issue_audit(
  p_issue_id UUID,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  issue_id UUID,
  actor_id UUID,
  action TEXT,
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
  WHERE audit.target_type = 'community_issue'
    AND audit.target_id = p_issue_id
  ORDER BY audit.created_at ASC, audit.id ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 200), 1), 200);
END;
$$;

REVOKE ALL ON FUNCTION private.create_community_issue(JSONB)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mutate_community_issue(
  UUID, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.toggle_community_issue_support(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.guard_community_issue_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_community_issue_support_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_community_issue_report_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.audit_community_issue_report() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.get_community_issue_admin_stats()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.list_community_issue_audit(UUID, INTEGER)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.create_community_issue(JSONB)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.mutate_community_issue(
  UUID, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION private.toggle_community_issue_support(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_community_issue_admin_stats()
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.list_community_issue_audit(UUID, INTEGER)
  TO authenticated;

-- security-authority: public-rpc public.create_community_issue
CREATE OR REPLACE FUNCTION public.create_community_issue(payload JSONB)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.create_community_issue(payload);
$$;

-- security-authority: public-rpc public.mutate_community_issue
CREATE OR REPLACE FUNCTION public.mutate_community_issue(
  p_issue_id UUID,
  p_action TEXT,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT NULL,
  p_address_reference TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.mutate_community_issue(
    p_issue_id,
    p_action,
    p_title,
    p_description,
    p_images,
    p_address_reference,
    p_status,
    p_priority,
    p_reason
  );
$$;

-- security-authority: public-rpc public.toggle_community_issue_support
CREATE OR REPLACE FUNCTION public.toggle_community_issue_support(p_issue_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.toggle_community_issue_support(p_issue_id);
$$;

-- security-authority: public-rpc public.get_community_issue_admin_stats
CREATE OR REPLACE FUNCTION public.get_community_issue_admin_stats()
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT private.get_community_issue_admin_stats();
$$;

-- security-authority: public-rpc public.list_community_issue_audit
CREATE OR REPLACE FUNCTION public.list_community_issue_audit(
  p_issue_id UUID,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  issue_id UUID,
  actor_id UUID,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$
  SELECT * FROM private.list_community_issue_audit(p_issue_id, p_limit);
$$;

REVOKE ALL ON FUNCTION public.create_community_issue(JSONB)
  FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.mutate_community_issue(
  UUID, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.toggle_community_issue_support(UUID)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_issue_admin_stats()
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_community_issue_audit(UUID, INTEGER)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_community_issue(JSONB)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_community_issue(
  UUID, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_community_issue_support(UUID)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_issue_admin_stats()
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_issue_audit(UUID, INTEGER)
  TO authenticated;

DO $$
DECLARE
  trigger_row RECORD;
BEGIN
  FOR trigger_row IN
    SELECT trigger.tgname, relation.relname
    FROM pg_trigger trigger
    JOIN pg_class relation ON relation.oid = trigger.tgrelid
    JOIN pg_proc function ON function.oid = trigger.tgfoid
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN (
        'community_issue_supports',
        'community_issue_reports'
      )
      AND function.proname IN (
        'update_issue_support_count',
        'update_issue_report_count',
        'sync_community_issue_support_count',
        'sync_community_issue_report_count'
      )
      AND NOT trigger.tgisinternal
  LOOP
    EXECUTE format(
      'DROP TRIGGER %I ON public.%I',
      trigger_row.tgname,
      trigger_row.relname
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_guard_community_issue_report
  ON public.community_issue_reports;
CREATE TRIGGER trg_guard_community_issue_report
  BEFORE INSERT ON public.community_issue_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_community_issue_report();

DROP TRIGGER IF EXISTS trg_sync_community_issue_support_count
  ON public.community_issue_supports;
CREATE TRIGGER trg_sync_community_issue_support_count
  AFTER INSERT OR DELETE ON public.community_issue_supports
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_issue_support_count();

DROP TRIGGER IF EXISTS trg_sync_community_issue_report_count
  ON public.community_issue_reports;
CREATE TRIGGER trg_sync_community_issue_report_count
  AFTER INSERT OR DELETE ON public.community_issue_reports
  FOR EACH ROW EXECUTE FUNCTION private.sync_community_issue_report_count();

DROP TRIGGER IF EXISTS trg_audit_community_issue_report
  ON public.community_issue_reports;
CREATE TRIGGER trg_audit_community_issue_report
  AFTER INSERT ON public.community_issue_reports
  FOR EACH ROW EXECUTE FUNCTION private.audit_community_issue_report();

DROP FUNCTION IF EXISTS public.update_issue_support_count();
DROP FUNCTION IF EXISTS public.update_issue_report_count();

DO $$
DECLARE
  policy_row RECORD;
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'community_issues',
    'community_issue_supports',
    'community_issue_reports'
  ] LOOP
    FOR policy_row IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_row.policyname, table_name);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.community_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_issue_supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_issues_public_read
  ON public.community_issues FOR SELECT TO anon, authenticated
  USING (removed_at IS NULL);
CREATE POLICY community_issues_owner_or_admin_read
  ON public.community_issues FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(author_profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

CREATE POLICY community_issue_supports_own_read
  ON public.community_issue_supports FOR SELECT TO authenticated
  USING (private.auth_owns_active_profile(profile_id));

CREATE POLICY community_issue_reports_verified_insert
  ON public.community_issue_reports FOR INSERT TO authenticated
  WITH CHECK (
    private.auth_owns_active_profile(profile_id)
    AND EXISTS (
      SELECT 1 FROM public.community_issues issue
      WHERE issue.id = community_issue_reports.issue_id
        AND issue.removed_at IS NULL
        AND issue.author_profile_id <> community_issue_reports.profile_id
        AND private.auth_has_verified_residence(
          community_issue_reports.profile_id,
          issue.location_id
        )
    )
  );
CREATE POLICY community_issue_reports_own_or_admin_read
  ON public.community_issue_reports FOR SELECT TO authenticated
  USING (
    private.auth_owns_active_profile(profile_id)
    OR COALESCE(private.is_admin_user(auth.uid()), FALSE)
  );

REVOKE ALL ON TABLE public.community_issues FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_issues TO anon, authenticated;

REVOKE ALL ON TABLE public.community_issue_supports FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_issue_supports TO authenticated;

REVOKE ALL ON TABLE public.community_issue_reports FROM anon, authenticated;
GRANT SELECT ON TABLE public.community_issue_reports TO authenticated;
GRANT INSERT (issue_id, reason)
  ON TABLE public.community_issue_reports TO authenticated;

INSERT INTO public.community_social_audit_log (
  actor_user_id,
  actor_profile_id,
  action,
  target_type,
  target_id,
  location_id,
  metadata,
  created_at
)
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM auth.users account WHERE account.id = legacy.actor_id
  ) THEN legacy.actor_id ELSE NULL END,
  NULL,
  CASE
    WHEN legacy.action IN ('created', 'insert') THEN 'insert'
    WHEN legacy.action IN ('deleted', 'removed', 'delete') THEN 'delete'
    ELSE 'update'
  END,
  'community_issue',
  legacy.issue_id,
  issue.location_id,
  jsonb_set(
    COALESCE(legacy.metadata, '{}'::JSONB),
    '{operation}',
    to_jsonb(legacy.action),
    TRUE
  ),
  legacy.created_at
FROM public.community_issue_audit legacy
JOIN public.community_issues issue ON issue.id = legacy.issue_id;

DROP TABLE public.community_issue_audit;

COMMENT ON FUNCTION private.create_community_issue(JSONB) IS
  'Creates a territorial issue with active-profile identity, verified residence, validation, dedupe, anti-flood and canonical audit.';
COMMENT ON FUNCTION public.mutate_community_issue(
  UUID, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT
) IS 'Authenticated broker for owner/admin issue mutations with canonical audit.';
COMMENT ON FUNCTION public.toggle_community_issue_support(UUID) IS
  'Authenticated atomic issue support toggle with duplicate and flood protection.';
COMMENT ON FUNCTION public.list_community_issue_audit(UUID, INTEGER) IS
  'Admin-only bounded issue audit view backed by the canonical community social audit log.';
