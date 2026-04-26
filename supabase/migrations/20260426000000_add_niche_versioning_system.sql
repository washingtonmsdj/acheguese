-- ============================================================================
-- MIGRATION: Niche Versioning and Evolution Protection System
-- ============================================================================
-- Data: 2026-04-26
-- Descrição: Adiciona sistema de versionamento e capabilities para nichos
--            gastronômicos, permitindo evolução sem quebrar registros antigos
--
-- OBJETIVO:
--   - Permitir cadastro de nichos em modo básico hoje
--   - Evoluir nichos depois sem quebrar empresas/cardápios/pedidos existentes
--   - Adicionar novas ferramentas a nichos sem torná-las obrigatórias
--   - Garantir snapshot de pedidos independente de configuração atual
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR CAMPOS DE VERSIONAMENTO EM GASTRONOMY_PROFILES
-- ============================================================================

-- Nicho primário e versão
ALTER TABLE gastronomy_profiles
  ADD COLUMN IF NOT EXISTS primary_niche_key TEXT,
  ADD COLUMN IF NOT EXISTS niche_config_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS support_level TEXT NOT NULL DEFAULT 'basic_enabled'
    CHECK (support_level IN ('full_enabled', 'basic_enabled', 'beta_enabled', 'hidden', 'coming_soon')),
  ADD COLUMN IF NOT EXISTS operational_mode TEXT NOT NULL DEFAULT 'basic_menu'
    CHECK (operational_mode IN (
      'basic_menu', 'menu_variants', 'menu_addons', 'menu_combos',
      'pizzaria_full', 'sushi_full', 'acai_full', 'pastel_full',
      'churrascaria_full', 'bar_full'
    ));

-- Capabilities (JSON array de strings)
ALTER TABLE gastronomy_profiles
  ADD COLUMN IF NOT EXISTS enabled_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Controle de upgrade
ALTER TABLE gastronomy_profiles
  ADD COLUMN IF NOT EXISTS needs_niche_upgrade BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_niche_upgrade_at TIMESTAMPTZ;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_primary_niche_key 
  ON gastronomy_profiles(primary_niche_key);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_support_level 
  ON gastronomy_profiles(support_level);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_needs_upgrade 
  ON gastronomy_profiles(needs_niche_upgrade) 
  WHERE needs_niche_upgrade = true;

-- ============================================================================
-- 2. MIGRAR DADOS EXISTENTES
-- ============================================================================

-- Copiar niche_key para primary_niche_key se existir
UPDATE gastronomy_profiles
SET primary_niche_key = niche_key
WHERE niche_key IS NOT NULL AND primary_niche_key IS NULL;

-- Definir primary_niche_key baseado em cuisine_type para registros sem niche_key
UPDATE gastronomy_profiles
SET primary_niche_key = CASE
  WHEN cuisine_type IN ('pizzaria', 'pizza') THEN 'pizza'
  WHEN cuisine_type IN ('japonesa', 'sushi') THEN 'sushi'
  WHEN cuisine_type IN ('hamburgueria', 'hamburguer') THEN 'hamburguer'
  WHEN cuisine_type = 'brasileira' THEN 'brasileira'
  WHEN cuisine_type = 'arabe' THEN 'arabe'
  WHEN cuisine_type = 'saudavel' THEN 'saudavel'
  WHEN cuisine_type = 'salgados' THEN 'salgados'
  WHEN cuisine_type = 'padaria' THEN 'padaria'
  WHEN cuisine_type IN ('doceria', 'doces') THEN 'doces'
  WHEN cuisine_type IN ('cafeteria', 'cafes') THEN 'cafes'
  WHEN cuisine_type = 'lanchonete' THEN 'lanches'
  WHEN cuisine_type IN ('sorveteria', 'acai') THEN 'acai'
  WHEN cuisine_type = 'pastel' THEN 'pastel'
  WHEN cuisine_type = 'churrascaria' THEN 'churrascaria'
  WHEN cuisine_type IN ('bar', 'pub') THEN 'bares'
  ELSE 'lanches'
