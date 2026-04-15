-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ÍNDICES PROFILES
-- ============================================================================
-- Criar índices e partial unique indexes para profiles
-- ============================================================================

-- Partial unique index: handle único globalmente
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_handle_unique 
  ON profiles(handle) 
  WHERE handle IS NOT NULL;

-- Partial unique index: 1 personal por user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_personal_per_user 
  ON profiles(user_id) 
  WHERE (profile_type = 'personal');

-- Partial unique index: 1 driver por user
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_driver_per_user 
  ON profiles(user_id) 
  WHERE (profile_type = 'driver');

-- Índice para perfis ativos e públicos
CREATE INDEX IF NOT EXISTS idx_profiles_active_public 
  ON profiles(is_active, is_public) 
  WHERE is_active = true AND is_public = true;

-- Comentários de auditoria
COMMENT ON INDEX idx_profiles_handle_unique IS 'Multi-perfil: garante handle único globalmente';
COMMENT ON INDEX idx_profiles_personal_per_user IS 'Multi-perfil: garante 1 personal por conta';
COMMENT ON INDEX idx_profiles_driver_per_user IS 'Multi-perfil: garante 1 driver por conta';
COMMENT ON INDEX idx_profiles_active_public IS 'Multi-perfil: otimiza descoberta pública';
