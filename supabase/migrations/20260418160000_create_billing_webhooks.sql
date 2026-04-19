-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Sistema de webhooks e auditoria de billing
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria tabelas para processar webhooks do Stripe e auditar operações
-- de billing.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Tabela: stripe_webhook_events
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type 
ON stripe_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed 
ON stripe_webhook_events(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id 
ON stripe_webhook_events(stripe_event_id);

-- ══════════════════════════════════════════════════════════════════════════

-- Tabela: billing_transactions
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES business_data(id) ON DELETE SET NULL,
  subscription_id UUID,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription_created', 'subscription_updated', 'subscription_canceled', 'payment_succeeded', 'payment_failed', 'refund')),
  amount_cents INTEGER,
  currency TEXT DEFAULT 'BRL',
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user 
ON billing_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_business 
ON billing_transactions(business_id);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_type 
ON billing_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_status 
ON billing_transactions(status);

CREATE INDEX IF NOT EXISTS idx_billing_transactions_created 
ON billing_transactions(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════

-- Tabela: billing_audit_log
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('subscription', 'payment', 'webhook', 'plan')),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_audit_log_user 
ON billing_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_audit_log_entity 
ON billing_audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_billing_audit_log_action 
ON billing_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_billing_audit_log_created 
ON billing_audit_log(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES DE WEBHOOK
-- ══════════════════════════════════════════════════════════════════════════

-- Função: Registrar evento de webhook
CREATE OR REPLACE FUNCTION register_stripe_webhook_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Inserir evento (idempotente)
  INSERT INTO stripe_webhook_events (
    stripe_event_id,
    event_type,
    event_data
  ) VALUES (
    p_stripe_event_id,
    p_event_type,
    p_event_data
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Função: Marcar webhook como processado
CREATE OR REPLACE FUNCTION mark_webhook_processed(
  p_event_id UUID,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stripe_webhook_events
  SET 
    processed = p_success,
    processed_at = NOW(),
    error_message = p_error_message,
    retry_count = CASE 
      WHEN p_success THEN retry_count 
      ELSE retry_count + 1 
    END
  WHERE id = p_event_id;
END;
$$;

-- Função: Obter webhooks pendentes
CREATE OR REPLACE FUNCTION get_pending_webhooks(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  stripe_event_id TEXT,
  event_type TEXT,
  event_data JSONB,
  retry_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.stripe_event_id,
    w.event_type,
    w.event_data,
    w.retry_count,
    w.created_at
  FROM stripe_webhook_events w
  WHERE w.processed = FALSE
    AND w.retry_count < 5
  ORDER BY w.created_at ASC
  LIMIT p_limit;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES DE TRANSAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Função: Registrar transação de billing
CREATE OR REPLACE FUNCTION log_billing_transaction(
  p_user_id UUID,
  p_business_id UUID,
  p_subscription_id UUID,
  p_transaction_type TEXT,
  p_amount_cents INTEGER,
  p_currency TEXT,
  p_stripe_invoice_id TEXT,
  p_stripe_payment_intent_id TEXT,
  p_status TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO billing_transactions (
    user_id,
    business_id,
    subscription_id,
    transaction_type,
    amount_cents,
    currency,
    stripe_invoice_id,
    stripe_payment_intent_id,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_business_id,
    p_subscription_id,
    p_transaction_type,
    p_amount_cents,
    p_currency,
    p_stripe_invoice_id,
    p_stripe_payment_intent_id,
    p_status,
    p_metadata
  )
  RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES DE AUDITORIA
-- ══════════════════════════════════════════════════════════════════════════

-- Função: Registrar ação de billing no audit log
CREATE OR REPLACE FUNCTION log_billing_action(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO billing_audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- TRIGGERS DE AUDITORIA
-- ══════════════════════════════════════════════════════════════════════════

-- Trigger: Auditar mudanças em user_subscriptions
CREATE OR REPLACE FUNCTION audit_user_subscription_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_billing_action(
      NEW.user_id,
      'subscription_created',
      'subscription',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object('trigger', 'auto')
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Só auditar se houve mudança significativa
    IF OLD.status != NEW.status OR 
       OLD.plan_code != NEW.plan_code OR
       OLD.cancel_at_period_end != NEW.cancel_at_period_end THEN
      PERFORM log_billing_action(
        NEW.user_id,
        'subscription_updated',
        'subscription',
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        jsonb_build_object('trigger', 'auto')
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_billing_action(
      OLD.user_id,
      'subscription_deleted',
      'subscription',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      jsonb_build_object('trigger', 'auto')
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_user_subscription_changes ON user_subscriptions;
CREATE TRIGGER audit_user_subscription_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_subscription_changes();

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

-- stripe_webhook_events: Apenas service_role
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sistema pode gerenciar webhooks" ON stripe_webhook_events;
CREATE POLICY "Sistema pode gerenciar webhooks" 
ON stripe_webhook_events FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- billing_transactions: Usuários veem suas próprias transações
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas transações" ON billing_transactions;
CREATE POLICY "Usuários podem ver suas transações" 
ON billing_transactions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todas as transações" ON billing_transactions;
CREATE POLICY "Admins podem ver todas as transações" 
ON billing_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Sistema pode gerenciar transações" ON billing_transactions;
CREATE POLICY "Sistema pode gerenciar transações" 
ON billing_transactions FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- billing_audit_log: Apenas admins e service_role
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver audit log" ON billing_audit_log;
CREATE POLICY "Admins podem ver audit log" 
ON billing_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Sistema pode gerenciar audit log" ON billing_audit_log;
CREATE POLICY "Sistema pode gerenciar audit log" 
ON billing_audit_log FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE stripe_webhook_events IS 
'Eventos de webhook do Stripe para processamento idempotente';

COMMENT ON TABLE billing_transactions IS 
'Histórico de transações de billing (pagamentos, cancelamentos, etc)';

COMMENT ON TABLE billing_audit_log IS 
'Log de auditoria de todas as operações de billing';

COMMENT ON FUNCTION register_stripe_webhook_event(TEXT, TEXT, JSONB) IS 
'Registra evento de webhook do Stripe (idempotente)';

COMMENT ON FUNCTION mark_webhook_processed(UUID, BOOLEAN, TEXT) IS 
'Marca webhook como processado (sucesso ou erro)';

COMMENT ON FUNCTION get_pending_webhooks(INTEGER) IS 
'Retorna webhooks pendentes de processamento';

COMMENT ON FUNCTION log_billing_transaction(UUID, UUID, UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB) IS 
'Registra transação de billing';

COMMENT ON FUNCTION log_billing_action(UUID, TEXT, TEXT, UUID, JSONB, JSONB, JSONB) IS 
'Registra ação de billing no audit log';
