-- Garantir RLS habilitado
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Forçar RLS mesmo para owner
ALTER TABLE pricing_rules FORCE ROW LEVEL SECURITY;

-- Remover policies antigas (uma por uma para garantir)
DROP POLICY IF EXISTS "Enable read access for all users" ON pricing_rules;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON pricing_rules;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON pricing_rules;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_read_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_insert_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_update_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "authenticated_delete_pricing" ON pricing_rules;
DROP POLICY IF EXISTS "users_read_active_pricing" ON pricing_rules;

-- Criar policy de SELECT
CREATE POLICY "users_read_active_pricing"
  ON pricing_rules 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

SELECT '✅ RLS forçado em pricing_rules' AS status;
