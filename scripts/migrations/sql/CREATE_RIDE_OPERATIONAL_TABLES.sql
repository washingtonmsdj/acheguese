-- ============================================
-- MOTOR OPERACIONAL DA CORRIDA
-- ============================================

-- 1. Tabela de auditoria de mudanças de estado
CREATE TABLE IF NOT EXISTS ride_state_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  changed_by TEXT NOT NULL, -- profile_id ou 'system'
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_state_audit_ride_id ON ride_state_audit(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_state_audit_created_at ON ride_state_audit(created_at DESC);

-- 2. Tabela de disponibilidade de motorista
CREATE TABLE IF NOT EXISTS driver_availability (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_online ON driver_availability(is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_driver_availability_location ON driver_availability(current_lat, current_lng);

-- 3. Atualizar tabela rides com novos estados
ALTER TABLE rides 
  DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE rides
  ADD CONSTRAINT rides_status_check CHECK (
    status IN (
      'requested',
      'searching_driver',
      'driver_assigned',
      'driver_accepted',
      'driver_arriving',
      'passenger_boarded',
      'in_progress',
      'completed',
      'cancelled_by_passenger',
      'cancelled_by_driver',
      'expired',
      'failed',
      -- Estados legados (manter compatibilidade)
      'pending',
      'accepted',
      'driver_on_the_way',
      'driver_arrived',
      'cancelled'
    )
  );

-- 4. Adicionar colunas de timestamp
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_rides_status_driver ON rides(status, driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_active_states ON rides(status) 
  WHERE status IN ('driver_accepted', 'driver_arriving', 'passenger_boarded', 'in_progress');

-- 6. RLS para ride_state_audit
ALTER TABLE ride_state_audit ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total
DROP POLICY IF EXISTS "service_role_all_ride_state_audit" ON ride_state_audit;
CREATE POLICY "service_role_all_ride_state_audit"
  ON ride_state_audit FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated: ler auditoria das próprias corridas
DROP POLICY IF EXISTS "users_read_own_ride_audit" ON ride_state_audit;
CREATE POLICY "users_read_own_ride_audit"
  ON ride_state_audit FOR SELECT TO authenticated
  USING (
    ride_id IN (
      SELECT id FROM rides 
      WHERE passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- 7. RLS para driver_availability
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total
DROP POLICY IF EXISTS "service_role_all_driver_availability" ON driver_availability;
CREATE POLICY "service_role_all_driver_availability"
  ON driver_availability FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated: ler disponibilidade de todos (para busca)
DROP POLICY IF EXISTS "users_read_driver_availability" ON driver_availability;
CREATE POLICY "users_read_driver_availability"
  ON driver_availability FOR SELECT TO authenticated
  USING (true);

-- Authenticated: atualizar apenas própria disponibilidade
DROP POLICY IF EXISTS "drivers_update_own_availability" ON driver_availability;
CREATE POLICY "drivers_update_own_availability"
  ON driver_availability FOR UPDATE TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Authenticated: inserir própria disponibilidade
DROP POLICY IF EXISTS "drivers_insert_own_availability" ON driver_availability;
CREATE POLICY "drivers_insert_own_availability"
  ON driver_availability FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 8. Função para expirar corridas antigas
CREATE OR REPLACE FUNCTION expire_old_ride_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rides
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status IN ('requested', 'searching_driver', 'driver_assigned')
    AND created_at < NOW() - INTERVAL '15 minutes'
    AND status != 'expired';
END;
$$;

-- 9. Verificar resultado
SELECT 
  'ride_state_audit' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'ride_state_audit'
UNION ALL
SELECT 
  'driver_availability' as table_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'driver_availability';

SELECT '✅ Motor operacional criado!' AS status;
