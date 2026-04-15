
-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATIONS CONSOLIDADAS: Billing + QR Code
-- Aplicadas em: 2026-04-13T11:26:25.724Z
-- ══════════════════════════════════════════════════════════════════════════



-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260413100000_create_business_subscriptions.sql
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criar sistema transversal de assinaturas
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria tabela business_subscriptions para gerenciar assinaturas de TODAS
-- as empresas, independente do vertical (gastronomia, delivery, etc).
--
-- SSOT: Única fonte de verdade para planos e assinaturas.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Criar tabela business_subscriptions
CREATE TABLE IF NOT EXISTS business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES business_data(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'delivery')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '100 years'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_subscriptions_business 
ON business_subscriptions(business_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_plan_tier 
ON business_subscriptions(plan_tier);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_status 
ON business_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_stripe 
ON business_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_business_subscriptions_period_end 
ON business_subscriptions(current_period_end);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_business_subscriptions_updated_at
  BEFORE UPDATE ON business_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Empresas podem ver suas próprias assinaturas
CREATE POLICY "Empresas podem ver suas próprias assinaturas"
  ON business_subscriptions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Apenas sistema pode inserir/atualizar (via service role)
CREATE POLICY "Sistema pode gerenciar assinaturas"
  ON business_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE business_subscriptions IS 
'Assinaturas de empresas (Free, Pro, Delivery) - Sistema transversal';

COMMENT ON COLUMN business_subscriptions.plan_tier IS 
'Plano atual: free, pro, delivery';

COMMENT ON COLUMN business_subscriptions.status IS 
'Status da assinatura: active, canceled, past_due, trialing';

COMMENT ON COLUMN business_subscriptions.cancel_at_period_end IS 
'Se true, assinatura será cancelada no fim do período atual';

COMMENT ON COLUMN business_subscriptions.stripe_subscription_id IS 
'ID da assinatura no Stripe';

COMMENT ON COLUMN business_subscriptions.stripe_customer_id IS 
'ID do cliente no Stripe';



-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260413100001_create_business_premium_links.sql
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criar tabela de links premium
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria tabela business_premium_links para gerenciar links curtos (/p/:slug)
-- disponíveis para planos Pro e Delivery.
--
-- REGRAS:
-- - Link premium não cria outra empresa
-- - Resolve para a mesma business_data
-- - Se plano vencer, redireciona para URL canônica
-- - Não quebra SEO nem duplica página
--
-- ══════════════════════════════════════════════════════════════════════════

-- Criar tabela business_premium_links
CREATE TABLE IF NOT EXISTS business_premium_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES business_data(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT slug_length CHECK (LENGTH(slug) >= 3 AND LENGTH(slug) <= 50)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_business_premium_links_business 
ON business_premium_links(business_id);

CREATE INDEX IF NOT EXISTS idx_business_premium_links_slug 
ON business_premium_links(slug);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_business_premium_links_updated_at
  BEFORE UPDATE ON business_premium_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_premium_links ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler (para resolver links públicos)
CREATE POLICY "Links premium são públicos"
  ON business_premium_links FOR SELECT
  USING (true);

-- Policy: Empresas podem gerenciar seus próprios links
CREATE POLICY "Empresas podem gerenciar seus links"
  ON business_premium_links FOR ALL
  USING (
    business_id IN (
      SELECT id FROM business_data
      WHERE profile_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE business_premium_links IS 
'Links premium curtos (/p/:slug) para empresas com plano Pro ou Delivery';

COMMENT ON COLUMN business_premium_links.slug IS 
'Slug único para o link premium (ex: /p/meu-restaurante)';

COMMENT ON COLUMN business_premium_links.business_id IS 
'Referência para business_data - link resolve para a mesma empresa';

-- ══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO HELPER: Verificar se empresa pode ter link premium
-- ══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION can_use_premium_link(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_tier TEXT;
BEGIN
  -- Buscar plano da empresa
  SELECT plan_tier INTO v_plan_tier
  FROM business_subscriptions
  WHERE business_id = p_business_id;
  
  -- Se não tem assinatura, assume Free
  IF v_plan_tier IS NULL THEN
    v_plan_tier := 'free';
  END IF;
  
  -- Apenas Pro e Delivery podem ter link premium
  RETURN v_plan_tier IN ('pro', 'delivery');
END;
$$;

COMMENT ON FUNCTION can_use_premium_link IS 
'Verifica se empresa pode ter link premium baseado no plano';



-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260413100002_migrate_gastronomy_to_business_subscriptions.sql
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Migrar gastronomy_subscriptions para business_subscriptions
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Migra dados existentes de gastronomy_subscriptions para o novo sistema
-- transversal business_subscriptions.
--
-- IMPORTANTE: Esta migration é idempotente e pode ser executada múltiplas vezes.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Migrar dados existentes
INSERT INTO business_subscriptions (
  business_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  trial_end,
  stripe_subscription_id,
  stripe_customer_id,
  created_at,
  updated_at
)
SELECT 
  business_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  trial_end,
  stripe_subscription_id,
  stripe_customer_id,
  created_at,
  updated_at
FROM gastronomy_subscriptions
WHERE business_id NOT IN (
  SELECT business_id FROM business_subscriptions
)
ON CONFLICT (business_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════

-- Contar registros migrados
DO $$
DECLARE
  v_gastronomy_count INTEGER;
  v_business_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gastronomy_count FROM gastronomy_subscriptions;
  SELECT COUNT(*) INTO v_business_count FROM business_subscriptions;
  
  RAISE NOTICE 'Registros em gastronomy_subscriptions: %', v_gastronomy_count;
  RAISE NOTICE 'Registros em business_subscriptions: %', v_business_count;
  
  IF v_business_count >= v_gastronomy_count THEN
    RAISE NOTICE '✅ Migração concluída com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Alguns registros podem não ter sido migrados';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- NOTA IMPORTANTE
-- ══════════════════════════════════════════════════════════════════════════
--
-- A tabela gastronomy_subscriptions NÃO será deletada automaticamente.
-- Ela será mantida temporariamente para garantir que nada quebre.
--
-- Após validar que tudo está funcionando com business_subscriptions,
-- você pode deletar gastronomy_subscriptions manualmente:
--
-- DROP TABLE IF EXISTS gastronomy_subscriptions CASCADE;
--
-- ══════════════════════════════════════════════════════════════════════════



-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260413110000_create_qr_codes_system.sql
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- QR CODES SYSTEM — Sistema transversal de QR Codes dinâmicos
-- ══════════════════════════════════════════════════════════════════════════
--
-- SSOT: Única fonte de verdade para QR Codes
--
-- Suporta:
-- - Empresas (business)
-- - Gastronomia (gastronomy)
-- - Serviços (service)
-- - Eventos (event)
-- - Pontos Turísticos (tourist_point)
-- - Campanhas (campaign)
-- - Classificados (classified)
-- - Profissionais (professional)
--
-- Arquitetura:
-- - QR dinâmico por padrão (aponta para /q/:token)
-- - Rota /q/:token resolve, registra scan e redireciona
-- - Integrado com sistema de billing/entitlements
-- - Analytics de scans
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────────────────

-- Tipos de entidades que podem ter QR Code
CREATE TYPE qr_entity_type AS ENUM (
  'business',
  'gastronomy',
  'service',
  'event',
  'tourist_point',
  'campaign',
  'classified',
  'professional'
);

-- Variantes de estilo do QR Code
CREATE TYPE qr_style_variant AS ENUM (
  'basic',      -- Free: QR básico preto e branco
  'branded',    -- Pro: Com logo da empresa
  'custom',     -- Pro: Cores personalizadas
  'premium'     -- Delivery: Design premium
);

-- Variantes de destino do QR Code
CREATE TYPE qr_destination_variant AS ENUM (
  'canonical',  -- URL canônica padrão
  'short',      -- Link curto /p/:slug
  'menu',       -- Cardápio direto
  'order',      -- Página de pedido
  'promotion',  -- Promoção específica
  'campaign'    -- Campanha de marketing
);

-- Tipo de dispositivo
CREATE TYPE device_type AS ENUM (
  'mobile',
  'tablet',
  'desktop',
  'unknown'
);

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: qr_codes
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token único para /q/:token
  token TEXT NOT NULL UNIQUE,
  
  -- Entidade associada
  entity_type qr_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  
  -- URLs
  canonical_url TEXT NOT NULL,
  short_url TEXT,
  
  -- Campanha (opcional)
  campaign_id UUID,
  
  -- Dono do QR Code
  owner_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dynamic BOOLEAN NOT NULL DEFAULT true,
  
  -- Estilo e destino
  style_variant qr_style_variant NOT NULL DEFAULT 'basic',
  destination_variant qr_destination_variant NOT NULL DEFAULT 'canonical',
  
  -- Metadata adicional (JSON)
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_qr_codes_token ON qr_codes(token);
CREATE INDEX idx_qr_codes_entity ON qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_owner ON qr_codes(owner_profile_id);
CREATE INDEX idx_qr_codes_active ON qr_codes(is_active) WHERE is_active = true;
CREATE INDEX idx_qr_codes_campaign ON qr_codes(campaign_id) WHERE campaign_id IS NOT NULL;

-- Comentários
COMMENT ON TABLE qr_codes IS 'QR Codes dinâmicos para entidades do sistema';
COMMENT ON COLUMN qr_codes.token IS 'Token único para rota /q/:token';
COMMENT ON COLUMN qr_codes.entity_type IS 'Tipo da entidade (business, gastronomy, etc)';
COMMENT ON COLUMN qr_codes.entity_id IS 'ID da entidade';
COMMENT ON COLUMN qr_codes.canonical_url IS 'URL canônica da entidade';
COMMENT ON COLUMN qr_codes.short_url IS 'URL curta opcional (/p/:slug)';
COMMENT ON COLUMN qr_codes.is_dynamic IS 'Se true, pode mudar destino sem regenerar QR';
COMMENT ON COLUMN qr_codes.style_variant IS 'Variante de estilo (basic, branded, custom, premium)';
COMMENT ON COLUMN qr_codes.destination_variant IS 'Variante de destino (canonical, short, menu, etc)';
COMMENT ON COLUMN qr_codes.metadata IS 'Dados adicionais (logo, cores, etc)';

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: qr_code_scans
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE qr_code_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- QR Code escaneado
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  
  -- Timestamp do scan
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Informações do dispositivo
  device_type device_type NOT NULL DEFAULT 'unknown',
  user_agent TEXT,
  referrer TEXT,
  
  -- Localização aproximada (cidade/estado)
  approximate_location TEXT,
  
  -- Hash do IP (privacidade)
  ip_hash TEXT,
  
  -- URL final para onde foi redirecionado
  resolved_url TEXT NOT NULL
);

-- Índices
CREATE INDEX idx_qr_scans_qr_code ON qr_code_scans(qr_code_id);
CREATE INDEX idx_qr_scans_scanned_at ON qr_code_scans(scanned_at DESC);
CREATE INDEX idx_qr_scans_device ON qr_code_scans(device_type);
CREATE INDEX idx_qr_scans_location ON qr_code_scans(approximate_location) WHERE approximate_location IS NOT NULL;

-- Comentários
COMMENT ON TABLE qr_code_scans IS 'Registro de scans de QR Codes para analytics';
COMMENT ON COLUMN qr_code_scans.qr_code_id IS 'QR Code que foi escaneado';
COMMENT ON COLUMN qr_code_scans.device_type IS 'Tipo de dispositivo (mobile, tablet, desktop)';
COMMENT ON COLUMN qr_code_scans.approximate_location IS 'Localização aproximada (cidade/estado)';
COMMENT ON COLUMN qr_code_scans.ip_hash IS 'Hash do IP para privacidade';
COMMENT ON COLUMN qr_code_scans.resolved_url IS 'URL final para onde foi redirecionado';

-- ──────────────────────────────────────────────────────────────────────────
-- TRIGGERS
-- ──────────────────────────────────────────────────────────────────────────

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_codes_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_scans ENABLE ROW LEVEL SECURITY;

-- QR Codes: Dono pode ver e editar
CREATE POLICY "Users can view their own QR codes"
  ON qr_codes FOR SELECT
  USING (owner_profile_id = auth.uid());

CREATE POLICY "Users can insert their own QR codes"
  ON qr_codes FOR INSERT
  WITH CHECK (owner_profile_id = auth.uid());

CREATE POLICY "Users can update their own QR codes"
  ON qr_codes FOR UPDATE
  USING (owner_profile_id = auth.uid());

CREATE POLICY "Users can delete their own QR codes"
  ON qr_codes FOR DELETE
  USING (owner_profile_id = auth.uid());

-- QR Codes: Qualquer um pode ler QR ativos (para resolução)
CREATE POLICY "Anyone can read active QR codes"
  ON qr_codes FOR SELECT
  USING (is_active = true);

-- Scans: Qualquer um pode inserir (para registro de scan)
CREATE POLICY "Anyone can insert scans"
  ON qr_code_scans FOR INSERT
  WITH CHECK (true);

-- Scans: Dono do QR pode ver scans
CREATE POLICY "QR owners can view scans"
  ON qr_code_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM qr_codes
      WHERE qr_codes.id = qr_code_scans.qr_code_id
      AND qr_codes.owner_profile_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────────

-- Função para buscar analytics de QR Code
CREATE OR REPLACE FUNCTION get_qr_code_analytics(p_qr_code_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_scans', COUNT(*),
    'unique_scans', COUNT(DISTINCT ip_hash),
    'scans_by_device', (
      SELECT json_object_agg(device_type, count)
      FROM (
        SELECT device_type, COUNT(*) as count
        FROM qr_code_scans
        WHERE qr_code_id = p_qr_code_id
        GROUP BY device_type
      ) device_counts
    ),
    'recent_scans', (
      SELECT json_agg(row_to_json(s))
      FROM (
        SELECT *
        FROM qr_code_scans
        WHERE qr_code_id = p_qr_code_id
        ORDER BY scanned_at DESC
        LIMIT 10
      ) s
    )
  )
  INTO v_result
  FROM qr_code_scans
  WHERE qr_code_id = p_qr_code_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_qr_code_analytics IS 'Retorna analytics agregados de um QR Code';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
