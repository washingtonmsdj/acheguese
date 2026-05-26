-- Seed catalog and billing SSOT entries for mobility driver subscriptions.

INSERT INTO billing_plans (
  code,
  name,
  description,
  price_cents,
  price_display,
  display_order,
  is_featured,
  features,
  entitlements
) VALUES
  (
    'mobility-driver-padrao',
    'Motorista Padrao',
    'Plano operacional para motoristas aceitarem corridas.',
    2990,
    'R$ 29,90',
    20,
    false,
    '["Visualizar pedidos de viagem", "Aceitar corridas", "Avaliacoes de passageiros"]'::jsonb,
    '{
      "canAcceptRideOffers": true,
      "canReceivePriorityNotifications": false,
      "canUseMapHighlight": false,
      "canUsePriorityPlacement": false,
      "driverBadge": "standard"
    }'::jsonb
  ),
  (
    'mobility-driver-prioritario',
    'Motorista Prioritario',
    'Plano com prioridade operacional para motoristas ativos.',
    5990,
    'R$ 59,90',
    21,
    true,
    '["Receber notificacoes primeiro", "Destaque no mapa", "Destaque na lista de pedidos", "Badge PRO no perfil"]'::jsonb,
    '{
      "canAcceptRideOffers": true,
      "canReceivePriorityNotifications": true,
      "canUseMapHighlight": true,
      "canUsePriorityPlacement": true,
      "driverBadge": "pro"
    }'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  features = EXCLUDED.features,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