END
WHERE primary_niche_key IS NULL;

-- Configurar capabilities para pizzarias existentes
UPDATE gastronomy_profiles
SET 
  support_level = 'full_enabled',
  operational_mode = 'pizzaria_full',
  enabled_capabilities = jsonb_build_array(
    'basic_menu', 'menu_variants', 'menu_addons', 'menu_combos',
    'pizza_sizes', 'pizza_flavors', 'pizza_half_half', 'pizza_multi_flavor',
    'pizza_crusts', 'pizza_crust_stuffing', 'pizza_edge_rules',
    'delivery', 'pickup', 'dine_in', 'payment_cash', 'payment_card', 'payment_pix',
    'order_management', 'custom_instructions', 'photos'
  ),
  missing_capabilities = '[]'::jsonb,
  needs_niche_upgrade = false,
  last_niche_upgrade_at = NOW()
WHERE primary_niche_key = 'pizza'
  AND EXISTS (
    SELECT 1 FROM pizza_niche_configs pnc 
    WHERE pnc.business_id = gastronomy_profiles.business_id
  );

-- Configurar capabilities básicas para outros nichos
UPDATE gastronomy_profiles
SET 
  support_level = 'basic_enabled',
  operational_mode = 'basic_menu',
  enabled_capabilities = jsonb_build_array(
    'basic_menu', 'menu_variants', 'menu_addons', 'menu_combos',
    'delivery', 'pickup', 'payment_cash', 'payment_card', 'payment_pix',
    'order_management', 'custom_instructions', 'photos'
  ),
  missing_capabilities = '[]'::jsonb,
  needs_niche_upgrade = false
WHERE primary_niche_key != 'pizza' OR primary_niche_key IS NULL;

-- ============================================================================
-- 3. TABELA DE HISTÓRICO DE UPGRADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS gastronomy_niche_upgrade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  
  -- Versões
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  
  -- Capabilities adicionadas
  added_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Modo operacional
  from_operational_mode TEXT NOT NULL,
  to_operational_mode TEXT NOT NULL,
  
  -- Metadados do upgrade
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('automatic', 'manual', 'admin')),
  notes TEXT,
  
  -- Timestamps
  upgraded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  upgraded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_niche_upgrade_history_business 
  ON gastronomy_niche_upgrade_history(business_id, upgraded_at DESC);

-- RLS
ALTER TABLE gastronomy_niche_upgrade_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own upgrade history"
  ON gastronomy_niche_upgrade_history FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      JOIN profiles p ON p.id = bd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. FUNÇÃO PARA VERIFICAR SE CAPABILITY ESTÁ HABILITADA
-- ============================================================================

