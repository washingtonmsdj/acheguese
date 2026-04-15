-- ============================================================================
-- FASE 1: MULTI-PERFIL REAL - ALTER PROFILE_MEMBERS
-- ============================================================================
-- Adicionar campos e constraints para profile_members
-- ============================================================================

-- Adicionar campo invited_by se não existir
ALTER TABLE profile_members ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- Adicionar campo joined_at se não existir (renomear created_at se necessário)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profile_members' AND column_name = 'joined_at') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profile_members' AND column_name = 'created_at') THEN
      ALTER TABLE profile_members RENAME COLUMN created_at TO joined_at;
    ELSE
      ALTER TABLE profile_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT now();
    END IF;
  END IF;
END $$;

-- Partial unique index: apenas 1 owner por perfil
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_members_one_owner_per_profile 
  ON profile_members(profile_id) 
  WHERE (role = 'owner');

-- Comentários de auditoria
COMMENT ON COLUMN profile_members.invited_by IS 'Multi-perfil: quem convidou este membro';
COMMENT ON INDEX idx_profile_members_one_owner_per_profile IS 'Multi-perfil: garante 1 owner operacional por perfil';
