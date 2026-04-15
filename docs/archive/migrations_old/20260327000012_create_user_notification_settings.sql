-- ============================================================================
-- Migration: Create user_notification_settings table
-- Description: Tabela para armazenar configurações de notificação dos usuários
-- Date: 2026-03-27
-- ============================================================================

-- Criar tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  -- Identificação
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canais de notificação
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  
  -- Notificações sociais
  new_messages BOOLEAN NOT NULL DEFAULT true,
  new_comments BOOLEAN NOT NULL DEFAULT true,
  new_likes BOOLEAN NOT NULL DEFAULT true,
  new_followers BOOLEAN NOT NULL DEFAULT true,
  
  -- Notificações de plataforma
  business_updates BOOLEAN NOT NULL DEFAULT true,
  community_updates BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.user_notification_settings IS 
  '✅ SSOT: Configurações de notificação dos usuários';

COMMENT ON COLUMN public.user_notification_settings.user_id IS 
  '✅ SSOT: user_id (contexto de configurações de conta)';

COMMENT ON COLUMN public.user_notification_settings.email_notifications IS 
  'Receber notificações por email';

COMMENT ON COLUMN public.user_notification_settings.push_notifications IS 
  'Receber notificações push no navegador';

COMMENT ON COLUMN public.user_notification_settings.new_messages IS 
  'Notificar quando receber mensagens diretas';

COMMENT ON COLUMN public.user_notification_settings.new_comments IS 
  'Notificar quando alguém comentar em seus posts';

COMMENT ON COLUMN public.user_notification_settings.new_likes IS 
  'Notificar quando alguém curtir seus posts/comentários';

COMMENT ON COLUMN public.user_notification_settings.new_followers IS 
  'Notificar quando alguém começar a seguir você';

COMMENT ON COLUMN public.user_notification_settings.business_updates IS 
  'Notificar sobre atualizações de empresas que você segue';

COMMENT ON COLUMN public.user_notification_settings.community_updates IS 
  'Notificar sobre eventos e novidades da comunidade';

COMMENT ON COLUMN public.user_notification_settings.weekly_digest IS 
  'Receber resumo semanal de atividades';

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
  ON public.user_notification_settings(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_notification_settings_updated_at
  BEFORE UPDATE ON public.user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_settings_updated_at();

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias configurações
CREATE POLICY "Users can view own notification settings"
  ON public.user_notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias configurações
CREATE POLICY "Users can insert own notification settings"
  ON public.user_notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias configurações
CREATE POLICY "Users can update own notification settings"
  ON public.user_notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias configurações
CREATE POLICY "Users can delete own notification settings"
  ON public.user_notification_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notification_settings TO authenticated;
GRANT SELECT ON public.user_notification_settings TO anon;
