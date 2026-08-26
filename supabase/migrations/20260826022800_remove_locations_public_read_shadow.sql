-- Remove the permissive shadow that made inactive canonical locations readable
-- to browser roles despite the intended active-only public policy.
--
-- Existing contract preserved:
--   * anon/authenticated may read active locations through
--     "Locations ativas visíveis publicamente"
--   * canonical admins retain full visibility/manage access.

DROP POLICY IF EXISTS public_read_locations ON public.locations;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'locations'
      AND cmd = 'SELECT'
      AND roles && ARRAY['anon'::name, 'authenticated'::name]
      AND lower(regexp_replace(coalesce(qual, ''), '[[:space:]()]', '', 'g')) = 'true'
  ) THEN
    RAISE EXCEPTION 'locations still has a browser SELECT policy with USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'locations'
      AND policyname = 'Locations ativas visíveis publicamente'
      AND cmd = 'SELECT'
      AND 'public'::name = ANY (roles)
      AND qual ILIKE '%status%active%'
  ) THEN
    RAISE EXCEPTION 'locations active-only public read policy is missing';
  END IF;
END
$$;
