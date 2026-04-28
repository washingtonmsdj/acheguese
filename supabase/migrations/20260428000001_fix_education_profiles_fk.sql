-- ============================================================================
-- MIGRATION: Corrigir FK de education_profiles
-- ============================================================================
-- A migration original referenciava a tabela 'businesses' (legada).
-- O projeto usa 'business_data' como tabela principal de businesses.
-- Esta migration corrige a FK para referenciar 'business_data'.
-- ============================================================================

-- Remover FK antiga (se existir)
ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS education_profiles_business_id_fkey;

-- Adicionar FK correta apontando para business_data
ALTER TABLE education_profiles
  ADD CONSTRAINT education_profiles_business_id_fkey
  FOREIGN KEY (business_id)
  REFERENCES business_data(id)
  ON DELETE CASCADE;

-- Atualizar política RLS para usar business_data corretamente
DROP POLICY IF EXISTS education_profiles_owner_all ON education_profiles;

CREATE POLICY education_profiles_owner_all
  ON education_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM business_data bd
      JOIN profile_members pm ON pm.profile_id = bd.profile_id
      WHERE bd.id = education_profiles.business_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'manager')
    )
  );

COMMENT ON CONSTRAINT education_profiles_business_id_fkey ON education_profiles
  IS 'FK corrigida: referencia business_data(id) em vez de businesses(id)';
