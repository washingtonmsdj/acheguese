BEGIN;

CREATE INDEX IF NOT EXISTS idx_community_social_audit_created_keyset
  ON public.community_social_audit_log (created_at DESC, id DESC);

-- security-authority: public-rpc public.list_community_social_audit_events
CREATE OR REPLACE FUNCTION public.list_community_social_audit_events(
  p_before_created_at TIMESTAMPTZ DEFAULT NULL,
  p_before_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  actor_user_id UUID,
  actor_profile_id UUID,
  action TEXT,
  target_type TEXT,
  target_id UUID,
  location_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '3s'
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 30), 1), 51);
BEGIN
  IF auth.uid() IS NULL
     OR NOT COALESCE(private.is_admin_user(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'community_social_audit_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  IF (p_before_created_at IS NULL) <> (p_before_id IS NULL) THEN
    RAISE EXCEPTION 'incomplete_community_social_audit_cursor'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    audit.id,
    audit.actor_user_id,
    audit.actor_profile_id,
    audit.action,
    audit.target_type,
    audit.target_id,
    audit.location_id,
    audit.metadata,
    audit.created_at
  FROM public.community_social_audit_log audit
  WHERE p_before_created_at IS NULL
     OR (audit.created_at, audit.id) < (p_before_created_at, p_before_id)
  ORDER BY audit.created_at DESC, audit.id DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.list_community_social_audit_events(
  TIMESTAMPTZ, UUID, INTEGER
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_community_social_audit_events(
  TIMESTAMPTZ, UUID, INTEGER
) TO authenticated;

COMMENT ON FUNCTION public.list_community_social_audit_events(
  TIMESTAMPTZ, UUID, INTEGER
) IS
  'Admin-only bounded metadata reader for the append-oriented Community social audit stream.';

COMMIT;
