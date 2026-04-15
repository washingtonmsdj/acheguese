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
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Variantes de estilo do QR Code
DO $$ BEGIN
  CREATE TYPE qr_style_variant AS ENUM (
  'basic',      -- Free: QR básico preto e branco
  'branded',    -- Pro: Com logo da empresa
  'custom',     -- Pro: Cores personalizadas
  'premium'     -- Delivery: Design premium
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Variantes de destino do QR Code
DO $$ BEGIN
  CREATE TYPE qr_destination_variant AS ENUM (
  'canonical',  -- URL canônica padrão
  'short',      -- Link curto /p/:slug
  'menu',       -- Cardápio direto
  'order',      -- Página de pedido
  'promotion',  -- Promoção específica
  'campaign'    -- Campanha de marketing
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tipo de dispositivo
DO $$ BEGIN
  CREATE TYPE device_type AS ENUM (
  'mobile',
  'tablet',
  'desktop',
  'unknown'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- TABLE: qr_codes
-- ──────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS qr_codes (
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
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_qr_codes_entity ON qr_codes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_owner ON qr_codes(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_active ON qr_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign ON qr_codes(campaign_id) WHERE campaign_id IS NOT NULL;

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

CREATE TABLE IF NOT EXISTS qr_code_scans (
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
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code ON qr_code_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_code_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_device ON qr_code_scans(device_type);
CREATE INDEX IF NOT EXISTS idx_qr_scans_location ON qr_code_scans(approximate_location) WHERE approximate_location IS NOT NULL;

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

DROP TRIGGER IF EXISTS trigger_update_qr_codes_updated_at ON qr_codes;
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
DROP POLICY IF EXISTS "Users can view their own QR codes" ON qr_codes;
CREATE POLICY "Users can view their own QR codes" ON qr_codes FOR SELECT
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own QR codes" ON qr_codes;
CREATE POLICY "Users can insert their own QR codes" ON qr_codes FOR INSERT
  WITH CHECK (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own QR codes" ON qr_codes;
CREATE POLICY "Users can update their own QR codes" ON qr_codes FOR UPDATE
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own QR codes" ON qr_codes;
CREATE POLICY "Users can delete their own QR codes" ON qr_codes FOR DELETE
  USING (owner_profile_id = auth.uid());

-- QR Codes: Qualquer um pode ler QR ativos (para resolução)
DROP POLICY IF EXISTS "Anyone can read active QR codes" ON qr_codes;
CREATE POLICY "Anyone can read active QR codes" ON qr_codes FOR SELECT
  USING (is_active = true);

-- Scans: Qualquer um pode inserir (para registro de scan)
DROP POLICY IF EXISTS "Anyone can insert scans" ON qr_code_scans;
CREATE POLICY "Anyone can insert scans" ON qr_code_scans FOR INSERT
  WITH CHECK (true);

-- Scans: Dono do QR pode ver scans
DROP POLICY IF EXISTS "QR owners can view scans" ON qr_code_scans;
CREATE POLICY "QR owners can view scans" ON qr_code_scans FOR SELECT
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
