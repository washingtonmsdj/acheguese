-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Atualizar Sistema de Notificações
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Atualiza tabela notifications existente e cria tabelas complementares
-- para sistema completo de notificações.
--
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- ATUALIZAR TABELA: notifications
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna category se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'category'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('transactional', 'social', 'system', 'marketing'));
  END IF;
END $$;

-- Renomear body para message se necessário
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'body'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications 
    RENAME COLUMN body TO message;
  END IF;
END $$;

-- Adicionar message se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN message TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Adicionar action_url se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN action_url TEXT;
  END IF;
END $$;

-- Adicionar action_label se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_label'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN action_label TEXT;
  END IF;
END $$;

-- Renomear data para metadata se necessário
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'data'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications 
    RENAME COLUMN data TO metadata;
  END IF;
END $$;

-- Renomear is_read para read se necessário
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications 
    RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- Adicionar read_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Atualizar constraint de type
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'error'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_notifications_category 
ON notifications(user_id, category);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_new 
ON notifications(user_id, created_at DESC) 
WHERE read = FALSE;

-- ══════════════════════════════════════════════════════════════════════════
-- TABELA: notification_preferences
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  transactional_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  social_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  system_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
ON notification_preferences(user_id);

-- ══════════════════════════════════════════════════════════════════════════
-- TABELA: push_subscriptions
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON push_subscriptions(user_id, is_active) 
WHERE is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- ══════════════════════════════════════════════════════════════════════════
-- TABELA: email_logs
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'bounced', 'failed', 'opened', 'clicked')),
  provider_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user 
ON email_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_email 
ON email_logs(email);

CREATE INDEX IF NOT EXISTS idx_email_logs_status 
ON email_logs(status);

CREATE INDEX IF NOT EXISTS idx_email_logs_created 
ON email_logs(created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════

-- Trigger: Atualizar updated_at em notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Inicializar preferências para novo usuário
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS initialize_user_notification_preferences ON auth.users;
CREATE TRIGGER initialize_user_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_notification_preferences();

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÕES
-- ══════════════════════════════════════════════════════════════════════════

-- Função: Criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  -- Buscar preferências do usuário
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- Se não encontrou, criar com defaults
  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  -- Verificar se in-app está habilitado
  IF NOT v_preferences.inapp_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Verificar se categoria está habilitada
  IF p_category = 'social' AND NOT v_preferences.social_enabled THEN
    RETURN NULL;
  END IF;
  
  IF p_category = 'system' AND NOT v_preferences.system_enabled THEN
    RETURN NULL;
  END IF;
  
  IF p_category = 'marketing' AND NOT v_preferences.marketing_enabled THEN
    RETURN NULL;
  END IF;
  
  -- Criar notificação
  INSERT INTO notifications (
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    action_label,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Função: Marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    read_at = NOW()
  WHERE id = p_notification_id
    AND read = FALSE;
END;
$$;

-- Função: Marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET 
    read = TRUE,
    read_at = NOW()
  WHERE user_id = p_user_id
    AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Função: Obter contagem de não lidas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
    AND read = FALSE;
  
  RETURN v_count;
END;
$$;

-- Função: Limpar notificações antigas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_temp INTEGER;
BEGIN
  -- Deletar notificações lidas com mais de 30 dias
  DELETE FROM notifications
  WHERE read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Deletar notificações não lidas com mais de 90 dias
  DELETE FROM notifications
  WHERE read = FALSE
    AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_temp = ROW_COUNT;
  v_count := v_count + v_temp;
  
  RETURN v_count;
END;
$$;

-- Função: Verificar quiet hours
CREATE OR REPLACE FUNCTION is_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_preferences RECORD;
  v_current_time TIME;
  v_current_day INTEGER;
BEGIN
  -- Buscar preferências
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR v_preferences.quiet_hours_start IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Obter hora e dia atuais
  v_current_time := CURRENT_TIME;
  v_current_day := EXTRACT(ISODOW FROM CURRENT_DATE);
  
  -- Verificar se dia atual está nos dias de quiet hours
  IF NOT (v_current_day = ANY(v_preferences.quiet_hours_days)) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se está dentro do horário
  IF v_preferences.quiet_hours_start <= v_preferences.quiet_hours_end THEN
    RETURN v_current_time >= v_preferences.quiet_hours_start 
       AND v_current_time <= v_preferences.quiet_hours_end;
  ELSE
    RETURN v_current_time >= v_preferences.quiet_hours_start 
        OR v_current_time <= v_preferences.quiet_hours_end;
  END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

-- notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias preferências" ON notification_preferences;
CREATE POLICY "Usuários podem ver suas próprias preferências" 
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias preferências" ON notification_preferences;
CREATE POLICY "Usuários podem atualizar suas próprias preferências" 
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sistema pode gerenciar preferências" ON notification_preferences;
CREATE POLICY "Sistema pode gerenciar preferências" 
ON notification_preferences FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias subscriptions" 
ON push_subscriptions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem criar suas próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários podem criar suas próprias subscriptions" 
ON push_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários podem atualizar suas próprias subscriptions" 
ON push_subscriptions FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários podem deletar suas próprias subscriptions" 
ON push_subscriptions FOR DELETE
USING (user_id = auth.uid());

-- email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver email logs" ON email_logs;
CREATE POLICY "Admins podem ver email logs" 
ON email_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = TRUE
  )
);

DROP POLICY IF EXISTS "Sistema pode gerenciar email logs" ON email_logs;
CREATE POLICY "Sistema pode gerenciar email logs" 
ON email_logs FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE notification_preferences IS 
'Preferências de notificação por usuário';

COMMENT ON TABLE push_subscriptions IS 
'Subscriptions de push notifications (FCM/Web Push)';

COMMENT ON TABLE email_logs IS 
'Log de emails enviados pelo sistema';

COMMENT ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) IS 
'Cria notificação respeitando preferências do usuário';

COMMENT ON FUNCTION mark_notification_as_read(UUID) IS 
'Marca notificação como lida';

COMMENT ON FUNCTION mark_all_notifications_as_read(UUID) IS 
'Marca todas as notificações do usuário como lidas';

COMMENT ON FUNCTION get_unread_notifications_count(UUID) IS 
'Retorna contagem de notificações não lidas';

COMMENT ON FUNCTION cleanup_old_notifications() IS 
'Remove notificações antigas (lidas > 30 dias, não lidas > 90 dias)';

COMMENT ON FUNCTION is_in_quiet_hours(UUID) IS 
'Verifica se usuário está em quiet hours';
