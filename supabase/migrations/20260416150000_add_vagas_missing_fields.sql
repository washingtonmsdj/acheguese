-- ADICIONAR CAMPOS FALTANTES EM VAGAS
--
-- Descricao: adiciona campos operacionais de vagas que faltavam no banco.
-- - empresa_logo: URL do logo da empresa
-- - categoria: categoria da vaga
-- - vagas_quantidade: numero de vagas disponiveis
--
-- Autor: Kiro AI
-- Data: 2026-04-16

ALTER TABLE vagas
ADD COLUMN IF NOT EXISTS empresa_logo TEXT,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS vagas_quantidade INTEGER DEFAULT 1;

COMMENT ON COLUMN vagas.empresa_logo IS 'URL do logo da empresa';
COMMENT ON COLUMN vagas.categoria IS 'Categoria da vaga (ex: tecnologia, saude, educacao)';
COMMENT ON COLUMN vagas.vagas_quantidade IS 'Numero de vagas disponiveis para esta posicao';