-- Remover todas as policies não-service_role
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'pricing_rules' 
    AND policyname NOT LIKE 'service_role%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON pricing_rules';
  END LOOP;
END $$;

-- Recriar apenas SELECT
CREATE POLICY users_read_active_pricing
  ON pricing_rules FOR SELECT TO authenticated
  USING (is_active = true);

SELECT '✅ Policies pricing limpas' AS status;
