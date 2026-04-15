-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - PROFILE_LINKS
-- ============================================================================
-- Criar tabela de vínculos entre perfis da mesma conta
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  link_type TEXT NOT NULL CHECK (link_type IN ('owns', 'works_for', 'drives_for', 'partner')),
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CHECK (from_profile_id != to_profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profile_links_from ON profile_links(from_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_links_to ON profile_links(to_profile_id);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_links_unique 
  ON profile_links(from_profile_id, to_profile_id, link_type);

-- Comentários de auditoria
COMMENT ON TABLE profile_links IS 'Multi-perfil: vínculos entre perfis da mesma conta';
COMMENT ON COLUMN profile_links.link_type IS 'Tipo de vínculo: owns (pessoa possui empresa), works_for (profissional trabalha para empresa), drives_for (motorista dirige para empresa), partner (parceria)';
COMMENT ON COLUMN profile_links.is_public IS 'Controla se o vínculo aparece publicamente';
