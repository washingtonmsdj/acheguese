-- ============================================================================
-- BASE SCHEMA - VitrineBairro
-- Alinhado com todos os services (SSOT)
-- update_updated_at_column() já criada na migration 20260324000001
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- user_roles
-- ============================================================================
CREATE TABLE user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_active  ON user_roles(role) WHERE is_active = true;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage roles"   ON user_roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin' AND ur.is_active = true));
CREATE POLICY "Users read own roles"  ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- profiles  (colunas alinhadas com ProfileService)
-- ============================================================================
CREATE TABLE profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- profile_type é o campo canônico (ProfileService usa profile_type)
  profile_type     TEXT NOT NULL DEFAULT 'personal'
    CHECK (profile_type IN ('personal', 'business', 'professional', 'driver')),
  name             TEXT NOT NULL,
  display_name     TEXT,
  username         TEXT UNIQUE,
  bio              TEXT,
  avatar_url       TEXT,
  -- localização legada (mantida para compatibilidade)
  neighborhood     TEXT,
  city             TEXT,
  -- localização canônica (SSOT territorial)
  location_id      UUID,  -- FK adicionada após locations
  -- contato
  phone            TEXT,
  whatsapp         TEXT,
  -- status
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_verified      BOOLEAN NOT NULL DEFAULT false,
  verified_at      TIMESTAMPTZ,
  is_suspended     BOOLEAN NOT NULL DEFAULT false,
  suspended        BOOLEAN NOT NULL DEFAULT false,  -- alias legado
  suspended_at     TIMESTAMPTZ,
  suspension_reason TEXT,
  suspended_until  TIMESTAMPTZ,
  -- mobilidade (temporário — ver ProfileService.getActiveRideId)
  active_ride_id   UUID,
  -- gamificação
  reputation       INTEGER NOT NULL DEFAULT 0,
  pontos           INTEGER NOT NULL DEFAULT 0,
  -- campos legados de mobilidade
  telefone         TEXT,
  street           TEXT,
  -- auditoria
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_user_id      ON profiles(user_id);
CREATE INDEX idx_profiles_profile_type ON profiles(profile_type);
CREATE INDEX idx_profiles_username     ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_is_active    ON profiles(is_active) WHERE is_active = true;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active profiles viewable" ON profiles FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Users manage own profiles" ON profiles FOR ALL TO authenticated USING (user_id = auth.uid());

-- profile_members (BusinessService, ProfessionalService)
CREATE TABLE profile_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_profile_member UNIQUE (profile_id, user_id)
);
CREATE INDEX idx_profile_members_profile_id ON profile_members(profile_id);
CREATE INDEX idx_profile_members_user_id    ON profile_members(user_id);
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members viewable by authenticated" ON profile_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage members" ON profile_members FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- profile_favorites (ProfileService.getUserFavoritesCount)
CREATE TABLE profile_favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_profile_favorite UNIQUE (user_id, profile_id)
);
CREATE INDEX idx_profile_favorites_user_id    ON profile_favorites(user_id);
CREATE INDEX idx_profile_favorites_profile_id ON profile_favorites(profile_id);
ALTER TABLE profile_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile favorites" ON profile_favorites FOR ALL TO authenticated USING (user_id = auth.uid());

-- banned_users (ModerationService)
CREATE TABLE banned_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason     TEXT,
  banned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_banned_user UNIQUE (user_id)
);
CREATE INDEX idx_banned_users_user_id ON banned_users(user_id);
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage banned users" ON banned_users FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator') AND is_active = true));

