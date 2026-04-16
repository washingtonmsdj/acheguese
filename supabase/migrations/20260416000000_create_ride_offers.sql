-- ============================================
-- GATE 6: RIDE OFFERS
-- Tabela para gerenciar ofertas de corrida para motoristas
-- ============================================

-- Tabela de ofertas de corrida
CREATE TABLE IF NOT EXISTS ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE ride_offers IS 'Ofertas de corrida enviadas para motoristas';
COMMENT ON COLUMN ride_offers.ride_id IS 'Referência à corrida solicitada';
COMMENT ON COLUMN ride_offers.driver_profile_id IS 'Perfil do motorista que recebeu a oferta';
COMMENT ON COLUMN ride_offers.status IS 'Status da oferta: pending, accepted, rejected, expired, cancelled';
COMMENT ON COLUMN ride_offers.offered_at IS 'Momento em que a oferta foi enviada';
COMMENT ON COLUMN ride_offers.expires_at IS 'Momento em que a oferta expira';
COMMENT ON COLUMN ride_offers.responded_at IS 'Momento em que o motorista respondeu';
COMMENT ON COLUMN ride_offers.rejection_reason IS 'Motivo da rejeição (se aplicável)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_id ON ride_offers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_driver_profile_id ON ride_offers(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_ride_offers_status ON ride_offers(status);
CREATE INDEX IF NOT EXISTS idx_ride_offers_expires_at ON ride_offers(expires_at) WHERE status = 'pending';

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_ride_offers_ride_status ON ride_offers(ride_id, status);

-- RLS
ALTER TABLE ride_offers ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total
CREATE POLICY "Service role has full access to ride_offers"
  ON ride_offers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Motorista: ver apenas suas ofertas (usando profiles.user_id)
CREATE POLICY "Drivers can view their own offers"
  ON ride_offers FOR SELECT
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Motorista: aceitar/rejeitar apenas suas ofertas pendentes
CREATE POLICY "Drivers can respond to their own pending offers"
  ON ride_offers FOR UPDATE
  TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    status = 'pending' AND
    expires_at > NOW()
  )
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND
    status IN ('accepted', 'rejected')
  );

-- Passageiro: ver ofertas da sua corrida (apenas status, não dados do motorista)
CREATE POLICY "Passengers can view offers for their rides"
  ON ride_offers FOR SELECT
  TO authenticated
  USING (
    ride_id IN (
      SELECT id FROM ride_requests 
      WHERE passenger_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );
