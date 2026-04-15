-- ============================================================================
-- SPRINT 2 - FASE 1: MODELAGEM TERRITORIAL
-- ============================================================================
-- Data: 2026-04-05
-- Objetivo: Implementar base territorial em posts (FK, trigger, índices, RLS)
-- IMPORTANTE: NOT NULL em location_id será aplicado apenas na Fase 4
-- ============================================================================

-- ============================================================================
-- 1. FOREIGN KEY: posts.location_id -> locations.id
-- ============================================================================
-- FK garante existência da location
-- ON DELETE RESTRICT: não permite deletar location se houver posts

ALTER TABLE posts
  ADD CONSTRAINT posts_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT posts_location_id_fkey ON posts IS
  'FK com RESTRICT: não permite deletar location se houver posts. location_id será NOT NULL na Fase 4.';

-- ============================================================================
-- 2. TRIGGER: Validação territorial (type e status)
-- ============================================================================
-- Trigger valida type (city/district) e status (active)
-- FK já garante existência, trigger valida regras de negócio

CREATE OR REPLACE FUNCTION validate_post_location()
RETURNS TRIGGER AS $$
DECLARE
  loc_type TEXT;
  loc_status TEXT;
BEGIN
  IF NEW.location_id IS NOT NULL THEN
    -- Buscar type e status da location
    SELECT type, status
      INTO loc_type, loc_status
    FROM locations
    WHERE id = NEW.location_id;
    
    -- Validar existência
    IF loc_type IS NULL THEN
      RAISE EXCEPTION 'location_id inexistente';
    END IF;
    
    -- Validar tipo (city ou district)
    IF loc_type NOT IN ('city', 'district') THEN
      RAISE EXCEPTION 'Posts só podem ser criados em cidades ou bairros';
    END IF;
    
    -- Validar status (active)
    IF loc_status <> 'active' THEN
      RAISE EXCEPTION 'Localização inativa';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_post_location() IS
  'Valida que location_id aponta para location ativa do tipo city ou district';

-- Drop trigger se existir (idempotência)
DROP TRIGGER IF EXISTS validate_post_location_trigger ON posts;

-- Criar trigger
CREATE TRIGGER validate_post_location_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_post_location();

-- ============================================================================
-- 3. ÍNDICES TERRITORIAIS
-- ============================================================================

-- Índice para queries de feed por location + ordenação temporal
CREATE INDEX IF NOT EXISTS idx_posts_location_created 
  ON posts(location_id, created_at DESC) 
  WHERE location_id IS NOT NULL AND is_published = true;

COMMENT ON INDEX idx_posts_location_created IS
  'Índice para feed territorial ordenado por data (location_id + created_at)';

-- Índice para queries de feed por location + reach
CREATE INDEX IF NOT EXISTS idx_posts_location_reach 
  ON posts(location_id, reach) 
  WHERE location_id IS NOT NULL;

COMMENT ON INDEX idx_posts_location_reach IS
  'Índice para filtros territoriais com reach (metadado de visibilidade)';

-- ============================================================================
-- 4. RLS POLICIES: Multi-Profile com EXISTS
-- ============================================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Published posts viewable" ON posts;
DROP POLICY IF EXISTS "Authors manage own posts" ON posts;

-- Policy: Leitura de posts publicados (anônimos e autenticados)
CREATE POLICY posts_read_published ON posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

COMMENT ON POLICY posts_read_published ON posts IS
  'Permite leitura de posts publicados por usuários anônimos e autenticados';

-- Policy: Leitura de posts próprios (multi-profile)
CREATE POLICY posts_read_own ON posts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

COMMENT ON POLICY posts_read_own ON posts IS
  'Permite leitura de posts próprios (suporta multi-profile via EXISTS)';

-- Policy: Criação de posts (requer location_id)
CREATE POLICY posts_create ON posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
    AND location_id IS NOT NULL
  );

COMMENT ON POLICY posts_create ON posts IS
  'Permite criação de posts com location_id obrigatório (multi-profile via EXISTS)';

-- Policy: Atualização de posts próprios (multi-profile)
CREATE POLICY posts_update_own ON posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

COMMENT ON POLICY posts_update_own ON posts IS
  'Permite atualização de posts próprios (multi-profile via EXISTS)';

-- Policy: Deleção de posts próprios (multi-profile)
CREATE POLICY posts_delete_own ON posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_profile_id 
        AND profiles.user_id = auth.uid()
    )
  );

COMMENT ON POLICY posts_delete_own ON posts IS
  'Permite deleção de posts próprios (multi-profile via EXISTS)';

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

DO $$
BEGIN
  -- Verificar FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_location_id_fkey'
  ) THEN
    RAISE EXCEPTION 'FK posts_location_id_fkey não foi criada';
  END IF;
  
  -- Verificar trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_post_location_trigger'
  ) THEN
    RAISE EXCEPTION 'Trigger validate_post_location_trigger não foi criado';
  END IF;
  
  -- Verificar policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' AND policyname = 'posts_read_published'
  ) THEN
    RAISE EXCEPTION 'Policy posts_read_published não foi criada';
  END IF;
  
  RAISE NOTICE 'Fase 1 concluída: FK, trigger, índices e RLS criados';
END $$;
