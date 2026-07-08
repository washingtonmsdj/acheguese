-- ============================================================================
-- Harden Gastronomia niche capability RPCs
-- ============================================================================
-- Capability/versioning mutations are privileged domain operations. They must
-- not be callable directly from browser sessions because they can enable
-- product capabilities or mark whole niche cohorts for upgrade.
-- ============================================================================

-- security-authority: public-read helper no longer exposed as SECURITY DEFINER
ALTER FUNCTION public.has_niche_capability(uuid, text)
  SECURITY INVOKER;
ALTER FUNCTION public.has_niche_capability(uuid, text)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.has_niche_capability(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_niche_capability(uuid, text) TO service_role;

-- security-authority: privileged-rpc public.add_niche_capability
ALTER FUNCTION public.add_niche_capability(uuid, text, uuid)
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.add_niche_capability(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_niche_capability(uuid, text, uuid) TO service_role;

-- security-authority: privileged-rpc public.mark_niche_needs_upgrade
ALTER FUNCTION public.mark_niche_needs_upgrade(text, text[])
  SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.mark_niche_needs_upgrade(text, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_niche_needs_upgrade(text, text[]) TO service_role;

-- Keep upgrade history readable to owners via RLS, but remove inherited write
-- grants from public API roles. Writes must come from trusted server paths.
REVOKE ALL ON TABLE public.gastronomy_niche_upgrade_history FROM PUBLIC;
REVOKE ALL ON TABLE public.gastronomy_niche_upgrade_history FROM anon;
REVOKE ALL ON TABLE public.gastronomy_niche_upgrade_history FROM authenticated;
GRANT SELECT ON TABLE public.gastronomy_niche_upgrade_history TO authenticated;
GRANT ALL ON TABLE public.gastronomy_niche_upgrade_history TO service_role;

NOTIFY pgrst, 'reload schema';
