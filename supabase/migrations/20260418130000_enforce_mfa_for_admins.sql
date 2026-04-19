-- =====================================================
-- MIGRATION: Enforce MFA for Admins
-- =====================================================
-- Descrição: Cria estrutura para forçar MFA em usuários admin
-- Data: 2026-04-18
-- Autor: Kiro AI
-- Fase: Pré-Lançamento - Autenticação & Segurança
-- =====================================================

-- =====================================================
-- 1. TABELA: admin_mfa_enforcement
-- =====================================================
-- Rastreia quais roles requerem MFA obrigatório

CREATE TABLE IF NOT EXISTS admin_mfa_enforcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_enum app_role NOT NULL UNIQUE,
  mfa_required boolean NOT NULL DEFAULT true,
  grace_period_days integer NOT NULL DEFAULT 7,
  enforcement_started_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_admin_mfa_enforcement_role 
  ON admin_mfa_enforcement(role_enum);

-- RLS
ALTER TABLE admin_mfa_enforcement ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas super_admin pode modificar
CREATE POLICY admin_mfa_enforcement_super_admin_all 
  ON admin_mfa_enforcement
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum = 'super_admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- Policy: Todos autenticados podem ler
CREATE POLICY admin_mfa_enforcement_read_all 
  ON admin_mfa_enforcement
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 2. TABELA: user_mfa_status
-- =====================================================
-- Rastreia status de MFA de cada usuário

CREATE TABLE IF NOT EXISTS user_mfa_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_method text, -- 'totp', 'sms', etc.
  enrolled_at timestamptz,
  last_verified_at timestamptz,
  backup_codes_generated boolean NOT NULL DEFAULT false,
  backup_codes_count integer NOT NULL DEFAULT 0,
  grace_period_expires_at timestamptz,
  is_exempt boolean NOT NULL DEFAULT false,
  exemption_reason text,
  exemption_granted_by uuid REFERENCES auth.users(id),
  exemption_granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_mfa_status_user_id 
  ON user_mfa_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_status_mfa_enabled 
  ON user_mfa_status(mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_user_mfa_status_grace_period 
  ON user_mfa_status(grace_period_expires_at) 
  WHERE grace_period_expires_at IS NOT NULL;

-- RLS
ALTER TABLE user_mfa_status ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver seu próprio status
CREATE POLICY user_mfa_status_own_read 
  ON user_mfa_status
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Usuário pode atualizar seu próprio status (exceto exemption)
CREATE POLICY user_mfa_status_own_update 
  ON user_mfa_status
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND is_exempt = (SELECT is_exempt FROM user_mfa_status WHERE user_id = auth.uid())
    AND exemption_reason = (SELECT exemption_reason FROM user_mfa_status WHERE user_id = auth.uid())
  );

-- Policy: Admin pode ver todos
CREATE POLICY user_mfa_status_admin_read 
  ON user_mfa_status
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- Policy: Super admin pode atualizar qualquer (incluindo exemptions)
CREATE POLICY user_mfa_status_super_admin_update 
  ON user_mfa_status
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum = 'super_admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_enum = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- =====================================================
-- 3. FUNÇÃO: check_user_mfa_required
-- =====================================================
-- Verifica se usuário precisa ter MFA habilitado

CREATE OR REPLACE FUNCTION check_user_mfa_required(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_admin_role boolean;
  v_mfa_enabled boolean;
  v_is_exempt boolean;
  v_grace_period_expired boolean;
BEGIN
  -- Verificar se usuário tem role que requer MFA
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN admin_mfa_enforcement ame ON ur.role_enum = ame.role_enum
    WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND ame.mfa_required = true
  ) INTO v_has_admin_role;
  
  -- Se não tem role admin, MFA não é obrigatório
  IF NOT v_has_admin_role THEN
    RETURN false;
  END IF;
  
  -- Verificar status de MFA do usuário
  SELECT 
    COALESCE(mfa_enabled, false),
    COALESCE(is_exempt, false),
    CASE 
      WHEN grace_period_expires_at IS NULL THEN false
      WHEN grace_period_expires_at < now() THEN true
      ELSE false
    END
  INTO v_mfa_enabled, v_is_exempt, v_grace_period_expired
  FROM user_mfa_status
  WHERE user_id = p_user_id;
  
  -- Se está isento, MFA não é obrigatório
  IF v_is_exempt THEN
    RETURN false;
  END IF;
  
  -- Se MFA já está habilitado, está OK
  IF v_mfa_enabled THEN
    RETURN false;
  END IF;
  
  -- Se período de graça ainda não expirou, está OK
  IF NOT v_grace_period_expired THEN
    RETURN false;
  END IF;
  
  -- Caso contrário, MFA é obrigatório
  RETURN true;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: initialize_user_mfa_status
