-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Seed do Catálogo Inicial SSOT
-- ══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Popular catálogo com planos existentes (Free, Pro, Delivery)
-- Fase: 2 - Banco e Migrações
-- Referência: F1_1_SANEAMENTO_MODELAGEM.md
--
-- Estrutura:
-- - Versão v1.0.0 (inicial)
-- - 3 base_plans: Free, Pro, Delivery
-- - 1 vertical_package: Gastronomy Pro
-- - Entitlements e pricing para cada item
--
-- ══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 1: Criar versão inicial do catálogo
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO commercial_catalog_version (
  id,
  version_code,
  version_name,
  status,
  description,
  published_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'v1.0.0',
  'Catálogo Inicial Multi-Vertical',
  'published',
  'Primeira versão do catálogo com planos Free, Pro e Delivery',
  NOW()
) ON CONFLICT (version_code) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 2: Criar base plans
-- ──────────────────────────────────────────────────────────────────────────

-- FREE
INSERT INTO catalog_item (
  id,
  catalog_version_id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  pricing_model,
  description,
  features,
  display_order
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'base-free',
  'Plano Free',
  'base_plan',
  'free',
  'company',
  'free',
  'Plano gratuito com recursos básicos',
  '["Página pública básica", "Cardápio simples", "QR Code básico", "Botão WhatsApp", "URL canônica"]'::jsonb,
  1
) ON CONFLICT (catalog_version_id, item_code) DO NOTHING;

-- PRO
INSERT INTO catalog_item (
  id,
  catalog_version_id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  pricing_model,
  description,
  features,
  display_order
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'base-pro',
  'Plano Pro',
  'base_plan',
  'pro',
  'company',
  'subscription',
  'Plano profissional com recursos avançados',
  '["Tudo do Free", "Página premium", "Link curto (/p/:slug)", "QR Code personalizado", "Cardápio avançado", "Imagens ilimitadas", "Promoções", "Destaque na listagem", "Analytics básico"]'::jsonb,
  2
) ON CONFLICT (catalog_version_id, item_code) DO NOTHING;

-- DELIVERY
INSERT INTO catalog_item (
  id,
  catalog_version_id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  pricing_model,
  description,
  features,
  display_order
) VALUES (
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'base-delivery',
  'Plano Delivery',
  'base_plan',
  'business',
  'company',
  'subscription',
  'Plano completo com sistema de pedidos e entregas',
  '["Tudo do Pro", "Pedidos internos", "Painel de pedidos", "Acesso à rede de motoboys", "Solicitação de entrega", "Rastreamento de entrega", "Analytics avançado", "Exportação de relatórios"]'::jsonb,
  3
) ON CONFLICT (catalog_version_id, item_code) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 3: Criar entitlements para cada base plan
-- ──────────────────────────────────────────────────────────────────────────

-- FREE Entitlements
INSERT INTO catalog_entitlement_policy (
  catalog_item_id,
  can_use_premium_public_page,
  can_use_short_premium_link,
  can_use_custom_qr_code,
  can_use_advanced_menu,
  can_receive_internal_orders,
  can_use_motoboy_network,
  can_use_promotions,
  can_use_basic_analytics,
  can_use_advanced_analytics,
  max_menu_items,
  max_promotions,
  max_images,
  max_categories
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  FALSE,  -- can_use_premium_public_page
  FALSE,  -- can_use_short_premium_link ⭐
  FALSE,  -- can_use_custom_qr_code
  FALSE,  -- can_use_advanced_menu
  FALSE,  -- can_receive_internal_orders
  FALSE,  -- can_use_motoboy_network
  FALSE,  -- can_use_promotions
  FALSE,  -- can_use_basic_analytics
  FALSE,  -- can_use_advanced_analytics
  20,     -- max_menu_items
  0,      -- max_promotions
  5,      -- max_images
  3       -- max_categories
) ON CONFLICT DO NOTHING;

