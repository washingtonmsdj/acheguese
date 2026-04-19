-- ============================================================================
-- MIGRATION: Create Lost & Found System
-- ============================================================================
-- Data: 2026-04-19
-- Descrição: Sistema de achados e perdidos
-- ============================================================================

-- ENUMS
CREATE TYPE lost_found_type AS ENUM ('perdido', 'achado');

-- 1. LOST_FOUND_POSTS
CREATE TABLE IF NOT EXISTS lost_found_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo lost_found_type NOT NULL,
  titulo TEXT NOT NULL CHECK (char_length(titulo) >= 3 AND char_length(titulo) <= 200),
  descricao TEXT NOT NULL CHECK (char_length(descricao) >= 10 AND char_length(descricao) <= 5000),
  categoria TEXT NOT NULL CHECK (categoria IN ('documento', 'eletrônico', 'chave', 'carteira', 'animal', 'roupa', 'acessório', 'outro')),
  local_perdido TEXT,
  data_perdido DATE,
  imagens TEXT[] DEFAULT '{}',
  contato_telefone TEXT,
  contato_email TEXT,
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_contact CHECK (
    contato_telefone IS NOT NULL OR contato_email IS NOT NULL
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_autor_id ON lost_found_posts(autor_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_tipo ON lost_found_posts(tipo);
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_categoria ON lost_found_posts(categoria);
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_resolvido ON lost_found_posts(resolvido);
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_created_at ON lost_found_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lost_found_posts_tipo_resolvido ON lost_found_posts(tipo, resolvido);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_lost_found_posts_updated_at ON lost_found_posts;
CREATE TRIGGER update_lost_found_posts_updated_at 
  BEFORE UPDATE ON lost_found_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE lost_found_posts ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar posts não resolvidos
DROP POLICY IF EXISTS "Lost found posts viewable" ON lost_found_posts;
CREATE POLICY "Lost found posts viewable" 
  ON lost_found_posts 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Usuários autenticados podem criar posts
DROP POLICY IF EXISTS "Users create lost found posts" ON lost_found_posts;
CREATE POLICY "Users create lost found posts" 
  ON lost_found_posts 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    autor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Autores podem atualizar seus próprios posts
DROP POLICY IF EXISTS "Authors update own posts" ON lost_found_posts;
CREATE POLICY "Authors update own posts" 
  ON lost_found_posts 
  FOR UPDATE 
  TO authenticated 
  USING (
    autor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Autores podem deletar seus próprios posts
DROP POLICY IF EXISTS "Authors delete own posts" ON lost_found_posts;
CREATE POLICY "Authors delete own posts" 
  ON lost_found_posts 
  FOR DELETE 
  TO authenticated 
  USING (
    autor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 2. LOST_FOUND_COMMENTS
CREATE TABLE IF NOT EXISTS lost_found_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES lost_found_posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL CHECK (char_length(conteudo) >= 1 AND char_length(conteudo) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lost_found_comments_post_id ON lost_found_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_comments_autor_id ON lost_found_comments(autor_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_comments_created_at ON lost_found_comments(created_at ASC);

-- RLS Policies
ALTER TABLE lost_found_comments ENABLE ROW LEVEL SECURITY;

-- Todos podem visualizar comentários
DROP POLICY IF EXISTS "Comments viewable" ON lost_found_comments;
CREATE POLICY "Comments viewable" 
  ON lost_found_comments 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Usuários autenticados podem criar comentários
DROP POLICY IF EXISTS "Users create comments" ON lost_found_comments;
CREATE POLICY "Users create comments" 
  ON lost_found_comments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    autor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Autores podem deletar seus próprios comentários
DROP POLICY IF EXISTS "Authors delete own comments" ON lost_found_comments;
CREATE POLICY "Authors delete own comments" 
  ON lost_found_comments 
  FOR DELETE 
  TO authenticated 
  USING (
    autor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 3. FUNCTIONS

-- Função para contar posts por tipo
CREATE OR REPLACE FUNCTION count_lost_found_posts_by_type()
RETURNS TABLE (
  tipo lost_found_type,
  total BIGINT,
  resolvidos BIGINT,
  pendentes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.tipo,
    COUNT(*)::BIGINT as total,
    COUNT(*) FILTER (WHERE p.resolvido = true)::BIGINT as resolvidos,
    COUNT(*) FILTER (WHERE p.resolvido = false)::BIGINT as pendentes
  FROM lost_found_posts p
  GROUP BY p.tipo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar posts similares (matching)
CREATE OR REPLACE FUNCTION find_similar_lost_found_posts(
  p_post_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  descricao TEXT,
  categoria TEXT,
  similarity_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_post AS (
    SELECT tipo, categoria, titulo, descricao
    FROM lost_found_posts
    WHERE lost_found_posts.id = p_post_id
  )
  SELECT 
    p.id,
    p.titulo,
    p.descricao,
    p.categoria,
    (
      CASE WHEN p.categoria = cp.categoria THEN 0.5 ELSE 0 END +
      CASE WHEN p.tipo <> cp.tipo THEN 0.5 ELSE 0 END
    )::NUMERIC as similarity_score
  FROM lost_found_posts p
  CROSS JOIN current_post cp
  WHERE p.id <> p_post_id
    AND p.resolvido = false
    AND p.tipo <> cp.tipo  -- Perdido busca Achado e vice-versa
  ORDER BY similarity_score DESC, p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMENTÁRIOS
COMMENT ON TABLE lost_found_posts IS 'Posts de achados e perdidos';
COMMENT ON TABLE lost_found_comments IS 'Comentários em posts de achados e perdidos';
COMMENT ON FUNCTION count_lost_found_posts_by_type() IS 'Conta posts por tipo (perdido/achado)';
COMMENT ON FUNCTION find_similar_lost_found_posts(UUID, INTEGER) IS 'Busca posts similares para matching';

-- FIM
