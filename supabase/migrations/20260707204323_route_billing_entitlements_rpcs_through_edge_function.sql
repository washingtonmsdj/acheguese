-- Route user billing entitlement helper RPCs through a trusted Edge broker.
-- Browser clients must not pass arbitrary p_user_id to privileged
-- functions; billing-entitlements-rpc derives the user from the JWT and calls
-- these helpers with service_role only.

REVOKE ALL ON FUNCTION public.get_user_active_subscription(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_active_subscription(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.user_has_plan(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_plan(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.user_has_feature(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_feature(uuid, text)
  TO service_role;

REVOKE ALL ON FUNCTION public.get_user_entitlement_limit(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_entitlement_limit(uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.get_user_active_subscription(uuid)
  IS 'Returns the active subscription for a user. Browser access is routed through billing-entitlements-rpc so p_user_id is resolved from the JWT.';

COMMENT ON FUNCTION public.user_has_plan(uuid, text)
  IS 'Checks a user plan entitlement. Browser access is routed through billing-entitlements-rpc so p_user_id is resolved from the JWT.';

COMMENT ON FUNCTION public.user_has_feature(uuid, text)
  IS 'Checks a user feature entitlement. Browser access is routed through billing-entitlements-rpc so p_user_id is resolved from the JWT.';

COMMENT ON FUNCTION public.get_user_entitlement_limit(uuid, text)
  IS 'Returns a user entitlement limit. Browser access is routed through billing-entitlements-rpc so p_user_id is resolved from the JWT.';
