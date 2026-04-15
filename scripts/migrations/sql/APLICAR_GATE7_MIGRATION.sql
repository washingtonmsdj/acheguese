-- ============================================
-- GATE 7: APLICAR MIGRATION - OPERATIONAL VERIFICATIONS
-- ============================================
-- Data: 08/04/2026
-- Objetivo: Criar tabela operational_verifications no banco remoto
-- 
-- INSTRUÇÕES:
-- 1. Copiar este arquivo completo
-- 2. Acessar: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 3. Colar no SQL Editor
-- 4. Executar
-- 5. Validar com queries de verificação no final
-- ============================================

-- TABELA: operational_verifications
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

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_operational_verifications_ride_id 
  ON operational_verifications(ride_id);

CREATE INDEX IF NOT EXISTS idx_operational_verifications_status 
  ON operational_verifications(status);

CREATE INDEX IF NOT EXISTS idx_operational_verifications_expires_at 
  ON operational_verifications(pin_expires_at) 
  WHERE pin_expires_at IS NOT NULL;

-- RLS (Row Level Security)
ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Passageiro pode ver suas próprias verificações
DROP POLICY IF EXISTS "Passengers can view their own verifications" ON operational_verifications;
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
DROP POLICY IF EXISTS "Drivers can view verifications for their rides" ON operational_verifications;
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
DROP POLICY IF EXISTS "Drivers can update verifications for their rides" ON operational_verifications;
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
DROP POLICY IF EXISTS "Service role can manage all verifications" ON operational_verifications;
CREATE POLICY "Service role can manage all verifications"
  ON operational_verifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- TRIGGER: updated_at
CREATE OR REPLACE FUNCTION update_operational_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_operational_verifications_updated_at ON operational_verifications;
CREATE TRIGGER trigger_update_operational_verifications_updated_at
  BEFORE UPDATE ON operational_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_operational_verifications_updated_at();

-- COMENTÁRIOS
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

-- ============================================
-- VALIDAÇÃO PÓS-APLICAÇÃO
-- ============================================

-- 1. Verificar que tabela foi criada
SELECT 
  table_name, 
  table_type
FROM information_schema.tables
WHERE table_name = 'operational_verifications';

-- 2. Verificar colunas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'operational_verifications'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'operational_verifications';

-- 4. Verificar RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'operational_verifications';

-- 5. Verificar constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'operational_verifications'::regclass;

-- 6. Testar insert (deve funcionar)
-- Nota: Substituir ride_id por um ID válido do seu banco
-- INSERT INTO operational_verifications (
--   ride_id,
--   verification_type,
--   is_required,
--   status
-- ) VALUES (
--   'RIDE_ID_AQUI',
--   'pin',
--   false,
--   'not_required'
-- );

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- 
-- ✅ Tabela operational_verifications criada
-- ✅ 14 colunas criadas
-- ✅ 3 índices criados
-- ✅ 4 policies RLS criadas
-- ✅ 1 trigger created
-- ✅ Constraints validados
-- 
-- ============================================