-- ============================================================================
-- user_subscriptions  (SubscriptionService)
-- ============================================================================
CREATE TABLE user_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type    TEXT NOT NULL CHECK (plan_type IN ('free','basic','premium','enterprise')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','pending')),
  active       BOOLEAN NOT NULL DEFAULT true,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active  ON user_subscriptions(user_id, active) WHERE active = true;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON user_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- verification  (VerificationService)
-- ============================================================================
CREATE TABLE verification (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('identity','business','professional')),
  verified          BOOLEAN NOT NULL DEFAULT false,
  rejection_reason  TEXT,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_verification_profile_id ON verification(profile_id);
CREATE INDEX idx_verification_verified   ON verification(verified);
ALTER TABLE verification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own verification" ON verification FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage verifications" ON verification FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator') AND is_active = true));

-- ============================================================================
-- posts  (PostService — colunas exatas do service)
-- ============================================================================
CREATE TABLE posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- autor_id → auth.users (legado, mantido por compatibilidade)
  autor_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- author_profile_id → profiles (canônico)
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- conteúdo
  texto             TEXT,   -- campo legado
  content           TEXT,   -- campo canônico
  type              TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text','image','video','link','poll','alerta')),
  image_url         TEXT,
  video_url         TEXT,
  images            JSONB DEFAULT '[]',
  -- localização legada
  city              TEXT,
  neighborhood      TEXT,
  street            TEXT,
  -- localização canônica
  location_id       UUID,
  -- contadores
  likes_count       INTEGER NOT NULL DEFAULT 0,
  comments_count    INTEGER NOT NULL DEFAULT 0,
  -- community posts extras
  tags              JSONB DEFAULT '[]',
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_published      BOOLEAN NOT NULL DEFAULT true,
  -- auditoria
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_posts_author_profile_id ON posts(author_profile_id);
CREATE INDEX idx_posts_created_at        ON posts(created_at DESC);
CREATE INDEX idx_posts_location_id       ON posts(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_posts_type              ON posts(type);
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts viewable" ON posts FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Authors manage own posts" ON posts FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- community_posts  (PostService.createCommunityPost)
CREATE TABLE community_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                TEXT NOT NULL DEFAULT 'post',
  content             TEXT,
  tags                JSONB DEFAULT '[]',
  location_id         UUID,
  confirmations_count INTEGER NOT NULL DEFAULT 0,
  is_verified         BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_community_posts_author_id  ON community_posts(author_profile_id);
CREATE INDEX idx_community_posts_type       ON community_posts(type);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Community posts viewable" ON community_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authors manage own community posts" ON community_posts FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- community_polls  (PostService.createPoll)
CREATE TABLE community_polls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_community_polls_post_id ON community_polls(post_id);
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls viewable" ON community_polls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authors manage polls" ON community_polls FOR ALL TO authenticated
  USING (post_id IN (
    SELECT id FROM community_posts WHERE author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

-- community_poll_options  (PostService.createPoll)
CREATE TABLE community_poll_options (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  text     TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  votes    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_community_poll_options_poll_id ON community_poll_options(poll_id);
ALTER TABLE community_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options viewable" ON community_poll_options FOR SELECT TO anon, authenticated USING (true);

-- post_likes_new  (SocialInteractionsService)
CREATE TABLE post_likes_new (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  liker_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE (post_id, liker_profile_id)
);
CREATE INDEX idx_post_likes_post_id    ON post_likes_new(post_id);
CREATE INDEX idx_post_likes_profile_id ON post_likes_new(liker_profile_id);
ALTER TABLE post_likes_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable" ON post_likes_new FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own likes" ON post_likes_new FOR ALL TO authenticated
  USING (liker_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- saved_posts_new  (SocialInteractionsService)
CREATE TABLE saved_posts_new (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_saved_post UNIQUE (post_id, saver_profile_id)
);
CREATE INDEX idx_saved_posts_post_id    ON saved_posts_new(post_id);
CREATE INDEX idx_saved_posts_profile_id ON saved_posts_new(saver_profile_id);
ALTER TABLE saved_posts_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved posts" ON saved_posts_new FOR ALL TO authenticated
  USING (saver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- comments  (CommentService — colunas exatas)
CREATE TABLE comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  parent_id         UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count       INTEGER NOT NULL DEFAULT 0,
  replies_count     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_comments_post_id    ON comments(post_id);
CREATE INDEX idx_comments_profile_id ON comments(author_profile_id);
CREATE INDEX idx_comments_parent_id  ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable" ON comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authors manage own comments" ON comments FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- business_data  (BusinessService — colunas exatas do mapper)
-- ============================================================================
CREATE TABLE business_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name  TEXT NOT NULL,
  description    TEXT,
  category       TEXT,
  subcategory    TEXT,
  address        TEXT,
  latitude       DECIMAL(10,7),
  longitude      DECIMAL(10,7),
  email          TEXT,
  website        TEXT,
  instagram      TEXT,
  facebook       TEXT,
  opening_hours  JSONB,
  payment_methods JSONB DEFAULT '[]',
  specialties    JSONB DEFAULT '[]',
  facilities     JSONB DEFAULT '[]',
  is_premium     BOOLEAN NOT NULL DEFAULT false,
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','pending','suspended','deleted')),
  rating         DECIMAL(3,2) DEFAULT 0,
  total_reviews  INTEGER NOT NULL DEFAULT 0,
  total_products INTEGER NOT NULL DEFAULT 0,
  slug           TEXT UNIQUE,
  metadata       JSONB NOT NULL DEFAULT '{}',
  location_id    UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_business_data_profile_id  ON business_data(profile_id);
CREATE INDEX idx_business_data_status      ON business_data(status);
CREATE INDEX idx_business_data_category    ON business_data(category);
CREATE INDEX idx_business_data_is_premium  ON business_data(is_premium) WHERE is_premium = true;
CREATE INDEX idx_business_data_location_id ON business_data(location_id) WHERE location_id IS NOT NULL;
CREATE TRIGGER update_business_data_updated_at BEFORE UPDATE ON business_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active businesses viewable" ON business_data FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners manage own business" ON business_data FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- business_stats  (BusinessService.createBusiness)
CREATE TABLE business_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  views_count     INTEGER NOT NULL DEFAULT 0,
  favorites_count INTEGER NOT NULL DEFAULT 0,
  shares_count    INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE business_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business stats viewable" ON business_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage own stats" ON business_stats FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- business_products  (BusinessService.getProducts / createProduct)
CREATE TABLE business_products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  descricao         TEXT,
  preco             DECIMAL(10,2),
  preco_promocional DECIMAL(10,2),
  imagem            TEXT,
  categoria         TEXT,
  estoque           INTEGER DEFAULT 0,
  ativo             BOOLEAN NOT NULL DEFAULT true,
  destaque          BOOLEAN NOT NULL DEFAULT false,
  promocao          BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_business_products_profile_id ON business_products(profile_id);
CREATE TRIGGER update_business_products_updated_at BEFORE UPDATE ON business_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable" ON business_products FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "Owners manage own products" ON business_products FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- business_services  (BusinessService.getServices)
CREATE TABLE business_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       DECIMAL(10,2),
  duration    INTEGER,  -- minutos
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_business_services_business_id ON business_services(business_id);
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services viewable" ON business_services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Owners manage own services" ON business_services FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- business_views  (BusinessService.getBusinessMetrics)
CREATE TABLE business_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_business_views_business_id ON business_views(business_id);
CREATE INDEX idx_business_views_viewed_at   ON business_views(viewed_at DESC);
ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business views insertable" ON business_views FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners view own business views" ON business_views FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- business_favorites  (FavoritesService)
CREATE TABLE business_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_business_favorite UNIQUE (business_id, profile_id)
);
CREATE INDEX idx_business_favorites_business_id ON business_favorites(business_id);
CREATE INDEX idx_business_favorites_profile_id  ON business_favorites(profile_id);
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own business favorites" ON business_favorites FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- professional_data  (ProfessionalService — colunas exatas do mapper)
-- ============================================================================
CREATE TABLE professional_data (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_name    TEXT,
  service_category     TEXT,
  service_subcategory  TEXT,
  description          TEXT,
  certifications       JSONB DEFAULT '[]',
  experience_years     INTEGER,
  education            TEXT,
  price_range          TEXT,
  service_areas        JSONB DEFAULT '[]',
  service_radius_km    DECIMAL(5,2),
  available_hours      JSONB,
  whatsapp             TEXT,
  email                TEXT,
  is_accepting_clients BOOLEAN NOT NULL DEFAULT true,
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  verified_at          TIMESTAMPTZ,
  rating               DECIMAL(3,2) DEFAULT 0,
  metadata             JSONB NOT NULL DEFAULT '{}',
  location_id          UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_professional_data_profile_id  ON professional_data(profile_id);
CREATE INDEX idx_professional_data_category    ON professional_data(service_category);
CREATE INDEX idx_professional_data_accepting   ON professional_data(is_accepting_clients) WHERE is_accepting_clients = true;
CREATE INDEX idx_professional_data_location_id ON professional_data(location_id) WHERE location_id IS NOT NULL;
CREATE TRIGGER update_professional_data_updated_at BEFORE UPDATE ON professional_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE professional_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professionals viewable" ON professional_data FOR SELECT TO anon, authenticated
  USING (is_accepting_clients = true);
CREATE POLICY "Owners manage own professional data" ON professional_data FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- professional_stats  (ProfessionalService.createProfessional)
CREATE TABLE professional_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  views_count           INTEGER NOT NULL DEFAULT 0,
  contacts_count        INTEGER NOT NULL DEFAULT 0,
  favorites_count       INTEGER NOT NULL DEFAULT 0,
  shares_count          INTEGER NOT NULL DEFAULT 0,
  jobs_completed        INTEGER NOT NULL DEFAULT 0,
  response_rate         DECIMAL(5,2) DEFAULT 0,
  average_response_time INTEGER DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE professional_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professional stats viewable" ON professional_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage own professional stats" ON professional_stats FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- professional_favorites  (ProfessionalService.toggleFavorite)
CREATE TABLE professional_favorites (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_professional_favorite UNIQUE (professional_id, profile_id)
);
CREATE INDEX idx_professional_favorites_professional_id ON professional_favorites(professional_id);
CREATE INDEX idx_professional_favorites_profile_id      ON professional_favorites(profile_id);
ALTER TABLE professional_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own professional favorites" ON professional_favorites FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- professional_jobs  (ProfessionalService)
CREATE TABLE professional_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','cancelled')),
  price         DECIMAL(10,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_professional_jobs_profile_id ON professional_jobs(profile_id);
CREATE TRIGGER update_professional_jobs_updated_at BEFORE UPDATE ON professional_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE professional_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Job participants can view" ON professional_jobs FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Professionals manage own jobs" ON professional_jobs FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- reviews  (MetricsService, ReviewsService)
CREATE TABLE reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating                INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment               TEXT,
  review_type           TEXT NOT NULL DEFAULT 'business'
    CHECK (review_type IN ('business','professional','service')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review UNIQUE (reviewed_profile_id, reviewer_profile_id, review_type)
);
CREATE INDEX idx_reviews_reviewed_profile_id ON reviews(reviewed_profile_id);
CREATE INDEX idx_reviews_reviewer_profile_id ON reviews(reviewer_profile_id);
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable" ON reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users manage own reviews" ON reviews FOR ALL TO authenticated
  USING (reviewer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- classifieds  (ClassifiedService — colunas exatas do insert)
-- ============================================================================
CREATE TABLE classifieds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2),
  category     TEXT,
  condition    TEXT,
  photos       JSONB DEFAULT '[]',
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  neighborhood TEXT,
  location_id  UUID,
  status       TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','sold','expired','deleted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_classifieds_profile_id  ON classifieds(profile_id);
CREATE INDEX idx_classifieds_status      ON classifieds(status);
CREATE INDEX idx_classifieds_category    ON classifieds(category);
CREATE INDEX idx_classifieds_location_id ON classifieds(location_id) WHERE location_id IS NOT NULL;
CREATE TRIGGER update_classifieds_updated_at BEFORE UPDATE ON classifieds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active classifieds viewable" ON classifieds FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners manage own classifieds" ON classifieds FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- classified_likes  (ClassifiedService.toggleLike)
CREATE TABLE classified_likes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_classified_like UNIQUE (classified_id, user_id)
);
CREATE INDEX idx_classified_likes_classified_id ON classified_likes(classified_id);
CREATE INDEX idx_classified_likes_user_id       ON classified_likes(user_id);
ALTER TABLE classified_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own classified likes" ON classified_likes FOR ALL TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- events  (EventsService — colunas exatas)
-- ============================================================================
CREATE TABLE events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  date                 TIMESTAMPTZ NOT NULL,
  end_date             TIMESTAMPTZ,
  location             TEXT,
  location_id          UUID,
  category             TEXT,
  image_url            TEXT,
  max_participants     INTEGER,
  current_participants INTEGER NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  is_free              BOOLEAN NOT NULL DEFAULT true,
  price                DECIMAL(10,2),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_organizer_id ON events(organizer_profile_id);
CREATE INDEX idx_events_date         ON events(date DESC);
CREATE INDEX idx_events_status       ON events(status);
CREATE INDEX idx_events_location_id  ON events(location_id) WHERE location_id IS NOT NULL;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable" ON events FOR SELECT TO anon, authenticated
  USING (status IN ('upcoming','ongoing'));
CREATE POLICY "Organizers manage own events" ON events FOR ALL TO authenticated
  USING (organizer_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- event_participants  (EventsService.joinEvent)
CREATE TABLE event_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event_participant UNIQUE (event_id, profile_id)
);
CREATE INDEX idx_event_participants_event_id   ON event_participants(event_id);
CREATE INDEX idx_event_participants_profile_id ON event_participants(profile_id);
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants viewable" ON event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own participation" ON event_participants FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- ============================================================================
-- notifications  (NotificationService)
-- ============================================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB DEFAULT '{}',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = false;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- social  (SocialInteractionsService)
-- ============================================================================
CREATE TABLE user_follows (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);
CREATE INDEX idx_user_follows_follower  ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable" ON user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own follows" ON user_follows FOR ALL TO authenticated
  USING (follower_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- groups  (SocialInteractionsService)
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  type        TEXT NOT NULL DEFAULT 'community'
    CHECK (type IN ('community','neighborhood','interest')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active groups viewable" ON groups FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Authenticated users create groups" ON groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Creators update own groups" ON groups FOR UPDATE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Creators delete own groups" ON groups FOR DELETE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- group_members_new  (SocialInteractionsService)
CREATE TABLE group_members_new (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_group_member UNIQUE (group_id, member_profile_id)
);
CREATE INDEX idx_group_members_group_id   ON group_members_new(group_id);
CREATE INDEX idx_group_members_profile_id ON group_members_new(member_profile_id);
ALTER TABLE group_members_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members viewable" ON group_members_new FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own memberships" ON group_members_new FOR ALL TO authenticated
  USING (member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- group_messages_new  (SocialInteractionsService)
CREATE TABLE group_messages_new (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_group_messages_group_id ON group_messages_new(group_id);
ALTER TABLE group_messages_new ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members view messages" ON group_messages_new FOR SELECT TO authenticated
  USING (group_id IN (
    SELECT group_id FROM group_members_new
    WHERE member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));
CREATE POLICY "Group members send messages" ON group_messages_new FOR INSERT TO authenticated
  WITH CHECK (
    sender_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    AND group_id IN (
      SELECT group_id FROM group_members_new
      WHERE member_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- community_issues  (CommunityIssueService)
-- ============================================================================
CREATE TABLE community_issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  location_id UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_community_issues_updated_at BEFORE UPDATE ON community_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE community_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Issues viewable" ON community_issues FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users manage own issues" ON community_issues FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE community_issue_supports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_issue_support UNIQUE (issue_id, profile_id)
);
ALTER TABLE community_issue_supports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supports viewable" ON community_issue_supports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own supports" ON community_issue_supports FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE community_issue_reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE community_issue_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON community_issue_reports FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE community_issue_audit (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES community_issues(id) ON DELETE CASCADE,
  actor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE community_issue_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit" ON community_issue_audit FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator') AND is_active = true));
CREATE POLICY "System inserts audit" ON community_issue_audit FOR INSERT TO authenticated WITH CHECK (true);

-- community_alerts  (CommunityAlertService — via RPC create_community_alert)
CREATE TABLE community_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL
    CHECK (type IN ('security','infrastructure','health','environment','other')),
  status      TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  location_id UUID,
  edit_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_community_alerts_updated_at BEFORE UPDATE ON community_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alerts viewable" ON community_alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users manage own alerts" ON community_alerts FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- VIEW pública de alertas (CommunityAlertService usa community_alerts_public)
CREATE VIEW community_alerts_public AS
SELECT id, title, description, type, status, location_id, edit_count, created_at, updated_at
FROM community_alerts;

-- ============================================================================
-- banners  (BannerService)
-- ============================================================================
CREATE TABLE banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  position   TEXT DEFAULT 'top',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  starts_at  TIMESTAMPTZ,
  ends_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_banners_is_active ON banners(is_active) WHERE is_active = true;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active banners viewable" ON banners FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage banners" ON banners FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================================================
-- territory_ai_content  (TerritorialService)
-- ============================================================================
CREATE TABLE territory_ai_content (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_slug     TEXT NOT NULL UNIQUE,
  territory_name     TEXT NOT NULL,
  description        TEXT,
  history            TEXT,
  demographics       JSONB DEFAULT '{}',
  events             JSONB DEFAULT '[]',
  ai_generated_at    TIMESTAMPTZ,
  manually_edited_at TIMESTAMPTZ,
  is_manual_override BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_territory_ai_content_slug     ON territory_ai_content(territory_slug);
CREATE INDEX idx_territory_ai_content_override ON territory_ai_content(is_manual_override) WHERE is_manual_override = true;
ALTER TABLE territory_ai_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads territory content" ON territory_ai_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert territory content" ON territory_ai_content FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Admins update territory content" ON territory_ai_content FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- ============================================================================
-- MOBILIDADE  (MobilityService, RideService)
-- ============================================================================
CREATE TABLE driver_data (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  is_online             BOOLEAN NOT NULL DEFAULT false,
  is_verified           BOOLEAN NOT NULL DEFAULT false,
  subscription_active   BOOLEAN NOT NULL DEFAULT false,
  vehicle               JSONB NOT NULL DEFAULT '{}',
  rating                DECIMAL(3,2) DEFAULT 5.0,
  total_rides           INTEGER NOT NULL DEFAULT 0,
  total_rides_completed INTEGER NOT NULL DEFAULT 0,
  total_rides_cancelled INTEGER NOT NULL DEFAULT 0,
  acceptance_rate       DECIMAL(5,2) DEFAULT 0,
  cancellation_rate     DECIMAL(5,2) DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_driver_data_updated_at BEFORE UPDATE ON driver_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE driver_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver data viewable" ON driver_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers manage own data" ON driver_data FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE driver_routes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin            JSONB NOT NULL,
  destination       JSONB NOT NULL,
  waypoints         JSONB DEFAULT '[]',
  departure_time    TIMESTAMPTZ NOT NULL,
  available_seats   INTEGER NOT NULL DEFAULT 1,
  price_per_seat    DECIMAL(10,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','full','cancelled','completed')),
  recurrence        TEXT DEFAULT 'once'
    CHECK (recurrence IN ('once','daily','weekdays','weekly')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_driver_routes_driver_id   ON driver_routes(driver_profile_id);
CREATE INDEX idx_driver_routes_departure   ON driver_routes(departure_time DESC);
CREATE INDEX idx_driver_routes_status      ON driver_routes(status);
CREATE TRIGGER update_driver_routes_updated_at BEFORE UPDATE ON driver_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE driver_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active routes viewable" ON driver_routes FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Drivers manage own routes" ON driver_routes FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE ride_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_profile_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  route_id              UUID REFERENCES driver_routes(id) ON DELETE SET NULL,
  origin                JSONB,
  destination           JSONB,
  pickup_location       JSONB NOT NULL,
  dropoff_location      JSONB NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  suggested_price       DECIMAL(10,2),
  final_price           DECIMAL(10,2),
  available_seats       INTEGER DEFAULT 1,
  share_token           TEXT UNIQUE,
  share_view_count      INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ride_requests_passenger_id ON ride_requests(passenger_profile_id);
CREATE INDEX idx_ride_requests_driver_id    ON ride_requests(driver_profile_id);
CREATE INDEX idx_ride_requests_status       ON ride_requests(status);
CREATE INDEX idx_ride_requests_share_token  ON ride_requests(share_token) WHERE share_token IS NOT NULL;
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ride participants view" ON ride_requests FOR SELECT TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Passengers create rides" ON ride_requests FOR INSERT TO authenticated
  WITH CHECK (passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Participants update rides" ON ride_requests FOR UPDATE TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE TABLE route_reservations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id             UUID NOT NULL REFERENCES driver_routes(id) ON DELETE CASCADE,
  passenger_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seats                INTEGER NOT NULL DEFAULT 1,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_route_reservations_route_id     ON route_reservations(route_id);
CREATE INDEX idx_route_reservations_passenger_id ON route_reservations(passenger_profile_id);
CREATE TRIGGER update_route_reservations_updated_at BEFORE UPDATE ON route_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
ALTER TABLE route_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reservation participants view" ON route_reservations FOR SELECT TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR route_id IN (
      SELECT id FROM driver_routes WHERE driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
CREATE POLICY "Passengers manage own reservations" ON route_reservations FOR ALL TO authenticated
  USING (passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE route_trips (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id   UUID NOT NULL REFERENCES driver_routes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at   TIMESTAMPTZ,
  status     TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','cancelled'))
);
ALTER TABLE route_trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trips viewable" ON route_trips FOR SELECT TO authenticated USING (true);

CREATE TABLE driver_locations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat               DECIMAL(10,7) NOT NULL,
  lng               DECIMAL(10,7) NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_profile_id);
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver locations viewable" ON driver_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers manage own location" ON driver_locations FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE TABLE emergency_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id    UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view emergency alerts" ON emergency_alerts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Authenticated insert emergency alerts" ON emergency_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- VIEW consolidada de motoristas (MobilityService usa driver_complete_profile)
CREATE VIEW driver_complete_profile AS
SELECT
  dd.profile_id,
  p.name          AS display_name,
  p.avatar_url,
  dd.rating       AS avg_rating,
  dd.total_rides,
  dd.is_online,
  dd.vehicle
FROM driver_data dd
JOIN profiles p ON p.id = dd.profile_id;

-- ============================================================================
-- RPCs  (alinhadas com todos os services)
-- ============================================================================

-- get_active_profile  (ProfileService, SessionService)
CREATE OR REPLACE FUNCTION get_active_profile(p_user_id UUID DEFAULT NULL)
RETURNS SETOF profiles AS $$
DECLARE v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  RETURN QUERY
    SELECT * FROM profiles
    WHERE user_id = v_user_id AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- switch_active_profile  (ProfileService, SessionService)
-- Recebe p_user_id + p_profile_id (conforme chamada no ProfileService)
CREATE OR REPLACE FUNCTION switch_active_profile(p_user_id UUID, p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = p_profile_id AND user_id = p_user_id AND is_active = true
  ) INTO v_exists;
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- create_community_alert  (CommunityAlertService)
CREATE OR REPLACE FUNCTION create_community_alert(
  p_title       TEXT,
  p_description TEXT,
  p_type        TEXT,
  p_location_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  v_alert_id   UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No active profile found';
  END IF;
  INSERT INTO community_alerts (profile_id, title, description, type, location_id)
  VALUES (v_profile_id, p_title, p_description, p_type, p_location_id)
  RETURNING id INTO v_alert_id;
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_alert_edit_count  (CommunityAlertService)
CREATE OR REPLACE FUNCTION increment_alert_edit_count(p_alert_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_alerts SET edit_count = edit_count + 1 WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reserve_route  (MobilityService)
CREATE OR REPLACE FUNCTION reserve_route(p_route_id UUID, p_seats INTEGER DEFAULT 1)
RETURNS UUID AS $$
DECLARE
  v_profile_id     UUID;
  v_reservation_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM profiles
  WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
  INSERT INTO route_reservations (route_id, passenger_profile_id, seats)
  VALUES (p_route_id, v_profile_id, p_seats)
  RETURNING id INTO v_reservation_id;
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_driver_weekly_earnings  (MobilityService — parâmetros: p_driver_id, p_weeks)
CREATE OR REPLACE FUNCTION get_driver_weekly_earnings(p_driver_id UUID, p_weeks INTEGER DEFAULT 1)
RETURNS DECIMAL AS $$
DECLARE v_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(final_price), 0) INTO v_total
  FROM ride_requests
  WHERE driver_profile_id = p_driver_id
    AND status = 'completed'
    AND updated_at >= NOW() - (p_weeks || ' weeks')::INTERVAL;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_event_participants  (EventsService)
CREATE OR REPLACE FUNCTION increment_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE events SET current_participants = current_participants + 1 WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- decrement_event_participants  (EventsService)
CREATE OR REPLACE FUNCTION decrement_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE events
  SET current_participants = GREATEST(0, current_participants - 1)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_business_views  (BusinessService)
CREATE OR REPLACE FUNCTION increment_business_views(business_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE business_stats SET views_count = views_count + 1 WHERE profile_id = business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_professional_views  (ProfessionalService)
CREATE OR REPLACE FUNCTION increment_professional_views(professional_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE professional_stats SET views_count = views_count + 1 WHERE profile_id = professional_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- check_suspension_expiry  (AuthService)
CREATE OR REPLACE FUNCTION check_suspension_expiry()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET is_suspended = false, suspended = false, suspended_until = NULL
  WHERE is_suspended = true
    AND suspended_until IS NOT NULL
    AND suspended_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
