-- ============================================================================
-- LIMPEZA ESTRUTURAL: Remover FK duplicada posts → locations
-- ============================================================================
-- Contexto:
--   Fase 0 criou: fk_posts_location_id
--   Fase 1 criou: posts_location_id_fkey
--   Ambas apontam para posts.location_id → locations.id
--   A duplicidade torna embeds Supabase ambíguos (exige hint explícito)
--
-- Decisão: manter fk_posts_location_id (nome semântico, criada primeiro)
--          remover posts_location_id_fkey (nome genérico, redundante)
-- ============================================================================

DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'posts'
      AND constraint_name = 'posts_location_id_fkey'
      AND constraint_type = 'FOREIGN KEY'
  ) INTO fk_exists;

  IF fk_exists THEN
    ALTER TABLE posts DROP CONSTRAINT posts_location_id_fkey;
    RAISE NOTICE 'FK posts_location_id_fkey removida com sucesso.';
  ELSE
    RAISE NOTICE 'FK posts_location_id_fkey não encontrada — nada a fazer.';
  END IF;
END $$;

-- Validar que apenas fk_posts_location_id permanece
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'posts'
    AND constraint_name LIKE '%location%'
    AND constraint_type = 'FOREIGN KEY';

  IF fk_count <> 1 THEN
    RAISE EXCEPTION 'Esperado 1 FK de location em posts, encontrado: %', fk_count;
  END IF;

  RAISE NOTICE 'Validação OK: 1 FK canônica (fk_posts_location_id) em posts.location_id';
END $$;
