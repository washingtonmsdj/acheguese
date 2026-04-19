-- ============================================================================
-- MIGRATION: Create Community Domain Tables
-- ============================================================================
-- Etapa: 1.4.4 - Community Domain
-- Data: 2026-04-18
-- Descrição: Cria tabelas do domínio de comunidade (posts, comentários, curtidas)
--
-- SSOT PRINCIPLES:
--   - posts é tabela principal para conteúdo social
--   - community_posts é especialização para posts da comunidade
--   - Reutiliza profiles e locations
--   - RLS habilitado em todas as tabelas
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Tipo de post
CREATE TYPE post_type AS ENUM (
  'text',
  'image',
  'video',
  'link',
  'poll',
  'alerta'
);

-- ============================================================================
-- 1. POSTS - Posts Gerais
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Autor (legado + canônico)
  autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- legado
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- canônico
  
  -- Conteúdo (legado + canônico)
  texto TEXT, -- legado
  content TEXT, -- canônico
  
  -- Tipo e mídia
  type post_type NOT NULL DEFAULT 'text',
  image_url TEXT,
  video_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Localização (legado + canônico)
  city TEXT, -- legado
  neighborhood TEXT, -- legado
  street TEXT, -- legado
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL, -- canônico
  
  -- Contadores
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
  
  -- Community posts extras
  tags JSONB DEFAULT '[]',
  confirmations_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmations_count >= 0),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_posts_author_profile_id ON posts(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_location_id ON posts(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_is_published ON posts(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_posts_is_verified ON posts(is_verified) WHERE is_verified = true;

-- Trigger
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published posts viewable" ON posts;
CREATE POLICY "Published posts viewable"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Authors manage own posts" ON posts;
CREATE POLICY "Authors manage own posts"
  ON posts FOR ALL
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. COMMUNITY_POSTS - Posts da Comunidade
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Autor
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo e conteúdo
  type TEXT NOT NULL DEFAULT 'post',
  content TEXT,
  
  -- Tags e localização
  tags JSONB DEFAULT '[]',
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  
  -- Confirmações e verificação
  confirmations_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmations_count >= 0),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_location_id ON community_posts(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_posts_is_verified ON community_posts(is_verified) WHERE is_verified = true;

-- Trigger
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community posts viewable" ON community_posts;
CREATE POLICY "Community posts viewable"
  ON community_posts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authors manage own community posts" ON community_posts;
CREATE POLICY "Authors manage own community posts"
  ON community_posts FOR ALL
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. COMMUNITY_POLLS - Enquetes da Comunidade
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para post
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  
  -- Enquete
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_polls_post_id ON community_polls(post_id);
CREATE INDEX IF NOT EXISTS idx_community_polls_expires_at ON community_polls(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Polls viewable" ON community_polls;
CREATE POLICY "Polls viewable"
  ON community_polls FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authors manage polls" ON community_polls;
CREATE POLICY "Authors manage polls"
  ON community_polls FOR ALL
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM community_posts 
      WHERE author_profile_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 4. COMMUNITY_POLL_OPTIONS - Opções de Enquete
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK para poll
  poll_id UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  
  -- Opção
  text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_community_poll_options_poll_id ON community_poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_community_poll_options_position ON community_poll_options(poll_id, position);

-- RLS
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Poll options viewable" ON community_poll_options;
CREATE POLICY "Poll options viewable"
  ON community_poll_options FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 5. POST_LIKES_NEW - Curtidas em Posts
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_likes_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  liker_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_post_like UNIQUE (post_id, liker_profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes_new(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile_id ON post_likes_new(liker_profile_id);

-- RLS
ALTER TABLE post_likes_new ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable" ON post_likes_new;
CREATE POLICY "Likes viewable"
  ON post_likes_new FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users manage own likes" ON post_likes_new;
CREATE POLICY "Users manage own likes"
  ON post_likes_new FOR ALL
  TO authenticated
  USING (
    liker_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. SAVED_POSTS_NEW - Posts Salvos
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_posts_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_saved_post UNIQUE (post_id, saver_profile_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts_new(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_profile_id ON saved_posts_new(saver_profile_id);

-- RLS
ALTER TABLE saved_posts_new ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved posts" ON saved_posts_new;
CREATE POLICY "Users manage own saved posts"
  ON saved_posts_new FOR ALL
  TO authenticated
  USING (
    saver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. COMMENTS - Comentários
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Post e autor
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Conteúdo
  content TEXT NOT NULL,
  
  -- Aninhamento (comentários em comentários)
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- Contadores
  likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  replies_count INTEGER NOT NULL DEFAULT 0 CHECK (replies_count >= 0),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_profile_id ON comments(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Trigger
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable" ON comments;
CREATE POLICY "Comments viewable"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authors manage own comments" ON comments;
CREATE POLICY "Authors manage own comments"
  ON comments FOR ALL
  TO authenticated
  USING (
    author_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE posts IS 'Posts gerais - tabela principal para conteúdo social';
COMMENT ON TABLE community_posts IS 'Posts da comunidade - especialização para posts comunitários';
COMMENT ON TABLE community_polls IS 'Enquetes da comunidade';
COMMENT ON TABLE community_poll_options IS 'Opções de enquetes com contagem de votos';
COMMENT ON TABLE post_likes_new IS 'Curtidas em posts';
COMMENT ON TABLE saved_posts_new IS 'Posts salvos por usuários';
COMMENT ON TABLE comments IS 'Comentários em posts com suporte a aninhamento';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
