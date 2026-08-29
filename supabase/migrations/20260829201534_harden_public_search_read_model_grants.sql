-- G4 Search/discovery authority hardening.
-- Public search relations are read models only. Browser roles and service_role
-- may read them, but must not acquire a competing write path.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE public.public_business_search
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT
ON TABLE public.public_business_search
TO anon, authenticated, service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE public.public_professional_search
FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT
ON TABLE public.public_professional_search
TO anon, authenticated, service_role;

DO $verify$
DECLARE
  v_relation text;
  v_role text;
BEGIN
  FOREACH v_relation IN ARRAY ARRAY[
    'public.public_business_search',
    'public.public_professional_search'
  ]
  LOOP
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role']
    LOOP
      IF has_table_privilege(v_role, v_relation, 'INSERT')
         OR has_table_privilege(v_role, v_relation, 'UPDATE')
         OR has_table_privilege(v_role, v_relation, 'DELETE')
         OR has_table_privilege(v_role, v_relation, 'TRUNCATE') THEN
        RAISE EXCEPTION 'search read model still writable: role=% relation=%', v_role, v_relation;
      END IF;

      IF NOT has_table_privilege(v_role, v_relation, 'SELECT') THEN
        RAISE EXCEPTION 'search read model lost SELECT: role=% relation=%', v_role, v_relation;
      END IF;
    END LOOP;
  END LOOP;
END
$verify$;

NOTIFY pgrst, 'reload schema';
