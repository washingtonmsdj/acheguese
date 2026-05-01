-- ============================================================================
-- MIGRATION: Preparar correcao de FK de education_profiles
-- ============================================================================
-- A constraint antiga apontava para um destino legado/incorreto.
-- Esta migration remove o contrato antigo; a migration seguinte
-- (20260428000002) cria a FK final valida para profiles(id).
-- ============================================================================

ALTER TABLE education_profiles
  DROP CONSTRAINT IF EXISTS education_profiles_business_id_fkey;
