-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Migrar user_roles para nova estrutura
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Atualiza a tabela user_roles existente para a nova estrutura com:
-- - Enum app_role ao invés de TEXT
-- - Campos de revogação (revoked_at, revoked_by)
-- - Metadados JSONB
-- - Auditoria completa
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- 1. CRIAR ENUM app_role
-- ══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM (
    'super_admin',
    'admin',
    'moderator',
    'business_owner',
    'driver',
    'user'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE app_role IS 
'Roles disponíveis no sistema: super_admin, admin, moderator, business_owner, driver, user';

-- ══════════════════════════════════════════════════════════════════════════
-- 2. ADICIONAR NOVOS CAMPOS À TABELA user_roles
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar campos de revogação
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Adicionar campos de auditoria se não existirem
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ══════════════════════════════════════════════════════════════════════════
-- 3. MIGRAR CAMPO role DE TEXT PARA ENUM (SEM DROPAR A COLUNA ANTIGA)
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar nova coluna role_enum
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_enum app_role;

-- Migrar dados da coluna role (TEXT) para role_enum (app_role)
UPDATE user_roles 
SET role_enum = CASE 
  WHEN role = 'admin' THEN 'admin'::app_role
  WHEN role = 'moderator' THEN 'moderator'::app_role
  WHEN role = 'user' THEN 'user'::app_role
  ELSE 'user'::app_role -- fallback
END
WHERE role_enum IS NULL;

-- Tornar role_enum NOT NULL
ALTER TABLE user_roles ALTER COLUMN role_enum SET NOT NULL;

-- NOTA: A coluna 'role' antiga (TEXT) será mantida por compatibilidade
-- com policies existentes. Em uma migration futura, após atualizar todas
-- as policies, podemos remover a coluna antiga e renomear role_enum para role.

-- ══════════════════════════════════════════════════════════════════════════
-- 4. SINCRONIZAR is_active COM revoked_at (MANTER AMBAS POR COMPATIBILIDADE)
-- ══════════════════════════════════════════════════════════════════════════

-- Marcar roles inativos como revogados
UPDATE user_roles 
SET revoked_at = NOW()
WHERE is_active = false AND revoked_at IS NULL;

-- Marcar roles revogados como inativos
UPDATE user_roles 
SET is_active = false
WHERE revoked_at IS NOT NULL AND is_active = true;

-- NOTA: Mantemos is_active por compatibilidade com policies existentes.
-- Em uma migration futura, após atualizar todas as policies para usar
-- revoked_at IS NULL, podemos remover is_active.

-- Remover coluna expires_at (não usamos mais)
-- NOTA: Comentado por segurança, verificar se há dependências
-- ALTER TABLE user_roles DROP COLUMN IF EXISTS expires_at;

-- ══════════════════════════════════════════════════════════════════════════
-- 5. RECRIAR CONSTRAINTS E ÍNDICES
-- ══════════════════════════════════════════════════════════════════════════

-- Remover constraint antiga
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS unique_user_role;

-- Criar índice único parcial: não pode ter role duplicado ativo
DROP INDEX IF EXISTS idx_user_roles_unique_active;
CREATE UNIQUE INDEX idx_user_roles_unique_active 
  ON user_roles(user_id, role_enum) 
  WHERE revoked_at IS NULL;

-- Recriar índices
DROP INDEX IF EXISTS idx_user_roles_user_id;
CREATE INDEX idx_user_roles_user_id 
  ON user_roles(user_id) 
  WHERE revoked_at IS NULL;

DROP INDEX IF EXISTS idx_user_roles_active;
CREATE INDEX idx_user_roles_role 
  ON user_roles(role_enum) 
  WHERE revoked_at IS NULL;

-- Novos índices
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by 
  ON user_roles(granted_by);

CREATE INDEX IF NOT EXISTS idx_user_roles_revoked_at 
  ON user_roles(revoked_at) 
  WHERE revoked_at IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════
-- 6. ATUALIZAR TRIGGER updated_at
-- ══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- 7. CRIAR TABELA role_history (AUDITORIA)
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS role_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_role_history_user_id 
  ON role_history(user_id);

CREATE INDEX IF NOT EXISTS idx_role_history_performed_at 
  ON role_history(performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_history_performed_by 
  ON role_history(performed_by);

COMMENT ON TABLE role_history IS 
'Histórico completo de concessões e revogações de roles para auditoria.';

-- ══════════════════════════════════════════════════════════════════════════
-- 8. CRIAR/ATUALIZAR FUNÇÕES
-- ══════════════════════════════════════════════════════════════════════════

-- Dropar apenas funções que não têm dependências
DROP FUNCTION IF EXISTS has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS has_role(UUID, app_role);
DROP FUNCTION IF EXISTS get_user_roles(UUID);
DROP FUNCTION IF EXISTS is_super_admin(UUID);

-- Criar has_role com novo enum
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role_enum = _role
      AND revoked_at IS NULL
  );
END;
$$;

COMMENT ON FUNCTION has_role(UUID, app_role) IS 
'Verifica se um usuário possui um role específico ativo. SECURITY DEFINER para uso em RLS.';

-- Atualizar is_admin (CREATE OR REPLACE para manter dependências)
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN has_role(p_user_id, 'admin') OR has_role(p_user_id, 'super_admin');
END;
$$;

COMMENT ON FUNCTION is_admin(UUID) IS 
'Verifica se um usuário é admin ou super_admin. Helper para RLS.';

-- Criar is_super_admin
CREATE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN has_role(_user_id, 'super_admin');
END;
$$;

COMMENT ON FUNCTION is_super_admin(UUID) IS 
'Verifica se um usuário é super_admin. Helper para RLS.';

-- Criar get_user_roles
CREATE FUNCTION get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  roles app_role[];
BEGIN
  SELECT ARRAY_AGG(role_enum)
  INTO roles
  FROM user_roles
  WHERE user_id = _user_id
    AND revoked_at IS NULL;
  
  RETURN COALESCE(roles, ARRAY[]::app_role[]);
END;
$$;

COMMENT ON FUNCTION get_user_roles(UUID) IS 
'Retorna array com todos os roles ativos de um usuário.';

-- ══════════════════════════════════════════════════════════════════════════
-- 9. CRIAR TRIGGER para role_history E SINCRONIZAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Trigger para sincronizar is_active com revoked_at
CREATE OR REPLACE FUNCTION sync_user_roles_is_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se revoked_at foi setado, marcar is_active = false
  IF NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    NEW.is_active = false;
  END IF;
  
  -- Se revoked_at foi removido, marcar is_active = true
  IF NEW.revoked_at IS NULL AND OLD.revoked_at IS NOT NULL THEN
    NEW.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_roles_is_active_trigger ON user_roles;
CREATE TRIGGER sync_user_roles_is_active_trigger
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_roles_is_active();

-- Trigger para log de mudanças
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO role_history (
      user_id,
      role,
      action,
      performed_by,
      reason,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.role_enum,
      'granted',
      NEW.granted_by,
      NEW.reason,
      NEW.metadata
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    INSERT INTO role_history (
      user_id,
      role,
      action,
      performed_by,
      reason,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.role_enum,
      'revoked',
      NEW.revoked_by,
      NEW.reason,
      NEW.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_role_change_trigger ON user_roles;
CREATE TRIGGER log_role_change_trigger
  AFTER INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

COMMENT ON FUNCTION log_role_change() IS 
'Registra automaticamente mudanças de roles na tabela role_history.';

-- ══════════════════════════════════════════════════════════════════════════
-- 10. ATUALIZAR RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════

-- Remover policies antigas
DROP POLICY IF EXISTS "Admins manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON user_roles;

-- Criar novas policies
DROP POLICY IF EXISTS "Usuários podem ver seus próprios roles" ON user_roles;
CREATE POLICY "Usuários podem ver seus próprios roles" 
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todos os roles" ON user_roles;
CREATE POLICY "Admins podem ver todos os roles" 
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins podem gerenciar roles" ON user_roles;
CREATE POLICY "Super admins podem gerenciar roles" 
  ON user_roles FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Policies para role_history
ALTER TABLE role_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver seu próprio histórico" ON role_history;
CREATE POLICY "Usuários podem ver seu próprio histórico" 
  ON role_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todo o histórico" ON role_history;
CREATE POLICY "Admins podem ver todo o histórico" 
  ON role_history FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON role_history;
CREATE POLICY "Sistema pode inserir no histórico" 
  ON role_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════
-- 11. ATUALIZAR COMENTÁRIOS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE user_roles IS 
'Roles atribuídos aos usuários. Suporta múltiplos roles por usuário e auditoria completa.';

COMMENT ON COLUMN user_roles.role_enum IS 
'Role atribuído (novo): super_admin, admin, moderator, business_owner, driver, user';

COMMENT ON COLUMN user_roles.granted_by IS 
'Usuário que concedeu o role (NULL = sistema)';

COMMENT ON COLUMN user_roles.revoked_at IS 
'Data de revogação do role (NULL = ativo)';

COMMENT ON COLUMN user_roles.metadata IS 
'Metadados adicionais (ex: escopo, limitações, contexto)';

-- ══════════════════════════════════════════════════════════════════════════
-- 12. GRANTS
-- ══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- 13. POPULAR role_history COM DADOS EXISTENTES
-- ══════════════════════════════════════════════════════════════════════════

-- Inserir histórico para roles existentes
INSERT INTO role_history (user_id, role, action, performed_by, performed_at, reason)
SELECT 
  user_id,
  role_enum,
  'granted',
  granted_by,
  granted_at,
  'Migrado de estrutura antiga'
FROM user_roles
WHERE revoked_at IS NULL
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
