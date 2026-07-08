-- Route user session revocation through the session Edge broker. Browser
-- clients must not execute privileged session revocation helpers directly.

REVOKE ALL ON FUNCTION public.revoke_user_session(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_user_session(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.revoke_all_user_sessions(uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_all_user_sessions(uuid, boolean, text)
  TO service_role;

COMMENT ON FUNCTION public.revoke_user_session(uuid, text)
  IS 'Legacy session revocation helper. Browser access is routed through session-rpc and scoped to the authenticated user.';

COMMENT ON FUNCTION public.revoke_all_user_sessions(uuid, boolean, text)
  IS 'Legacy bulk session revocation helper. Browser access is routed through session-rpc and scoped to the authenticated user.';
