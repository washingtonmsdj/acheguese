# Matriz de Notificacoes Fase 3 (SSOT)

Data: 2026-05-09  
Escopo: Gastronomia + Delivery Motoboy + Trust/Admin

## Regras canonicas

- Fonte de pedido: `OrderDeliveryNotificationService`.
- Fonte de corrida/entrega motoboy: `RideOperationalService.handlePostTransition`.
- Fonte de confianca/admin: `TrustEventService`.
- Sem notificacao com `profile_id` em `user_id`: sempre resolver `user_id` pelo profile.
- Sem auto-notificacao duplicada.
- Falha de notificacao nao interrompe fluxo operacional.

## Gastronomia/Delivery - eventos e audiencia

1. `order_created`
- Cliente: sim, rota `/gastronomia/pedidos/:orderId`
- Loja: sim, rota `/central/empresas/:businessId/gastronomia/pedidos/:orderId`
- Motoboy: nao (pedido ainda pendente de operacao)

2. `order_accepted`
3. `order_preparing`
4. `order_ready_for_pickup`
5. `courier_picked_up`
6. `order_delivered`
7. `order_canceled_by_customer`
8. `order_canceled_by_merchant`
9. `delivery_failed`
10. `delivery_proof_attached`
- Cliente: sim, rota `/gastronomia/pedidos/:orderId`
- Loja: sim, rota `/central/empresas/:businessId/gastronomia/pedidos/:orderId`
- Motoboy: sim (exceto `pending`), rota `/central/motoboy/entregas`

## Mobilidade/Motoboy - eventos e audiencia

1. `ride_driver_accepted`
2. `ride_in_progress`
3. `delivery_in_route`
4. `delivery_completed`
5. `ride_completed`
6. `ride_canceled`
7. `operation_completed`
- Passageiro/cliente: rota `/mobilidade/buscando/:rideId`
- Motorista: rota `/central/motorista/corridas`
- Motoboy: rota `/central/motoboy/entregas`

## Trust/Admin - eventos e audiencia

1. `trust_event` criado/atualizado
- Sujeito: rota de contexto (`/gastronomia/pedidos/:id`, `/central/motoboy/entregas`, `/classificados/:id`, `/central/profissional`, `/comunidade`)
- Ator: rota de contexto (quando diferente do sujeito)

2. `trust_admin_action` aplicada
- Sujeito: rota de contexto do `trust_event` vinculado; fallback `/perfil`
- Admin aplicador: rota `/admin/moderacao`

## Evidencias de validacao

- `tests/e2e/gastronomy-operational.spec.ts`
- `tests/e2e/central/central-validation.spec.ts`
- `src/modules/business/gastronomy/__tests__/GastronomyOperationalSSOT.test.ts`
