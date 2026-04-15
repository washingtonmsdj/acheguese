-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Função para sincronizar plan_tier
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- Mantém gastronomy_profiles.plan_tier sincronizado com 
-- gastronomy_subscriptions.plan_tier
--
-- Quando uma assinatura é criada ou atualizada, o plan_tier do perfil
-- gastronômico é automaticamente atualizado.
--
-- ══════════════════════════════════════════════════════════════════════════

-- Função para sincronizar plan_tier
CREATE OR REPLACE FUNCTION sync_gastronomy_plan_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar plan_tier no gastronomy_profile
  UPDATE gastronomy_profiles
  SET plan_tier = NEW.plan_tier
  WHERE business_id = NEW.business_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: quando assinatura é criada ou atualizada
CREATE TRIGGER sync_plan_tier_on_subscription_change
  AFTER INSERT OR UPDATE OF plan_tier ON gastronomy_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gastronomy_plan_tier();

-- ══════════════════════════════════════════════════════════════════════════
-- Comentários
-- ══════════════════════════════════════════════════════════════════════════

COMMENT ON FUNCTION sync_gastronomy_plan_tier() IS 
'Sincroniza plan_tier entre gastronomy_subscriptions e gastronomy_profiles';

-- ══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (Testar sincronização)
-- ══════════════════════════════════════════════════════════════════════════
-- 
-- -- 1. Atualizar assinatura
-- UPDATE gastronomy_subscriptions
-- SET plan_tier = 'pro'
-- WHERE business_id = 'SEU_BUSINESS_ID_AQUI';
-- 
-- -- 2. Verificar se sincronizou
-- SELECT 
--   gp.business_id,
--   gp.plan_tier AS profile_plan,
--   gs.plan_tier AS subscription_plan
-- FROM gastronomy_profiles gp
-- JOIN gastronomy_subscriptions gs ON gs.business_id = gp.business_id
-- WHERE gp.business_id = 'SEU_BUSINESS_ID_AQUI';
-- 
-- -- Resultado esperado: profile_plan = subscription_plan
--
-- ══════════════════════════════════════════════════════════════════════════
