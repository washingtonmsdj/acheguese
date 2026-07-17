BEGIN;

-- Ban details contain moderation identities and are not a browser read model.
-- Profile runtime needs only whether the authenticated User has an active ban.
DROP POLICY IF EXISTS banned_users_read_own_or_admin
  ON public.banned_users;
REVOKE ALL ON TABLE public.banned_users FROM PUBLIC, anon, authenticated;

-- security-authority: public-rpc public.has_current_active_ban
CREATE OR REPLACE FUNCTION public.has_current_active_ban()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'active_ban_read_not_authorized'
      USING ERRCODE = '42501';
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.banned_users ban
    WHERE ban.user_id = v_user_id
      AND ban.is_active = TRUE
      AND (ban.expires_at IS NULL OR ban.expires_at > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_current_active_ban()
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_current_active_ban()
  TO authenticated;

COMMENT ON FUNCTION public.has_current_active_ban() IS
  'Returns only whether auth.uid() has a current active ban; moderation identities remain backend-only.';

COMMIT;
