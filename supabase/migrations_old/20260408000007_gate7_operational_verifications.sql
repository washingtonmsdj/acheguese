-- GATE 7: OPERATIONAL VERIFICATIONS (PIN)
-- Data: 08/04/2026
-- Objetivo: Adicionar verificação operacional por PIN para corridas e entregas

-- ============================================
-- TABELA: operational_verifications
-- ============================================

CREATE TABLE IF NOT EXISTS operational_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL DEFAULT 'pin',
  
  -- Exigência
  is_required BOOLEAN NOT NULL DEFAULT false,
  required_by TEXT CHECK (required_by IN ('admin', 'passenger', 'driver', 'sender', 'operation')),
  required_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'not_required' 
    CHECK (status IN ('not_required', 'pending', 'verified', 'failed')),
  
  -- PIN (hash bcrypt)
  pin_hash TEXT,
  pin_generated_at TIMESTAMPTZ,
  pin_expires_at TIMESTAMPTZ,
  
  -- Verificação
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  verification_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(ride_id, verification_type)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_operational_verifications_ride_id 
  ON operational_verifications(ride_id);

CREATE INDEX idx_operational_verifications_status 
  ON operational_verifications(status);

CREATE INDEX idx_operational_verifications_expires_at 
  ON operational_verifications(pin_expires_at) 
  WHERE pin_expires_at IS NOT NULL;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Passageiro pode ver suas próprias verificações
CREATE POLICY "Passengers can view their own verifications"
  ON operational_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = operational_verifications.ride_id
        AND ride_requests.passenger_profile_id = auth.uid()
    )
  );

-- Policy: Motorista pode ver verificações de suas corridas
CREATE POLICY "Drivers can view verifications for their rides"
  ON operational_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = operational_verifications.ride_id
        AND ride_requests.driver_profile_id = auth.uid()
    )
  );

-- Policy: Motorista pode atualizar verificações (validar PIN)
CREATE POLICY "Drivers can update verifications for their rides"
  ON operational_verifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ride_requests
      WHERE ride_requests.id = operational_verifications.ride_id
        AND ride_requests.driver_profile_id = auth.uid()
    )
  );

-- Policy: Service role pode tudo
CREATE POLICY "Service role can manage all verifications"
  ON operational_verifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- TRIGGER: updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_operational_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operational_verifications_updated_at
  BEFORE UPDATE ON operational_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_operational_verifications_updated_at();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE operational_verifications IS 
  'Gate 7: Verificações operacionais (PIN) para corridas e entregas';

COMMENT ON COLUMN operational_verifications.verification_type IS 
  'Tipo de verificação: pin (v1), signature, qrcode (futuro)';

COMMENT ON COLUMN operational_verifications.is_required IS 
  'Se verificação é obrigatória para esta corrida/entrega';

COMMENT ON COLUMN operational_verifications.required_by IS 
  'Quem exigiu a verificação: admin, passenger, driver, sender, operation';

COMMENT ON COLUMN operational_verifications.status IS 
  'Status: not_required, pending, verified, failed';

COMMENT ON COLUMN operational_verifications.pin_hash IS 
  'Hash bcrypt do PIN (nunca texto puro)';

COMMENT ON COLUMN operational_verifications.verification_attempts IS 
  'Número de tentativas de verificação (limite: 5)';
