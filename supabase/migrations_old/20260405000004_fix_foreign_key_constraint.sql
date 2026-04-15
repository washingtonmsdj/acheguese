-- ============================================================================
-- MIGRAÇÃO: Corrigir Foreign Key Constraint
-- Data: 2026-04-05
-- Descrição: Renomear constraint para corresponder ao nome da coluna
-- ============================================================================

-- Remover constraint antigo e criar novo com nome correto
ALTER TABLE community_issues 
  DROP CONSTRAINT IF EXISTS community_issues_profile_id_fkey;

ALTER TABLE community_issues
  ADD CONSTRAINT community_issues_author_profile_id_fkey 
  FOREIGN KEY (author_profile_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
