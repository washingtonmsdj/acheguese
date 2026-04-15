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
DROP TRIGGER IF EXISTS update_business_premium_links_updated_at ON business_premium_links;
CREATE TRIGGER update_business_premium_links_updated_at
  BEFORE UPDATE ON business_premium_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_premium_links ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler (para resolver links públicos)
DROP POLICY IF EXISTS "Links premium são públicos" ON business_premium_links;
DROP POLICY IF EXISTS "Links premium são públicos" ON business_premium_links;
CREATE POLICY "Links premium são públicos" ON business_premium_links FOR SELECT
  USING (true);

-- Policy: Empresas podem gerenciar seus próprios links
DROP POLICY IF EXISTS "Empresas podem gerenciar seus links" ON business_premium_links;
DROP POLICY IF EXISTS "Empresas podem gerenciar seus links" ON business_premium_links;
CREATE POLICY "Empresas podem gerenciar seus links" ON business_premium_links FOR ALL
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

