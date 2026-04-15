-- ============================================
-- GATE 5: FIX RLS - COPIE E COLE NO SQL EDITOR DO SUPABASE
-- ============================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Service role full access" ON driver_availability;
DROP POLICY IF EXISTS "Drivers can manage own availability" ON driver_availability;
DROP POLICY IF EXISTS "Public can read online drivers" ON driver_availability;

-- 3. Policy para service role (usado pelos testes e backend)
CREATE POLICY "Service role full access"
  ON driver_availability
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Policy para motoristas gerenciarem própria disponibilidade
CREATE POLICY "Drivers can manage own availability"
  ON driver_availability
  FOR ALL
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND profile_type = 'driver'
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() 
      AND profile_type = 'driver'
    )
  );

-- 5. Policy para leitura pública de motoristas online (para dispatch)
CREATE POLICY "Public can read online drivers"
  ON driver_availability
  FOR SELECT
  TO authenticated
  USING (is_online = true);

-- 6. Testar
SELECT '✅ Gate 5: RLS policies aplicadas!' AS status;

-- 7. Verificar policies criadas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'driver_availability'
ORDER BY policyname;
