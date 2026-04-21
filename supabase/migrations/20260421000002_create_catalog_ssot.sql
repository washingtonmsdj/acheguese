-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Sistema de Catálogo Comercial Versionado SSOT
-- ══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Criar estrutura de catálogo multi-vertical com versionamento
-- Fase: 2 - Banco e Migrações
-- Referência: F1_1_SANEAMENTO_MODELAGEM.md
--
-- Estrutura:
-- 1. commercial_catalog_version (versões do catálogo)
-- 2. catalog_item (base_plan, vertical_package, addon)
-- 3. catalog_eligibility_rule (quem pode contratar)
-- 4. catalog_entitlement_policy (o que cada item dá acesso)
-- 5. catalog_pricing_policy (quanto custa)
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1: Criar enums adicionais
-- ──────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE catalog_item_type AS ENUM (
    'base_plan',
    'vertical_package',
    'addon'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM (
    'free',
    'subscription',
    'transactional',
    'hybrid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE catalog_status AS ENUM (
    'draft',
    'published',
    'deprecated',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM (
    'free',
    'starter',
    'pro',
    'business',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2: Tabela de versões do catálogo
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commercial_catalog_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  version_code TEXT NOT NULL UNIQUE, -- 'v1.0.0', 'v1.1.0'
  version_name TEXT NOT NULL,        -- 'Lançamento Multi-Vertical'
  
  -- Status
  status catalog_status NOT NULL DEFAULT 'draft',
  
  -- Datas
  published_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  changelog TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_version_status ON commercial_catalog_version(status);
CREATE INDEX idx_catalog_version_published ON commercial_catalog_version(published_at) WHERE status = 'published';

COMMENT ON TABLE commercial_catalog_version IS 
  'Versões do catálogo comercial - imutáveis após publicação';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Tabela de itens do catálogo
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Versão
  catalog_version_id UUID NOT NULL REFERENCES commercial_catalog_version(id) ON DELETE CASCADE,
  
  -- Identificação
  item_code TEXT NOT NULL,           -- 'base-pro', 'gastronomy-pro', 'addon-delivery'
  item_name TEXT NOT NULL,           -- 'Plano Pro', 'Gastronomia Pro'
  item_type catalog_item_type NOT NULL,
  
  -- Classificação
  plan_tier plan_tier,               -- Para base_plan e vertical_package
  entity_family entity_family,       -- Quem pode contratar
  vertical vertical,                 -- Vertical específica (null = transversal)
  
  -- Modelo de cobrança
  pricing_model pricing_model NOT NULL,
  
  -- Descrição
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb, -- Lista de features para exibição
  
  -- Dependências
  requires_item_codes TEXT[],        -- Itens obrigatórios (ex: vertical_package requer base_plan)
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: item_code único por versão
  UNIQUE(catalog_version_id, item_code)
);

CREATE INDEX idx_catalog_item_version ON catalog_item(catalog_version_id);
CREATE INDEX idx_catalog_item_type ON catalog_item(item_type);
CREATE INDEX idx_catalog_item_entity_family ON catalog_item(entity_family) WHERE entity_family IS NOT NULL;
CREATE INDEX idx_catalog_item_vertical ON catalog_item(vertical) WHERE vertical IS NOT NULL;
CREATE INDEX idx_catalog_item_tier ON catalog_item(plan_tier) WHERE plan_tier IS NOT NULL;

COMMENT ON TABLE catalog_item IS 
  'Itens do catálogo: base_plan, vertical_package, addon';

COMMENT ON COLUMN catalog_item.item_code IS 
  'Código único do item (ex: base-pro, gastronomy-pro, addon-delivery)';

COMMENT ON COLUMN catalog_item.requires_item_codes IS 
  'Códigos de itens obrigatórios (ex: vertical_package requer base_plan)';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 4: Tabela de regras de elegibilidade
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog_eligibility_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item
  catalog_item_id UUID NOT NULL REFERENCES catalog_item(id) ON DELETE CASCADE,
  
  -- Regras
  allowed_entity_families entity_family[],
  allowed_verticals vertical[],
  allowed_actor_types TEXT[],
  
  -- Restrições
  min_business_age_days INTEGER,
  requires_verification BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eligibility_item ON catalog_eligibility_rule(catalog_item_id);

COMMENT ON TABLE catalog_eligibility_rule IS 
  'Regras de elegibilidade: quem pode contratar cada item';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 5: Tabela de políticas de entitlement
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog_entitlement_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item
  catalog_item_id UUID NOT NULL REFERENCES catalog_item(id) ON DELETE CASCADE,
  
  -- Capacidades booleanas
  can_use_premium_public_page BOOLEAN DEFAULT FALSE,
  can_use_short_premium_link BOOLEAN DEFAULT FALSE,  -- ⭐ Link curto
  can_use_custom_qr_code BOOLEAN DEFAULT FALSE,
  can_use_advanced_menu BOOLEAN DEFAULT FALSE,
  can_receive_internal_orders BOOLEAN DEFAULT FALSE,
  can_use_motoboy_network BOOLEAN DEFAULT FALSE,
  can_use_promotions BOOLEAN DEFAULT FALSE,
  can_use_basic_analytics BOOLEAN DEFAULT FALSE,
  can_use_advanced_analytics BOOLEAN DEFAULT FALSE,
  
  -- Limites/quotas
  max_menu_items INTEGER,
  max_promotions INTEGER,
  max_images INTEGER,
  max_categories INTEGER,
  max_orders_per_day INTEGER,
  
  -- Entitlements adicionais (JSONB para flexibilidade)
  additional_entitlements JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entitlement_item ON catalog_entitlement_policy(catalog_item_id);

COMMENT ON TABLE catalog_entitlement_policy IS 
  'Políticas de entitlement: o que cada item dá acesso';

COMMENT ON COLUMN catalog_entitlement_policy.can_use_short_premium_link IS 
  'Permite uso de link curto /p/:slug';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 6: Tabela de políticas de pricing
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS catalog_pricing_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item
  catalog_item_id UUID NOT NULL REFERENCES catalog_item(id) ON DELETE CASCADE,
  
  -- Preço (em centavos)
  price_cents INTEGER NOT NULL DEFAULT 0,
  setup_fee_cents INTEGER DEFAULT 0,
  
  -- Período
  billing_period TEXT, -- 'monthly', 'yearly', 'one_time'
  
  -- Trial
  trial_period_days INTEGER DEFAULT 0,
  
  -- Stripe
  stripe_price_id TEXT,
  stripe_lookup_key TEXT,
  
  -- Metadata
  currency TEXT DEFAULT 'BRL',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_item ON catalog_pricing_policy(catalog_item_id);
CREATE INDEX idx_pricing_stripe_price ON catalog_pricing_policy(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE INDEX idx_pricing_stripe_lookup ON catalog_pricing_policy(stripe_lookup_key) WHERE stripe_lookup_key IS NOT NULL;

COMMENT ON TABLE catalog_pricing_policy IS 
  'Políticas de pricing: quanto custa cada item';

COMMENT ON COLUMN catalog_pricing_policy.price_cents IS 
  'Preço em centavos (4990 = R$ 49,90)';

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 7: Triggers de updated_at
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_catalog_version_updated_at ON commercial_catalog_version;
CREATE TRIGGER trigger_catalog_version_updated_at
  BEFORE UPDATE ON commercial_catalog_version
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_catalog_item_updated_at ON catalog_item;
CREATE TRIGGER trigger_catalog_item_updated_at
  BEFORE UPDATE ON catalog_item
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_entitlement_policy_updated_at ON catalog_entitlement_policy;
CREATE TRIGGER trigger_entitlement_policy_updated_at
  BEFORE UPDATE ON catalog_entitlement_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_pricing_policy_updated_at ON catalog_pricing_policy;
CREATE TRIGGER trigger_pricing_policy_updated_at
  BEFORE UPDATE ON catalog_pricing_policy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 8: RLS
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE commercial_catalog_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_eligibility_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_entitlement_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_pricing_policy ENABLE ROW LEVEL SECURITY;

-- Leitura pública de catálogo publicado
CREATE POLICY "Anyone can view published catalog" ON commercial_catalog_version
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can view published items" ON catalog_item
  FOR SELECT USING (
    catalog_version_id IN (
      SELECT id FROM commercial_catalog_version WHERE status = 'published'
    )
  );

CREATE POLICY "Anyone can view eligibility rules" ON catalog_eligibility_rule
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view entitlement policies" ON catalog_entitlement_policy
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view pricing policies" ON catalog_pricing_policy
  FOR SELECT USING (true);

-- Admin pode gerenciar (service_role)
CREATE POLICY "Service role can manage catalog" ON commercial_catalog_version
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage items" ON catalog_item
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage eligibility" ON catalog_eligibility_rule
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage entitlements" ON catalog_entitlement_policy
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage pricing" ON catalog_pricing_policy
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