INSERT INTO catalog_item (
  id,
  catalog_version_id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  vertical,
  pricing_model,
  description,
  features,
  display_order,
  is_featured,
  metadata
) VALUES
  (
    'b1000000-0000-0000-0000-000000000101'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'mobility-driver-padrao',
    'Motorista Padrao',
    'vertical_package',
    'starter',
    'worker',
    'mobility_driver',
    'subscription',
    'Plano operacional para motoristas aceitarem corridas.',
    '["Visualizar pedidos de viagem", "Aceitar corridas", "Avaliacoes de passageiros"]'::jsonb,
    20,
    false,
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000102'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'mobility-driver-prioritario',
    'Motorista Prioritario',
    'vertical_package',
    'pro',
    'worker',
    'mobility_driver',
    'subscription',
    'Plano com prioridade operacional para motoristas ativos.',
    '["Receber notificacoes primeiro", "Destaque no mapa", "Destaque na lista de pedidos", "Badge PRO no perfil"]'::jsonb,
    21,
    true,
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  )
ON CONFLICT (catalog_version_id, item_code) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  item_type = EXCLUDED.item_type,
  plan_tier = EXCLUDED.plan_tier,
  entity_family = EXCLUDED.entity_family,
  vertical = EXCLUDED.vertical,
  pricing_model = EXCLUDED.pricing_model,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO catalog_entitlement_policy (
  id,
  catalog_item_id,
  additional_entitlements
) VALUES
  (
    'e1000000-0000-0000-0000-000000000101'::uuid,
    'b1000000-0000-0000-0000-000000000101'::uuid,
    '{
      "canAcceptRideOffers": true,
      "canReceivePriorityNotifications": false,
      "canUseMapHighlight": false,
      "canUsePriorityPlacement": false,
      "driverBadge": "standard"
    }'::jsonb
  ),
  (
    'e1000000-0000-0000-0000-000000000102'::uuid,
    'b1000000-0000-0000-0000-000000000102'::uuid,
    '{
      "canAcceptRideOffers": true,
      "canReceivePriorityNotifications": true,
      "canUseMapHighlight": true,
      "canUsePriorityPlacement": true,
      "driverBadge": "pro"
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  additional_entitlements = EXCLUDED.additional_entitlements,
  updated_at = now();

INSERT INTO catalog_pricing_policy (
  id,
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  stripe_lookup_key,
  currency,
  metadata
) VALUES
  (
    'c1000000-0000-0000-0000-000000000101'::uuid,
    'b1000000-0000-0000-0000-000000000101'::uuid,
    2990,
    0,
    'monthly',
    7,
    'mobility_driver_padrao_monthly_br',
    'BRL',
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000102'::uuid,
    'b1000000-0000-0000-0000-000000000102'::uuid,
    5990,
    0,
    'monthly',
    7,
    'mobility_driver_prioritario_monthly_br',
    'BRL',
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  setup_fee_cents = EXCLUDED.setup_fee_cents,
  billing_period = EXCLUDED.billing_period,
  trial_period_days = EXCLUDED.trial_period_days,
  stripe_lookup_key = EXCLUDED.stripe_lookup_key,
  currency = EXCLUDED.currency,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO catalog_eligibility_rule (
  id,
  catalog_item_id,
  allowed_entity_families,
  allowed_verticals,
  allowed_actor_types,
  requires_verification,
  metadata
) VALUES
  (
    'd1000000-0000-0000-0000-000000000101'::uuid,
    'b1000000-0000-0000-0000-000000000101'::uuid,
    ARRAY['worker']::entity_family[],
    ARRAY['mobility_driver']::vertical[],
    ARRAY['driver'],
    true,
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  ),
  (
    'd1000000-0000-0000-0000-000000000102'::uuid,
    'b1000000-0000-0000-0000-000000000102'::uuid,
    ARRAY['worker']::entity_family[],
    ARRAY['mobility_driver']::vertical[],
    ARRAY['driver'],
    true,
    '{"source":"mobility_driver_catalog_seed"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  allowed_entity_families = EXCLUDED.allowed_entity_families,
  allowed_verticals = EXCLUDED.allowed_verticals,
  allowed_actor_types = EXCLUDED.allowed_actor_types,
  requires_verification = EXCLUDED.requires_verification,
  metadata = EXCLUDED.metadata;

INSERT INTO billing_plans (
  code,
  name,
  description,
  price_cents,
  price_display,
  display_order,
  is_featured,
  features,
  entitlements
) VALUES
  (
    'mobility-courier-padrao',
    'Motoboy Padrao',
    'Plano operacional para motoboys aceitarem entregas.',
    2990,
    'R$ 29,90',
    22,
    false,
    '["Visualizar entregas disponiveis", "Aceitar entregas", "Avaliacoes de clientes"]'::jsonb,
    '{
      "canAcceptDeliveryOffers": true,
      "canReceivePriorityNotifications": false,
      "canUseMapHighlight": false,
      "canUsePriorityPlacement": false,
      "courierBadge": "standard"
    }'::jsonb
  ),
  (
    'mobility-courier-prioritario',
    'Motoboy Prioritario',
    'Plano com prioridade operacional para motoboys ativos.',
    5990,
    'R$ 59,90',
    23,
    true,
    '["Receber notificacoes primeiro", "Destaque no mapa", "Destaque na lista de entregas", "Badge PRO no perfil"]'::jsonb,
    '{
      "canAcceptDeliveryOffers": true,
      "canReceivePriorityNotifications": true,
      "canUseMapHighlight": true,
      "canUsePriorityPlacement": true,
      "courierBadge": "pro"
    }'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  price_display = EXCLUDED.price_display,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  features = EXCLUDED.features,
  entitlements = EXCLUDED.entitlements,
  updated_at = now();

INSERT INTO catalog_item (
  id,
  catalog_version_id,
  item_code,
  item_name,
  item_type,
  plan_tier,
  entity_family,
  vertical,
  pricing_model,
  description,
  features,
  display_order,
  is_featured,
  metadata
) VALUES
  (
    'b1000000-0000-0000-0000-000000000201'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'mobility-courier-padrao',
    'Motoboy Padrao',
    'vertical_package',
    'starter',
    'worker',
    'mobility_courier',
    'subscription',
    'Plano operacional para motoboys aceitarem entregas.',
    '["Visualizar entregas disponiveis", "Aceitar entregas", "Avaliacoes de clientes"]'::jsonb,
    22,
    false,
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  ),
  (
    'b1000000-0000-0000-0000-000000000202'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'mobility-courier-prioritario',
    'Motoboy Prioritario',
    'vertical_package',
    'pro',
    'worker',
    'mobility_courier',
    'subscription',
    'Plano com prioridade operacional para motoboys ativos.',
    '["Receber notificacoes primeiro", "Destaque no mapa", "Destaque na lista de entregas", "Badge PRO no perfil"]'::jsonb,
    23,
    true,
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  )
ON CONFLICT (catalog_version_id, item_code) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  item_type = EXCLUDED.item_type,
  plan_tier = EXCLUDED.plan_tier,
  entity_family = EXCLUDED.entity_family,
  vertical = EXCLUDED.vertical,
  pricing_model = EXCLUDED.pricing_model,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO catalog_entitlement_policy (
  id,
  catalog_item_id,
  additional_entitlements
) VALUES
  (
    'e1000000-0000-0000-0000-000000000201'::uuid,
    'b1000000-0000-0000-0000-000000000201'::uuid,
    '{
      "canAcceptDeliveryOffers": true,
      "canReceivePriorityNotifications": false,
      "canUseMapHighlight": false,
      "canUsePriorityPlacement": false,
      "courierBadge": "standard"
    }'::jsonb
  ),
  (
    'e1000000-0000-0000-0000-000000000202'::uuid,
    'b1000000-0000-0000-0000-000000000202'::uuid,
    '{
      "canAcceptDeliveryOffers": true,
      "canReceivePriorityNotifications": true,
      "canUseMapHighlight": true,
      "canUsePriorityPlacement": true,
      "courierBadge": "pro"
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  additional_entitlements = EXCLUDED.additional_entitlements,
  updated_at = now();

INSERT INTO catalog_pricing_policy (
  id,
  catalog_item_id,
  price_cents,
  setup_fee_cents,
  billing_period,
  trial_period_days,
  stripe_lookup_key,
  currency,
  metadata
) VALUES
  (
    'c1000000-0000-0000-0000-000000000201'::uuid,
    'b1000000-0000-0000-0000-000000000201'::uuid,
    2990,
    0,
    'monthly',
    7,
    'mobility_courier_padrao_monthly_br',
    'BRL',
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  ),
  (
    'c1000000-0000-0000-0000-000000000202'::uuid,
    'b1000000-0000-0000-0000-000000000202'::uuid,
    5990,
    0,
    'monthly',
    7,
    'mobility_courier_prioritario_monthly_br',
    'BRL',
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  setup_fee_cents = EXCLUDED.setup_fee_cents,
  billing_period = EXCLUDED.billing_period,
  trial_period_days = EXCLUDED.trial_period_days,
  stripe_lookup_key = EXCLUDED.stripe_lookup_key,
  currency = EXCLUDED.currency,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO catalog_eligibility_rule (
  id,
  catalog_item_id,
  allowed_entity_families,
  allowed_verticals,
  allowed_actor_types,
  requires_verification,
  metadata
) VALUES
  (
    'd1000000-0000-0000-0000-000000000201'::uuid,
    'b1000000-0000-0000-0000-000000000201'::uuid,
    ARRAY['worker']::entity_family[],
    ARRAY['mobility_courier']::vertical[],
    ARRAY['courier', 'motoboy'],
    true,
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  ),
  (
    'd1000000-0000-0000-0000-000000000202'::uuid,
    'b1000000-0000-0000-0000-000000000202'::uuid,
    ARRAY['worker']::entity_family[],
    ARRAY['mobility_courier']::vertical[],
    ARRAY['courier', 'motoboy'],
    true,
    '{"source":"mobility_courier_catalog_seed"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  allowed_entity_families = EXCLUDED.allowed_entity_families,
  allowed_verticals = EXCLUDED.allowed_verticals,
  allowed_actor_types = EXCLUDED.allowed_actor_types,
  requires_verification = EXCLUDED.requires_verification,
  metadata = EXCLUDED.metadata;
