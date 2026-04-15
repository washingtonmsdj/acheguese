-- GATE 2: Corrigir policy de driver_locations para INSERT explícito
-- 
-- PROBLEMA: Policy "FOR ALL" não tem WITH CHECK explícito para INSERT
-- SOLUÇÃO: Separar policies por operação com WITH CHECK para INSERT

-- Remover policy ambígua
DROP POLICY IF EXISTS "Drivers manage own location" ON driver_locations;

-- Policy para SELECT (qualquer autenticado pode ver)
CREATE POLICY "driver_locations_select_policy" ON driver_locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy para INSERT (motorista só pode inserir própria localização)
CREATE POLICY "driver_locations_insert_policy" ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );

-- Policy para UPDATE (motorista só pode atualizar própria localização)
CREATE POLICY "driver_locations_update_policy" ON driver_locations
  FOR UPDATE
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  )
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );

-- Policy para DELETE (motorista só pode deletar própria localização)
CREATE POLICY "driver_locations_delete_policy" ON driver_locations
  FOR DELETE
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );

-- Comentário de auditoria
COMMENT ON POLICY "driver_locations_insert_policy" ON driver_locations IS 
  'GATE 2: Motorista autenticado pode inserir apenas sua própria localização';
COMMENT ON POLICY "driver_locations_update_policy" ON driver_locations IS 
  'GATE 2: Motorista autenticado pode atualizar apenas sua própria localização';
COMMENT ON POLICY "driver_locations_delete_policy" ON driver_locations IS 
  'GATE 2: Motorista autenticado pode deletar apenas sua própria localização';
