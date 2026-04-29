-- ============================================================================
-- MIGRATION: Corrigir FK de education_profiles para referenciar profiles(id)
-- ============================================================================
-- O código usa o profile_id (da URL /perfil/empresas/:businessId) como
-- business_id no education_profiles. A FK deve referenciar profiles(id),
-- não business_data(id).
-- ============================================================================

-- Remover FK atual (que aponta para business_data)
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS education_profiles_business_id_fkey;

-- Adicionar FK correta apontando para profiles(id)
ALTER TABLE education_profiles
  ADD CONSTRAINT education_profiles_business_id_fkey
  FOREIGN KEY (business_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Atualizar política RLS para usar profiles corretamente
DROP POLICY IF EXISTS education_profiles_owner_all ON education_profiles;

CREATE POLICY education_profiles_owner_all
  ON education_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = education_profiles.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager')
    )
  );

COMMENT ON CONSTRAINT education_profiles_business_id_fkey ON education_profiles
  IS 'FK corrigida: referencia profiles(id) - o profile_id usado nas URLs do dashboard';
