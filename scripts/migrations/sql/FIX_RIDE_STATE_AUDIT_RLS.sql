-- ============================================
-- CORRIGIR RLS: ride_state_audit
-- Permitir INSERT por usuários autenticados
-- ============================================
-- Execute no SQL Editor:
-- https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
-- ============================================

-- Política: participantes da corrida podem inserir auditoria
DROP POLICY IF EXISTS "participants_insert_ride_audit" ON ride_state_audit;
CREATE POLICY "participants_insert_ride_audit"
  ON ride_state_audit FOR INSERT TO authenticated
  WITH CHECK (
    -- Pode inserir se for participante da corrida (passageiro ou motorista)
    -- OU se for o sistema (actor = 'system')
    changed_by = 'system'
    OR ride_id IN (
      SELECT id FROM ride_requests
      WHERE passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR driver_profile_id   IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Verificar políticas resultantes
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'ride_state_audit'
ORDER BY cmd;

SELECT '✅ RLS ride_state_audit corrigido!' AS status;
