-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Atualizar estrutura de user_subscriptions
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Adiciona colunas faltantes na tabela user_subscriptions existente
-- para compatibilidade com o sistema de billing completo.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna plan_code se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'plan_code'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN plan_code TEXT NOT NULL DEFAULT 'free';
    
    -- Adicionar constraint de foreign key
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT fk_user_subscriptions_plan_code
    FOREIGN KEY (plan_code) REFERENCES billing_plans(code) ON DELETE RESTRICT;
  END IF;
END $$;

-- Adicionar coluna canceled_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'canceled_at'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN canceled_at TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar coluna trial_start se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'trial_start'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN trial_start TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar coluna stripe_price_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN stripe_price_id TEXT;
  END IF;
END $$;

-- Adicionar coluna metadata se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE user_subscriptions 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Atualizar constraint de status para incluir novos valores
DO $$
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;
  
  -- Adicionar nova constraint
  ALTER TABLE user_subscriptions 
  ADD CONSTRAINT user_subscriptions_status_check 
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'));
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan 
ON user_subscriptions(plan_code);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_price 
ON user_subscriptions(stripe_price_id) 
WHERE stripe_price_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES AUXILIARES
-- ══════════════════════════════════════════════════════════════════════════

-- Função: Obter assinatura ativa do usuário
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_code TEXT,
  plan_name TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.plan_code,
    bp.name,
    us.status,
    us.current_period_end,
    us.cancel_at_period_end
  FROM user_subscriptions us
  JOIN billing_plans bp ON bp.code = us.plan_code
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$;

-- Função: Verificar se usuário tem plano específico
CREATE OR REPLACE FUNCTION user_has_plan(p_user_id UUID, p_plan_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_plan BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_subscriptions
    WHERE user_id = p_user_id
      AND plan_code = p_plan_code
      AND status IN ('active', 'trialing')
  ) INTO v_has_plan;
  
  RETURN v_has_plan;
END;
$$;

-- Função: Verificar se usuário tem feature específica
CREATE OR REPLACE FUNCTION user_has_feature(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_feature BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM user_subscriptions us
    JOIN billing_plans bp ON bp.code = us.plan_code
    WHERE us.user_id = p_user_id
      AND us.status IN ('active', 'trialing')
      AND bp.features ? p_feature
  ) INTO v_has_feature;
  
  RETURN v_has_feature;
END;
$$;

-- Função: Obter limite de entitlement do usuário
CREATE OR REPLACE FUNCTION get_user_entitlement_limit(p_user_id UUID, p_entitlement TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  SELECT (bp.entitlements->p_entitlement->>'limit')::INTEGER
  INTO v_limit
  FROM user_subscriptions us
  JOIN billing_plans bp ON bp.code = us.plan_code
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_limit, 0);
END;
$$;

-- Função: Inicializar assinatura free para novo usuário
CREATE OR REPLACE FUNCTION initialize_user_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar assinatura free para novo usuário
  INSERT INTO user_subscriptions (
    user_id,
    plan_code,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '100 years' -- Free é vitalício
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger: Criar assinatura free ao criar usuário
DROP TRIGGER IF EXISTS initialize_user_subscription ON auth.users;
CREATE TRIGGER initialize_user_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_free_subscription();

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
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN user_subscriptions.plan_code IS 
'Código do plano (referencia billing_plans.code)';

COMMENT ON COLUMN user_subscriptions.canceled_at IS 
'Data de cancelamento da assinatura';

COMMENT ON COLUMN user_subscriptions.trial_start IS 
'Data de início do período de trial';

COMMENT ON COLUMN user_subscriptions.stripe_price_id IS 
'ID do preço no Stripe (price_xxx)';

COMMENT ON COLUMN user_subscriptions.metadata IS 
'Metadados adicionais (JSON)';

COMMENT ON FUNCTION get_user_active_subscription(UUID) IS 
'Retorna a assinatura ativa do usuário';

COMMENT ON FUNCTION user_has_plan(UUID, TEXT) IS 
'Verifica se usuário tem plano específico ativo';

COMMENT ON FUNCTION user_has_feature(UUID, TEXT) IS 
'Verifica se usuário tem acesso a feature específica';

COMMENT ON FUNCTION get_user_entitlement_limit(UUID, TEXT) IS 
'Retorna o limite de um entitlement para o usuário';
