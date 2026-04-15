-- ============================================
-- DISPATCH AUTOMÁTICO - APLICAR VIA SQL EDITOR
-- ============================================
-- Copie e cole este arquivo inteiro no SQL Editor do Supabase

-- 1. CRIAR TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS ride_dispatch_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  offered_at TIMESTAMPTZ NOT NULL,
  timeout_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'timeout', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_ride ON ride_dispatch_audit(ride_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_driver ON ride_dispatch_audit(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_status ON ride_dispatch_audit(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_created ON ride_dispatch_audit(created_at DESC);

-- 3. HABILITAR RLS
ALTER TABLE ride_dispatch_audit ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLICIES
DROP POLICY IF EXISTS "Admin can view all dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "Admin can view all dispatch audit"
  ON ride_dispatch_audit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Driver can view own dispatch attempts" ON ride_dispatch_audit;
CREATE POLICY "Driver can view own dispatch attempts"
  ON ride_dispatch_audit FOR SELECT TO authenticated
  USING (driver_profile_id = auth.uid());

DROP POLICY IF EXISTS "Passenger can view dispatch attempts for their rides" ON ride_dispatch_audit;
CREATE POLICY "Passenger can view dispatch attempts for their rides"
  ON ride_dispatch_audit FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = ride_dispatch_audit.ride_id
      AND ride_requests.passenger_profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "System can insert dispatch audit"
  ON ride_dispatch_audit FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update dispatch audit" ON ride_dispatch_audit;
CREATE POLICY "System can update dispatch audit"
  ON ride_dispatch_audit FOR UPDATE TO authenticated
  USING (true);

-- 5. VALIDAR
SELECT 
  'ride_dispatch_audit' as tabela,
  COUNT(*) as total_registros
FROM ride_dispatch_audit;

SELECT '✅ Tabela ride_dispatch_audit criada com sucesso!' as status;
