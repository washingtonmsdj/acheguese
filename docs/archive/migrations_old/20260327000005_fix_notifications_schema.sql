-- Atualiza tabela notifications para o schema esperado pelo NotificationService
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Renomeia body -> message se necessário
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='body')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='message')
  THEN
    ALTER TABLE notifications RENAME COLUMN body TO message;
  END IF;
END $$;

-- Adiciona message se não existir
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false AND deleted_at IS NULL;
