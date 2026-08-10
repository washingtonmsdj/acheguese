-- ══════════════════════════════════════════════════════════════════════════
-- VAGAS — SSOT
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: Centraliza vagas de emprego no banco de dados
--            Elimina MOCK_VAGAS do runtime
-- 
-- Autor: Sistema de Auditoria SSOT
-- Data: 2026-04-16
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CRIAR ENUMS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TYPE vaga_status AS ENUM ('ativa', 'pausada', 'encerrada', 'preenchida');

CREATE TYPE vaga_contrato AS ENUM ('CLT', 'PJ', 'Temporário', 'Estágio', 'Freelance');

CREATE TYPE vaga_modalidade AS ENUM ('Presencial', 'Remoto', 'Híbrido');

CREATE TYPE vaga_nivel AS ENUM ('Júnior', 'Pleno', 'Sênior', 'Especialista');

CREATE TYPE vaga_urgencia AS ENUM ('normal', 'urgente');

-- ─────────────────────────────────────────────────────────────────────────
-- 2. CRIAR TABELA
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  titulo TEXT NOT NULL,
  empresa TEXT NOT NULL,
  descricao TEXT NOT NULL,
  
  -- Localização (SSOT territorial)
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  
  -- Classificação
  contrato vaga_contrato NOT NULL,
  modalidade vaga_modalidade NOT NULL,
  nivel vaga_nivel NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Remuneração
  salario_texto TEXT, -- "R$ 2.500 + comissão", "A combinar", etc
  salario_min INTEGER, -- em centavos
  salario_max INTEGER, -- em centavos
  
  -- Benefícios
  beneficios TEXT[] NOT NULL DEFAULT '{}',
  
  -- Contato
  contato_email TEXT,
  contato_whatsapp TEXT,
  contato_url TEXT,
  
  -- Controle
  status vaga_status NOT NULL DEFAULT 'ativa',
  urgencia vaga_urgencia NOT NULL DEFAULT 'normal',
  destaque BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ -- Data de expiração da vaga
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_vagas_location 
  ON vagas(location_id) 
  WHERE status = 'ativa';

CREATE INDEX idx_vagas_status 
  ON vagas(status);

CREATE INDEX idx_vagas_urgencia 
  ON vagas(urgencia) 
  WHERE status = 'ativa' AND urgencia = 'urgente';

CREATE INDEX idx_vagas_destaque 
  ON vagas(destaque) 
  WHERE status = 'ativa' AND destaque = true;

CREATE INDEX idx_vagas_created_at 
  ON vagas(created_at DESC);

CREATE INDEX idx_vagas_tags 
  ON vagas USING GIN(tags);

CREATE INDEX idx_vagas_search 
  ON vagas USING GIN(to_tsvector('portuguese', titulo || ' ' || empresa || ' ' || descricao));

-- ─────────────────────────────────────────────────────────────────────────
-- 4. RLS (ROW LEVEL SECURITY)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública de vagas ativas
CREATE POLICY "vagas_public_read"
  ON vagas
  FOR SELECT
  USING (status = 'ativa' AND (expires_at IS NULL OR expires_at > now()));

-- Política: Empresas podem criar vagas (simplificado - qualquer autenticado)
CREATE POLICY "vagas_business_create"
  ON vagas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Empresas podem editar suas próprias vagas (simplificado)
CREATE POLICY "vagas_business_update"
  ON vagas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Admin pode tudo (service_role)
CREATE POLICY "vagas_admin_all"
  ON vagas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- Trigger de updated_at
CREATE TRIGGER set_vagas_updated_at
  BEFORE UPDATE ON vagas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. COMENTÁRIOS
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE vagas IS 'SSOT: Vagas de emprego centralizadas';

COMMENT ON COLUMN vagas.location_id IS 'Referência territorial SSOT';

COMMENT ON COLUMN vagas.salario_min IS 'Salário mínimo em centavos';

COMMENT ON COLUMN vagas.salario_max IS 'Salário máximo em centavos';

COMMENT ON COLUMN vagas.tags IS 'Tags para busca e categorização';

COMMENT ON COLUMN vagas.expires_at IS 'Data de expiração automática da vaga';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
