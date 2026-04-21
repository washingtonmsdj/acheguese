-- Admin notifications governance RPCs
-- Closes admin coverage for templates, channels and delivery audit
-- without exposing direct table access in UI.

CREATE OR REPLACE FUNCTION public.admin_notifications_assert_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_settings_stats()
RETURNS TABLE (
  total_users_with_settings bigint,
  email_enabled bigint,
  push_enabled bigint,
  weekly_digest_enabled bigint,
  new_messages_enabled bigint,
  community_updates_enabled bigint,
  business_updates_enabled bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_users_with_settings,
    COUNT(*) FILTER (WHERE np.email_enabled <> FALSE)::bigint AS email_enabled,
    COUNT(*) FILTER (WHERE np.push_enabled <> FALSE)::bigint AS push_enabled,
    COUNT(*) FILTER (WHERE np.transactional_enabled <> FALSE)::bigint AS weekly_digest_enabled,
    COUNT(*) FILTER (WHERE np.inapp_enabled <> FALSE)::bigint AS new_messages_enabled,
    COUNT(*) FILTER (WHERE np.social_enabled <> FALSE)::bigint AS community_updates_enabled,
    COUNT(*) FILTER (WHERE np.system_enabled <> FALSE)::bigint AS business_updates_enabled
  FROM public.notification_preferences np;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_settings_user_ids(
  p_user_ids uuid[]
)
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  SELECT np.user_id
  FROM public.notification_preferences np
  WHERE np.user_id = ANY(p_user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_user_settings(
  p_user_id uuid
)
RETURNS TABLE (settings jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  SELECT to_jsonb(np.*) AS settings
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_channel_stats()
RETURNS TABLE (
  total_push_subscriptions bigint,
  active_push_subscriptions bigint,
  inactive_push_subscriptions bigint,
  users_with_push_subscriptions bigint,
  email_sent_24h bigint,
  email_delivered_24h bigint,
  email_failed_24h bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_push_subscriptions,
    COUNT(*) FILTER (WHERE ps.is_active = TRUE)::bigint AS active_push_subscriptions,
    COUNT(*) FILTER (WHERE ps.is_active = FALSE)::bigint AS inactive_push_subscriptions,
    COUNT(DISTINCT ps.user_id)::bigint AS users_with_push_subscriptions,
    (
      SELECT COUNT(*)::bigint
      FROM public.email_logs el
      WHERE el.created_at >= NOW() - INTERVAL '24 hours'
    ) AS email_sent_24h,
    (
      SELECT COUNT(*)::bigint
      FROM public.email_logs el
      WHERE el.created_at >= NOW() - INTERVAL '24 hours'
        AND el.status IN ('delivered', 'opened', 'clicked')
    ) AS email_delivered_24h,
    (
      SELECT COUNT(*)::bigint
      FROM public.email_logs el
      WHERE el.created_at >= NOW() - INTERVAL '24 hours'
        AND el.status IN ('failed', 'bounced')
    ) AS email_failed_24h
  FROM public.push_subscriptions ps;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_template_stats(
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  template text,
  total bigint,
  sent bigint,
  delivered bigint,
  failed bigint,
  opened bigint,
  clicked bigint,
  last_sent_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(el.template, ''), 'sem_template') AS template,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE el.status = 'sent')::bigint AS sent,
    COUNT(*) FILTER (WHERE el.status = 'delivered')::bigint AS delivered,
    COUNT(*) FILTER (WHERE el.status IN ('failed', 'bounced'))::bigint AS failed,
    COUNT(*) FILTER (WHERE el.status = 'opened')::bigint AS opened,
    COUNT(*) FILTER (WHERE el.status = 'clicked')::bigint AS clicked,
    MAX(el.created_at) AS last_sent_at
  FROM public.email_logs el
  GROUP BY COALESCE(NULLIF(el.template, ''), 'sem_template')
  ORDER BY COUNT(*) DESC, MAX(el.created_at) DESC
  LIMIT GREATEST(COALESCE(p_limit, 10), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_notifications_get_delivery_audit(
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 20,
  p_template text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  template text,
  subject text,
  status text,
  provider_id text,
  error_message text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := GREATEST(COALESCE(p_limit, 20), 1);
  v_page integer := GREATEST(COALESCE(p_page, 1), 1);
  v_offset integer := (v_page - 1) * v_limit;
BEGIN
  PERFORM public.admin_notifications_assert_access();

  RETURN QUERY
  WITH filtered AS (
    SELECT
      el.id,
      el.user_id,
      el.email,
      el.template,
      el.subject,
      el.status,
      el.provider_id,
      el.error_message,
      el.metadata,
      el.created_at
    FROM public.email_logs el
    WHERE (p_template IS NULL OR p_template = '' OR el.template = p_template)
      AND (p_status IS NULL OR p_status = '' OR el.status = p_status)
      AND (
        p_search IS NULL OR p_search = ''
        OR el.email ILIKE '%' || p_search || '%'
        OR el.subject ILIKE '%' || p_search || '%'
        OR COALESCE(el.error_message, '') ILIKE '%' || p_search || '%'
      )
  )
  SELECT
    f.id,
    f.user_id,
    f.email,
    COALESCE(NULLIF(f.template, ''), 'sem_template') AS template,
    f.subject,
    f.status,
    f.provider_id,
    f.error_message,
    COALESCE(f.metadata, '{}'::jsonb) AS metadata,
    f.created_at,
    COUNT(*) OVER ()::bigint AS total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_notifications_assert_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_settings_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_settings_user_ids(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_user_settings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_channel_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_template_stats(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notifications_get_delivery_audit(integer, integer, text, text, text) TO authenticated;
