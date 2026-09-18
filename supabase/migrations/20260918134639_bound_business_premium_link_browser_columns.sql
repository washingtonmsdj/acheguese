-- Preserve public premium-link resolution and owner CRUD while making
-- browser authority explicit by column. New columns remain private by default.

REVOKE SELECT, INSERT, UPDATE ON TABLE public.business_premium_links
FROM PUBLIC, anon, authenticated;

GRANT SELECT (
  id,
  business_id,
  slug,
  created_at,
  updated_at
) ON TABLE public.business_premium_links
TO anon, authenticated;

GRANT INSERT (
  business_id,
  slug
) ON TABLE public.business_premium_links
TO authenticated;

GRANT UPDATE (
  slug
) ON TABLE public.business_premium_links
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE public.business_premium_links
TO service_role;

COMMENT ON COLUMN public.business_premium_links.id IS
  'Server-generated identifier. Browser callers cannot provide or update it.';
COMMENT ON COLUMN public.business_premium_links.created_at IS
  'Server-owned creation timestamp. Browser callers cannot provide or update it.';
COMMENT ON COLUMN public.business_premium_links.updated_at IS
  'Server-owned update timestamp maintained by trigger. Browser callers cannot provide or update it.';

DO $verify$
BEGIN
  IF has_table_privilege('anon', 'public.business_premium_links', 'SELECT')
     OR has_table_privilege('authenticated', 'public.business_premium_links', 'SELECT') THEN
    RAISE EXCEPTION 'table-wide premium-link SELECT remains';
  END IF;

  IF has_table_privilege('authenticated', 'public.business_premium_links', 'INSERT')
     OR has_table_privilege('authenticated', 'public.business_premium_links', 'UPDATE') THEN
    RAISE EXCEPTION 'table-wide premium-link mutation authority remains';
  END IF;

  IF NOT has_column_privilege('anon', 'public.business_premium_links', 'slug', 'SELECT')
     OR NOT has_column_privilege('authenticated', 'public.business_premium_links', 'slug', 'SELECT') THEN
    RAISE EXCEPTION 'premium-link public resolution columns missing';
  END IF;

  IF NOT has_column_privilege('authenticated', 'public.business_premium_links', 'business_id', 'INSERT')
     OR NOT has_column_privilege('authenticated', 'public.business_premium_links', 'slug', 'INSERT')
     OR NOT has_column_privilege('authenticated', 'public.business_premium_links', 'slug', 'UPDATE') THEN
    RAISE EXCEPTION 'premium-link owner mutation columns missing';
  END IF;

  IF has_column_privilege('authenticated', 'public.business_premium_links', 'id', 'INSERT')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'created_at', 'INSERT')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'updated_at', 'INSERT')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'id', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'business_id', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'created_at', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.business_premium_links', 'updated_at', 'UPDATE') THEN
    RAISE EXCEPTION 'server-owned premium-link columns remain browser writable';
  END IF;
END
$verify$;

NOTIFY pgrst, 'reload schema';
