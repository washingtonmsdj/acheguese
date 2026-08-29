-- G4 Search/discovery: public search relations are read models, not command surfaces.
-- Keep only SELECT for externally callable roles. Internal synchronization of
-- public_business_search is performed by its SECURITY DEFINER trigger function.

REVOKE ALL PRIVILEGES
ON TABLE public.public_business_search
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.public_business_search TO anon, authenticated, service_role;

REVOKE ALL PRIVILEGES
ON TABLE public.public_professional_search
FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.public_professional_search TO anon, authenticated, service_role;

DO $verify$
DECLARE
  v_relation text;
  v_role text;
  v_privilege text;
BEGIN
  FOREACH v_relation IN ARRAY ARRAY[
    'public_business_search',
    'public_professional_search'
  ]
  LOOP
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
    LOOP
      FOR v_privilege IN
        SELECT privilege_type
        FROM information_schema.role_table_grants
        WHERE table_schema = 'public'
          AND table_name = v_relation
          AND grantee = v_role
          AND privilege_type <> 'SELECT'
      LOOP
        RAISE EXCEPTION 'non-SELECT privilege remains on search read model: relation=% role=% privilege=%',
          v_relation, v_role, v_privilege;
      END LOOP;

      IF NOT has_table_privilege(v_role, format('public.%I', v_relation), 'SELECT') THEN
        RAISE EXCEPTION 'SELECT missing on search read model: relation=% role=%', v_relation, v_role;
      END IF;
    END LOOP;
  END LOOP;
END
$verify$;

NOTIFY pgrst, 'reload schema';
