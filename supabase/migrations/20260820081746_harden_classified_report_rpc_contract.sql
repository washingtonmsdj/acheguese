-- Harden Classifieds report RPC authorization to match their user-context semantics.
--
-- Both public wrappers are SECURITY INVOKER and delegate to private helpers that
-- require auth.uid() plus an active user profile. service_role does not inherit
-- authenticated and has no user JWT context, so advertising EXECUTE to
-- service_role on the public wrappers creates a broken and misleading contract.
-- Keep the surface authenticated-only and explicitly reassert the private ACLs.

REVOKE EXECUTE ON FUNCTION public.create_classified_report(uuid, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_classified_report(uuid, text, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.moderate_classified_report(uuid, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.moderate_classified_report(uuid, text, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION private.create_classified_report(uuid, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.create_classified_report(uuid, text, text)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION private.moderate_classified_report(uuid, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION private.moderate_classified_report(uuid, text, text)
  TO authenticated;
