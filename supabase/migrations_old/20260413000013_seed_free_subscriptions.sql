-- ══════════════════════════════════════════════════════════════════════════
-- SEED: Criar assinaturas Free para perfis existentes
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Cria assinatura Free para todos os gastronomy_profiles existentes
-- que ainda não têm assinatura.
--
-- Plano Free:
-- - R$ 0 (grátis)
-- - Página pública
-- - Cardápio básico (50 itens)
-- - Pedidos via WhatsApp
-- - QR code básico
--
-- ══════════════════════════════════════════════════════════════════════════

INSERT INTO gastronomy_subscriptions (
  business_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  business_id,
  'free' AS plan_tier,
  'active' AS status,
  now() AS current_period_start,
  now() + INTERVAL '100 years' AS current_period_end -- Free nunca expira
FROM gastronomy_profiles
WHERE business_id NOT IN (
  SELECT business_id FROM gastronomy_subscriptions
)
ON CONFLICT (business_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- -- Contar perfis gastronômicos
-- SELECT COUNT(*) AS total_profiles
-- FROM gastronomy_profiles;
-- 
-- -- Contar assinaturas
-- SELECT COUNT(*) AS total_subscriptions
-- FROM gastronomy_subscriptions;
-- 
-- -- Verificar distribuição de planos
-- SELECT 
--   plan_tier,
--   COUNT(*) AS total,
--   ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
-- FROM gastronomy_subscriptions
-- GROUP BY plan_tier
-- ORDER BY total DESC;
-- 
-- -- Resultado esperado: 
-- -- Todos os perfis gastronômicos devem ter uma assinatura Free
--
-- ══════════════════════════════════════════════════════════════════════════
