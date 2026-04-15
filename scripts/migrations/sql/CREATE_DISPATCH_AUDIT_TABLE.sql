-- ============================================
-- TABELA DE AUDITORIA DE DISPATCH
-- ============================================
-- Registra todas as tentativas de oferecer corrida para motoristas

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_ride ON ride_dispatch_audit(ride_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_driver ON ride_dispatch_audit(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_status ON ride_dispatch_audit(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_created ON ride_dispatch_audit(created_at DESC);

-- RLS
ALTER TABLE ride_dispatch_audit ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "Admin can view all dispatch audit"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Motorista pode ver suas próprias tentativas
CREATE POLICY "Driver can view own dispatch attempts"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (driver_profile_id = auth.uid());

-- Passageiro pode ver tentativas da sua corrida
CREATE POLICY "Passenger can view dispatch attempts for their rides"
  ON ride_dispatch_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = ride_dispatch_audit.ride_id
      AND ride_requests.passenger_profile_id = auth.uid()
    )
  );

-- Sistema pode inserir e atualizar
CREATE POLICY "System can insert dispatch audit"
  ON ride_dispatch_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update dispatch audit"
  ON ride_dispatch_audit
  FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE ride_dispatch_audit IS 'Auditoria de tentativas de dispatch de corridas para motoristas';
COMMENT ON COLUMN ride_dispatch_audit.attempt_number IS 'Número sequencial da tentativa (1, 2, 3...)';
COMMENT ON COLUMN ride_dispatch_audit.offered_at IS 'Quando a corrida foi oferecida ao motorista';
COMMENT ON COLUMN ride_dispatch_audit.timeout_at IS 'Quando a oferta expira';
COMMENT ON COLUMN ride_dispatch_audit.responded_at IS 'Quando o motorista respondeu (aceitou ou timeout)';
COMMENT ON COLUMN ride_dispatch_audit.status IS 'Status da tentativa: pending, accepted, timeout, rejected';
