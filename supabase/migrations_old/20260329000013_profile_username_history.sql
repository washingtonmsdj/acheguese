-- ============================================================================
-- PROFILE USERNAME HISTORY
-- ============================================================================
-- Histórico de mudanças de username de profiles
-- 
-- RESPONSABILIDADE:
-- - Registrar mudanças de username para auditoria
-- - Implementar cooldown de 30 dias
-- - NÃO criar redirect público (apenas auditoria interna)
--
-- SSOT: profile_username_history é a fonte única de verdade para:
-- - Histórico de usernames
-- - Cálculo de cooldown
-- - Auditoria de mudanças
--
-- DIFERENÇA DE BUSINESS:
-- - Business: histórico público com redirect 308
-- - Profile: histórico interno, sem redirect público
-- ============================================================================

-- Tabela de histórico de username
CREATE TABLE IF NOT EXISTS profile_username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  old_username TEXT NOT NULL,
  new_username TEXT NOT NULL,
  change_reason TEXT NOT NULL DEFAULT 'username_changed',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- FK para profiles (ID canônico)
  CONSTRAINT profile_username_history_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Comentários
COMMENT ON TABLE profile_username_history IS 
  'Histórico de mudanças de username de profiles (auditoria interna, sem redirect público)';
COMMENT ON COLUMN profile_username_history.profile_id IS 
  'ID canônico do profile (profiles.id)';
COMMENT ON COLUMN profile_username_history.old_username IS 
  'Username anterior';
COMMENT ON COLUMN profile_username_history.new_username IS 
  'Novo username';
COMMENT ON COLUMN profile_username_history.change_reason IS 
  'Razão da mudança (sempre username_changed para profile)';
COMMENT ON COLUMN profile_username_history.changed_at IS 
  'Data/hora da mudança (SSOT para cooldown)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_username_history_profile_id 
  ON profile_username_history(profile_id);
  
CREATE INDEX IF NOT EXISTS idx_profile_username_history_changed_at 
  ON profile_username_history(changed_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_profile_username_history_old_username 
  ON profile_username_history(old_username);

-- RLS: Habilitar segurança em nível de linha
ALTER TABLE profile_username_history ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas o dono pode ver seu histórico
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_username_history' 
    AND policyname = 'Users can view own username history'
  ) THEN
    CREATE POLICY "Users can view own username history"
      ON profile_username_history
      FOR SELECT
      USING (
        profile_id IN (
          SELECT id FROM profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Policy: Admins podem ver todo histórico
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profile_username_history' 
    AND policyname = 'Admins can view all username history'
  ) THEN
    CREATE POLICY "Admins can view all username history"
      ON profile_username_history
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'moderator')
            AND is_active = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Registro Automático de Mudança de Username
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_record_profile_username_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra apenas se username mudou
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    INSERT INTO profile_username_history (
      profile_id,
      old_username,
      new_username,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.username,
      NEW.username,
      'username_changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_record_profile_username_history() IS 
  'Registra automaticamente mudanças de username em profile_username_history';

-- Criar trigger
DROP TRIGGER IF EXISTS trg_record_profile_username_history ON profiles;

CREATE TRIGGER trg_record_profile_username_history
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_profile_username_history();

COMMENT ON TRIGGER trg_record_profile_username_history ON profiles IS 
  'Trigger que registra mudanças de username automaticamente';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Verificar que a tabela foi criada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profile_username_history'
  ) THEN
    RAISE EXCEPTION 'Table profile_username_history was not created';
  END IF;
  
  RAISE NOTICE 'Migration 20260329000012_profile_username_history completed successfully';
END $$;
