-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ADMIN TABLES
-- ============================================================================
-- Criar tabelas de administração (admin_users e profile_audit_log)
-- ============================================================================

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Tabela de audit log para perfis
CREATE TABLE IF NOT EXISTS profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_audit_log_profile ON profile_audit_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_audit_log_performed_at ON profile_audit_log(performed_at DESC);

-- Comentários de auditoria
COMMENT ON TABLE admin_users IS 'Multi-perfil: usuários com permissões administrativas';
COMMENT ON TABLE profile_audit_log IS 'Multi-perfil: log de ações administrativas em perfis';
COMMENT ON COLUMN admin_users.role IS 'super_admin: acesso total, moderator: moderação de conteúdo';
COMMENT ON COLUMN profile_audit_log.action IS 'Ação realizada: suspended, verified, etc';
