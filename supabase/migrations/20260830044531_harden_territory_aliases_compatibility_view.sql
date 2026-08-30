-- G5: keep the legacy territory_aliases compatibility projection readable,
-- but remove browser write authority that is not part of its read-model contract.
--
-- The canonical authority remains public.location_aliases. The compatibility
-- view must execute as the caller so RLS on the base table is never bypassed.

DO $g5_territory_aliases_preflight$
DECLARE
  v_relkind "char";
BEGIN
  SELECT c.relkind
    INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'territory_aliases';

  IF v_relkind IS NULL THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: public.territory_aliases is missing';
  END IF;

  IF v_relkind <> 'v' THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: public.territory_aliases is not a view';
  END IF;

  IF to_regclass('public.location_aliases') IS NULL THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: canonical public.location_aliases is missing';
  END IF;
END
$g5_territory_aliases_preflight$;

ALTER VIEW public.territory_aliases SET (security_invoker = true);

-- Remove any direct or inherited browser authority, then restore the only
-- compatibility contract that is still intended: read access.
REVOKE ALL PRIVILEGES ON TABLE public.territory_aliases
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.territory_aliases TO anon, authenticated;

COMMENT ON VIEW public.territory_aliases IS
  'Read-only compatibility projection over public.location_aliases. Browser roles receive SELECT only; canonical writes remain on location_aliases under RLS/admin authority.';

DO $g5_territory_aliases_assertions$
DECLARE
  v_security_invoker BOOLEAN;
BEGIN
  SELECT COALESCE('security_invoker=true' = ANY(c.reloptions), FALSE)
    INTO v_security_invoker
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'territory_aliases';

  IF v_security_invoker IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: compatibility view is not security_invoker';
  END IF;

  IF NOT has_table_privilege('anon', 'public.territory_aliases', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'public.territory_aliases', 'SELECT') THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: intended browser SELECT is missing';
  END IF;

  IF has_table_privilege('anon', 'public.territory_aliases', 'INSERT')
     OR has_table_privilege('anon', 'public.territory_aliases', 'UPDATE')
     OR has_table_privilege('anon', 'public.territory_aliases', 'DELETE')
     OR has_table_privilege('authenticated', 'public.territory_aliases', 'INSERT')
     OR has_table_privilege('authenticated', 'public.territory_aliases', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.territory_aliases', 'DELETE') THEN
    RAISE EXCEPTION
      'G5_TERRITORY_ALIASES_BLOCKED: browser write authority remains on compatibility view';
  END IF;
END
$g5_territory_aliases_assertions$;
