-- Route authenticated session/profile helper RPCs through the session Edge
-- broker. Browser clients must not pass arbitrary p_user_id to SECURITY
-- DEFINER functions; the broker resolves the authenticated user from JWT and
-- calls these helpers with service_role only.

REVOKE ALL ON FUNCTION public.get_active_profile(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_profile(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.switch_active_profile(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.switch_active_profile(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.check_user_mfa_required(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_mfa_required(uuid)
  TO service_role;

COMMENT ON FUNCTION public.get_active_profile(uuid)
  IS 'Returns the active profile for a user. Browser access is routed through session-rpc so p_user_id is resolved from the JWT.';

COMMENT ON FUNCTION public.switch_active_profile(uuid, uuid)
  IS 'Persists the active profile for a user after owner/member validation. Browser access is routed through session-rpc so p_user_id is resolved from the JWT.';

COMMENT ON FUNCTION public.check_user_mfa_required(uuid)
  IS 'Checks whether MFA is required for a user. Browser access is routed through session-rpc so p_user_id is resolved from the JWT.';