CREATE OR REPLACE FUNCTION has_niche_capability(
  p_business_id UUID,
  p_capability TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_capabilities JSONB;
BEGIN
  SELECT enabled_capabilities INTO v_capabilities
  FROM gastronomy_profiles
  WHERE business_id = p_business_id;
  
  IF v_capabilities IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_capabilities ? p_capability;
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO PARA ADICIONAR CAPABILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION add_niche_capability(
  p_business_id UUID,
  p_capability TEXT,
  p_upgraded_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_capabilities JSONB;
  v_current_version TEXT;
  v_current_mode TEXT;
BEGIN
  -- Buscar configuração atual
  SELECT enabled_capabilities, niche_config_version, operational_mode
  INTO v_current_capabilities, v_current_version, v_current_mode
  FROM gastronomy_profiles
  WHERE business_id = p_business_id;
  
  IF v_current_capabilities IS NULL THEN
    RAISE EXCEPTION 'Perfil gastronômico não encontrado para business_id: %', p_business_id;
  END IF;
  
  -- Verificar se já tem a capability
  IF v_current_capabilities ? p_capability THEN
    RETURN false; -- Já existe
  END IF;
  
  -- Adicionar capability
  UPDATE gastronomy_profiles
  SET 
    enabled_capabilities = enabled_capabilities || jsonb_build_array(p_capability),
    missing_capabilities = missing_capabilities - p_capability,
    last_niche_upgrade_at = NOW()
  WHERE business_id = p_business_id;
  
  -- Registrar no histórico
  INSERT INTO gastronomy_niche_upgrade_history (
    business_id,
    from_version,
    to_version,
    added_capabilities,
    from_operational_mode,
    to_operational_mode,
    upgrade_type,
    upgraded_by
  ) VALUES (
    p_business_id,
    v_current_version,
    v_current_version, -- Mesma versão, apenas adicionando capability
    jsonb_build_array(p_capability),
    v_current_mode,
    v_current_mode,
    CASE WHEN p_upgraded_by IS NULL THEN 'automatic' ELSE 'manual' END,
    p_upgraded_by
  );
  
  RETURN true;
END;
$$;

-- ============================================================================
-- 6. FUNÇÃO PARA MARCAR NECESSIDADE DE UPGRADE
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_niche_needs_upgrade(
  p_niche_key TEXT,
  p_missing_capabilities TEXT[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE gastronomy_profiles
  SET 
    needs_niche_upgrade = true,
    missing_capabilities = to_jsonb(p_missing_capabilities)
  WHERE primary_niche_key = p_niche_key
    AND NOT (enabled_capabilities ?| p_missing_capabilities);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$;

-- ============================================================================
-- 7. VIEW PARA FACILITAR CONSULTAS
-- ============================================================================

CREATE OR REPLACE VIEW gastronomy_profiles_with_niche_info AS
SELECT 
  gp.*,
  jsonb_array_length(gp.enabled_capabilities) as enabled_capabilities_count,
  jsonb_array_length(gp.missing_capabilities) as missing_capabilities_count,
  CASE 
    WHEN gp.needs_niche_upgrade THEN 'upgrade_available'
    WHEN jsonb_array_length(gp.missing_capabilities) > 0 THEN 'incomplete'
    ELSE 'complete'
  END as niche_status
FROM gastronomy_profiles gp;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN gastronomy_profiles.primary_niche_key IS 
  'Chave do nicho primário (pizza, sushi, hamburguer, etc)';
COMMENT ON COLUMN gastronomy_profiles.niche_config_version IS 
  'Versão da configuração do nicho (semver)';
COMMENT ON COLUMN gastronomy_profiles.support_level IS 
  'Nível de suporte: full_enabled, basic_enabled, beta_enabled, hidden, coming_soon';
COMMENT ON COLUMN gastronomy_profiles.operational_mode IS 
  'Modo operacional atual (basic_menu, pizzaria_full, etc)';
COMMENT ON COLUMN gastronomy_profiles.enabled_capabilities IS 
  'Array JSON de capabilities habilitadas para este perfil';
COMMENT ON COLUMN gastronomy_profiles.missing_capabilities IS 
  'Array JSON de capabilities disponíveis mas não configuradas';
COMMENT ON COLUMN gastronomy_profiles.needs_niche_upgrade IS 
  'Flag indicando se há upgrade disponível para este nicho';
COMMENT ON COLUMN gastronomy_profiles.last_niche_upgrade_at IS 
  'Data do último upgrade de nicho realizado';

COMMENT ON TABLE gastronomy_niche_upgrade_history IS 
  'Histórico de upgrades de nicho realizados em perfis gastronômicos';

COMMENT ON FUNCTION has_niche_capability(UUID, TEXT) IS 
  'Verifica se um perfil gastronômico tem uma capability específica habilitada';
COMMENT ON FUNCTION add_niche_capability(UUID, TEXT, UUID) IS 
  'Adiciona uma capability a um perfil gastronômico e registra no histórico';
COMMENT ON FUNCTION mark_niche_needs_upgrade(TEXT, TEXT[]) IS 
  'Marca perfis de um nicho como necessitando upgrade quando novas capabilities são adicionadas';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
