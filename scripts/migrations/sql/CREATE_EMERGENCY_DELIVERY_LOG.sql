-- Tabela para registrar entregas de notificações de emergência

CREATE TABLE IF NOT EXISTS emergency_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'push')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  target TEXT NOT NULL, -- email, phone, etc
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_emergency_delivery_log_alert_id ON emergency_delivery_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_emergency_delivery_log_contact_id ON emergency_delivery_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_emergency_delivery_log_status ON emergency_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_emergency_delivery_log_channel ON emergency_delivery_log(channel);

-- RLS
ALTER TABLE emergency_delivery_log ENABLE ROW LEVEL SECURITY;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_emergency_delivery_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emergency_delivery_log_updated_at_trigger ON emergency_delivery_log;
CREATE TRIGGER emergency_delivery_log_updated_at_trigger
  BEFORE UPDATE ON emergency_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_delivery_log_updated_at();

SELECT 'Tabela emergency_delivery_log criada com sucesso!' AS status;