-- PRO Entitlements
INSERT INTO catalog_entitlement_policy (
  catalog_item_id,
  can_use_premium_public_page,
  can_use_short_premium_link,
  can_use_custom_qr_code,
  can_use_advanced_menu,
  can_receive_internal_orders,
  can_use_motoboy_network,
  can_use_promotions,
  can_use_basic_analytics,
  can_use_advanced_analytics,
  max_menu_items,
  max_promotions,
  max_images,
  max_categories
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  TRUE,   -- can_use_premium_public_page
  TRUE,   -- can_use_short_premium_link ⭐ ATIVO
  TRUE,   -- can_use_custom_qr_code
  TRUE,   -- can_use_advanced_menu
  FALSE,  -- can_receive_internal_orders
  FALSE,  -- can_use_motoboy_network
  TRUE,   -- can_use_promotions
  TRUE,   -- can_use_basic_analytics
  FALSE,  -- can_use_advanced_analytics
  NULL,   -- max_menu_items (ilimitado)
  10,     -- max_promotions
  NULL,   -- max_images (ilimitado)
  NULL    -- max_categories (ilimitado)
) ON CONFLICT DO NOTHING;

-- DELIVERY Entitlements
INSERT INTO catalog_entitlement_policy (
  catalog_item_id,
  can_use_premium_public_page,
  can_use_short_premium_link,
  can_use_custom_qr_code,
  can_use_advanced_menu,
  can_receive_internal_orders,
  can_use_motoboy_network,
  can_use_promotions,
  can_use_basic_analytics,
  can_use_advanced_analytics,
  max_menu_items,
  max_promotions,
  max_images,
  max_categories
) VALUES (
  'b0000000-0000-0000-0000-000000000003'::uuid,
  TRUE,   -- can_use_premium_public_page
  TRUE,   -- can_use_short_premium_link ⭐ ATIVO
  TRUE,   -- can_use_custom_qr_code
  TRUE,   -- can_use_advanced_menu
  TRUE,   -- can_receive_internal_orders
  TRUE,   -- can_use_motoboy_network
  TRUE,   -- can_use_promotions
  TRUE,   -- can_use_basic_analytics
  TRUE,   -- can_use_advanced_analytics
  NULL,   -- max_menu_items (ilimitado)
  NULL,   -- max_promotions (ilimitado)
  NULL,   -- max_images (ilimitado)
  NULL    -- max_categories (ilimitado)
) ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 4: Criar pricing para cada base plan
-- ──────────────────────────────────────────────────────────────────────────

-- FREE Pricing
INSERT INTO catalog_pricing_policy (
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  stripe_lookup_key
) VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  0,        -- Grátis
  0,
  NULL,     -- Sem período (free)
  0,
  'base_free_br'
) ON CONFLICT DO NOTHING;

-- PRO Pricing
INSERT INTO catalog_pricing_policy (
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  stripe_lookup_key
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  4990,     -- R$ 49,90
  0,
  'monthly',
  7,        -- 7 dias de trial
  'base_pro_monthly_br'
) ON CONFLICT DO NOTHING;

-- DELIVERY Pricing
INSERT INTO catalog_pricing_policy (
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  stripe_lookup_key
) VALUES (
  'b0000000-0000-0000-0000-000000000003'::uuid,
  9990,     -- R$ 99,90
  0,
  'monthly',
  7,        -- 7 dias de trial
  'base_delivery_monthly_br'
) ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- STEP 5: Criar regras de elegibilidade
-- ──────────────────────────────────────────────────────────────────────────

-- Todos os base plans são elegíveis para 'company'
INSERT INTO catalog_eligibility_rule (
  catalog_item_id,
  allowed_entity_families,
  requires_verification
) VALUES 
  ('b0000000-0000-0000-0000-000000000001'::uuid, ARRAY['company']::entity_family[], FALSE),
  ('b0000000-0000-0000-0000-000000000002'::uuid, ARRAY['company']::entity_family[], FALSE),
  ('b0000000-0000-0000-0000-000000000003'::uuid, ARRAY['company']::entity_family[], FALSE)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRATION
-- ══════════════════════════════════════════════════════════════════════════
