-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Adicionar plan_tier em gastronomy_profiles
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Adiciona campo plan_tier para controlar o plano de assinatura:
-- - free: Grátis (padrão)
-- - pro: R$ 49,90/mês
-- - delivery: R$ 99,90/mês
--
-- Parte do Modelo Comercial V2 (sem marketplace financeiro)
-- Monetização 100% por assinatura mensal
--
-- ══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna plan_tier
ALTER TABLE gastronomy_profiles
ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'free'
CHECK (plan_tier IN ('free', 'pro', 'delivery'));

-- Criar índice para performance
CREATE INDEX idx_gastronomy_profiles_plan_tier 
ON gastronomy_profiles(plan_tier);

-- Adicionar comentário
COMMENT ON COLUMN gastronomy_profiles.plan_tier IS 
'Plano de assinatura: free (grátis), pro (R$ 49,90/mês), delivery (R$ 99,90/mês)';

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- SELECT 
--   id,
--   business_id,
--   cuisine_type,
--   plan_tier,
--   created_at
-- FROM gastronomy_profiles
-- LIMIT 5;
--
-- ══════════════════════════════════════════════════════════════════════════
