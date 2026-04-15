-- ============================================================
-- GATE 3: Failed Delivery Metadata - Rastreamento de Item
-- ============================================================
-- 
-- Adiciona metadata estruturada para falhas de entrega motoboy
-- Separação: snapshot da falha (imediato) + resolução (posterior)
--

-- Adicionar coluna de metadata
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS failed_delivery_metadata JSONB;

-- ============================================================
-- CONSTRAINTS: Snapshot Obrigatório
-- ============================================================

-- Campos obrigatórios no snapshot da falha
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_snapshot
  CHECK (
    (status != 'failed_delivery') OR
    (
      status = 'failed_delivery' AND
      failed_delivery_metadata IS NOT NULL AND
      failed_delivery_metadata->>'failure_reason' IS NOT NULL AND
      failed_delivery_metadata->>'item_destination' IS NOT NULL AND
      failed_delivery_metadata->>'item_current_holder' IS NOT NULL AND
      failed_delivery_metadata->>'timestamp' IS NOT NULL AND
      failed_delivery_metadata->>'resolution_status' IS NOT NULL
    )
  );

-- resolution_notes obrigatório se failure_reason = 'other'
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_other_notes
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'failure_reason' != 'other' OR 
     failed_delivery_metadata->>'resolution_notes' IS NOT NULL)
  );

-- item_current_holder não pode ser 'recipient' em failed_delivery
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_holder
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'item_current_holder' != 'recipient')
  );

-- ============================================================
-- CONSTRAINTS: Validação de Resolução
-- ============================================================

-- resolved exige resolved_at
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_resolved
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'resolution_status' != 'resolved' OR 
     failed_delivery_metadata->>'resolved_at' IS NOT NULL)
  );

-- escalated exige manual_resolution_owner_profile_id
ALTER TABLE ride_requests
  ADD CONSTRAINT check_failed_delivery_escalated
  CHECK (
    (status != 'failed_delivery') OR
    (failed_delivery_metadata->>'resolution_status' != 'escalated' OR 
     failed_delivery_metadata->>'manual_resolution_owner_profile_id' IS NOT NULL)
  );

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice GIN para queries em metadata
CREATE INDEX IF NOT EXISTS idx_ride_requests_failed_delivery_metadata
  ON ride_requests USING GIN (failed_delivery_metadata)
  WHERE status = 'failed_delivery';

-- Índice para resolution_status
CREATE INDEX IF NOT EXISTS idx_ride_requests_resolution_status
  ON ride_requests ((failed_delivery_metadata->>'resolution_status'))
  WHERE status = 'failed_delivery';

-- Índice para failure_reason
CREATE INDEX IF NOT EXISTS idx_ride_requests_failure_reason
  ON ride_requests ((failed_delivery_metadata->>'failure_reason'))
  WHERE status = 'failed_delivery';

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON COLUMN ride_requests.failed_delivery_metadata IS 
  'Metadata de falha de entrega: snapshot imediato (obrigatório) + resolução posterior (opcional)';

-- ============================================================
-- QUERIES ÚTEIS
-- ============================================================

-- Falhas pendentes de resolução
-- SELECT * FROM ride_requests 
-- WHERE status = 'failed_delivery' 
--   AND failed_delivery_metadata->>'resolution_status' = 'pending';

-- Falhas por motivo
-- SELECT 
--   failed_delivery_metadata->>'failure_reason' as reason,
--   COUNT(*) as total
-- FROM ride_requests
-- WHERE status = 'failed_delivery'
-- GROUP BY reason;

-- Itens aguardando resolução manual
-- SELECT * FROM ride_requests
-- WHERE status = 'failed_delivery'
--   AND failed_delivery_metadata->>'item_destination' = 'awaiting_manual_resolution';
