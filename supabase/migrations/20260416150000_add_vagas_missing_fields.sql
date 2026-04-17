-- ══════════════════════════════════════════════════════════════════════════
-- ADICIONAR CAMPOS FALTANTES EM VAGAS
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Descrição: Adiciona campos que estavam no mock mas faltavam no banco
--            - empresa_logo: URL do logo da empresa
--            - categoria: Categoria da vaga
--            - vagas_quantidade: Número de vagas disponíveis
-- 
-- Autor: Kiro AI
-- Data: 2026-04-16
-- 
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar campos faltantes
ALTER TABLE vagas 
ADD COLUMN IF NOT EXISTS empresa_logo TEXT,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS vagas_quantidade INTEGER DEFAULT 1;

-- Comentários
COMMENT ON COLUMN vagas.empresa_logo IS 'URL do logo da empresa';
COMMENT ON COLUMN vagas.categoria IS 'Categoria da vaga (ex: tecnologia, saude, educacao)';
COMMENT ON COLUMN vagas.vagas_quantidade IS 'Número de vagas disponíveis para esta posição';

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