-- =====================================================
-- Inicializa status de MFA quando usuário ganha role admin

CREATE OR REPLACE FUNCTION initialize_user_mfa_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_grace_period_days integer;
BEGIN
  -- Verificar se a role requer MFA
  SELECT grace_period_days
  INTO v_grace_period_days
  FROM admin_mfa_enforcement
  WHERE role_enum = NEW.role_enum
  AND mfa_required = true;
  
  -- Se não requer MFA, não fazer nada
  IF v_grace_period_days IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Criar ou atualizar status de MFA
  INSERT INTO user_mfa_status (
    user_id,
    grace_period_expires_at
  )
  VALUES (
    NEW.user_id,
    now() + (v_grace_period_days || ' days')::interval
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    grace_period_expires_at = CASE
      WHEN user_mfa_status.mfa_enabled = false 
        AND user_mfa_status.grace_period_expires_at IS NULL
      THEN now() + (v_grace_period_days || ' days')::interval
      ELSE user_mfa_status.grace_period_expires_at
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger: Inicializar MFA status quando role admin é atribuída
DROP TRIGGER IF EXISTS trigger_initialize_user_mfa_status ON user_roles;
CREATE TRIGGER trigger_initialize_user_mfa_status
  AFTER INSERT OR UPDATE OF role_enum, is_active
  ON user_roles
  FOR EACH ROW
  WHEN (NEW.is_active = true AND NEW.role_enum IN ('super_admin'::app_role, 'admin'::app_role, 'moderator'::app_role))
  EXECUTE FUNCTION initialize_user_mfa_status();

-- =====================================================
-- 5. FUNÇÃO: update_user_mfa_status_timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_mfa_status_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: Atualizar timestamp
DROP TRIGGER IF EXISTS trigger_update_user_mfa_status_timestamp ON user_mfa_status;
CREATE TRIGGER trigger_update_user_mfa_status_timestamp
  BEFORE UPDATE ON user_mfa_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_mfa_status_timestamp();

-- =====================================================
-- 6. DADOS INICIAIS
-- =====================================================

-- Configurar enforcement para roles admin
INSERT INTO admin_mfa_enforcement (role_enum, mfa_required, grace_period_days)
VALUES 
  ('super_admin'::app_role, true, 7),
  ('admin'::app_role, true, 14),
  ('moderator'::app_role, false, 30)
ON CONFLICT (role_enum) DO UPDATE
SET 
  mfa_required = EXCLUDED.mfa_required,
  grace_period_days = EXCLUDED.grace_period_days,
  updated_at = now();

-- Inicializar status de MFA para todos os admins existentes
INSERT INTO user_mfa_status (user_id, grace_period_expires_at)
SELECT DISTINCT 
  ur.user_id,
  now() + (ame.grace_period_days || ' days')::interval
FROM user_roles ur
JOIN admin_mfa_enforcement ame ON ur.role_enum = ame.role_enum
WHERE ur.is_active = true
  AND ame.mfa_required = true
  AND NOT EXISTS (
    SELECT 1 FROM user_mfa_status ums
    WHERE ums.user_id = ur.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 7. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE admin_mfa_enforcement IS 
  'Configuração de enforcement de MFA por role administrativa';

COMMENT ON TABLE user_mfa_status IS 
  'Status de MFA de cada usuário, incluindo período de graça e isenções';

COMMENT ON FUNCTION check_user_mfa_required(uuid) IS 
  'Verifica se usuário precisa ter MFA habilitado baseado em suas roles';

COMMENT ON FUNCTION initialize_user_mfa_status() IS 
  'Inicializa status de MFA quando usuário ganha role que requer MFA';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
