-- GATE 7: RLS CORRETO - Operational Verifications
-- Policies baseadas em participantes da ride (passenger/driver)
-- Sem liberar tabela para todo authenticated

-- ============================================
-- REMOVER POLICIES PERMISSIVAS (se existirem)
-- ============================================

DROP POLICY IF EXISTS "operational_verifications_insert_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_select_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_update_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_delete_policy" ON operational_verifications;

-- ============================================
-- POLICY: SELECT
-- Permitir leitura apenas para participantes da ride
-- ============================================

CREATE POLICY "operational_verifications_select_by_participant"
ON operational_verifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
);

-- ============================================
-- POLICY: INSERT
-- Permitir insert apenas para o passageiro/requester da ride
-- Service role tem acesso total via bypass RLS
-- ============================================

CREATE POLICY "operational_verifications_insert_by_requester"
ON operational_verifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p ON p.id = rr.passenger_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND p.user_id = auth.uid()
  )
);

-- ============================================
-- POLICY: UPDATE
-- Permitir update apenas para participantes da ride
-- (passageiro pode criar, motorista pode verificar)
-- ============================================

CREATE POLICY "operational_verifications_update_by_participant"
ON operational_verifications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ride_requests rr
    INNER JOIN profiles p_passenger ON p_passenger.id = rr.passenger_profile_id
    LEFT JOIN profiles p_driver ON p_driver.id = rr.driver_profile_id
    WHERE rr.id = operational_verifications.ride_id
    AND (
      p_passenger.user_id = auth.uid()
      OR p_driver.user_id = auth.uid()
    )
  )
);

-- ============================================
-- POLICY: DELETE
-- Apenas service_role pode deletar
-- Usuários autenticados NÃO podem deletar
-- ============================================

-- Não criar policy de DELETE para authenticated
-- Service role bypassa RLS automaticamente

-- ============================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- ============================================

ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMENTÁRIOS PARA AUDITORIA
-- ============================================

COMMENT ON POLICY "operational_verifications_select_by_participant" ON operational_verifications IS 
'GATE 7: Permite leitura apenas para passageiro ou motorista da ride associada';

COMMENT ON POLICY "operational_verifications_insert_by_requester" ON operational_verifications IS 
'GATE 7: Permite insert apenas para o passageiro/requester da ride. Service role bypassa RLS.';

COMMENT ON POLICY "operational_verifications_update_by_participant" ON operational_verifications IS 
'GATE 7: Permite update apenas para passageiro ou motorista da ride (ex: motorista verifica PIN)';
