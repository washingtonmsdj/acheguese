# G100 — Realtime Admin Mobility Authority

Data: 2026-09-12

## Problema corrigido

O dashboard administrativo em tempo real ainda reconstruía authorities de Mobilidade localmente:

- inferia motorista online por campos de `driver_complete_profile` e aliases como `online/status=online`;
- mantinha listas locais de corridas ativas e aguardando motorista;
- calculava taxa de conclusão sobre todas as corridas, penalizando corridas ainda abertas;
- chamava soma de preços das corridas de `revenueToday/revenueWeek/revenueMonth`;
- aceitava `suggested_price` como fallback de valor concluído;
- considerava motorista atualmente suspenso quando havia qualquer histórico de suspensão.

## Presença

A presença online do dashboard agora vem de:

`AdminDriverPresenceReadService.listOnline()`

Fonte exclusiva: `driver_availability`.

Dados estáticos do motorista continuam sendo combinados com o read de perfil, mas `is_online/is_available/last_location_update/active_ride_id` não são inferidos de outro contrato.

## Lifecycle

O dashboard usa:

- `QUERYABLE_OPEN_RIDE_STATUSES` para corridas abertas;
- `QUERYABLE_CLOSED_RIDE_STATUSES` para corridas resolvidas;
- `LEGACY_RIDE_STATUS_ALIASES` para compatibilidade determinística;
- `RIDE_STATE` para estados canônicos.

A taxa de conclusão agora é:

`completed / resolved`

Corridas abertas não contam como falha de conclusão.

## Valor de corridas concluídas

O contrato `RealtimeMetrics` foi renomeado:

- `revenueToday` -> `completedValueToday`;
- `revenueWeek` -> `completedValueWeek`;
- `revenueMonth` -> `completedValueMonth`.

O cálculo usa somente `final_price` ou `actual_fare` de corridas `completed`. `suggested_price` não é usado como valor realizado.

As UIs foram atualizadas para dizer explicitamente "Valor concluído" / "Valores de Corridas Concluídas", sem afirmar que esse total representa receita líquida da plataforma.

## Suspensão atual

`getReputationStats()` agora usa `AdminDriverModerationService.getModerationRows()` e conta somente `is_suspended === true`. Histórico de suspensão não é confundido com estado atual.

## Ratchet

`src/modules/mobility/__tests__/AdminRealtimeMobilityAuthorityG100.test.ts`

O teste bloqueia regressões para:

- presença inferida fora de `driver_availability`;
- listas locais de lifecycle ativo;
- taxa de conclusão sobre total de corridas;
- campos `revenue*`;
- fallback por `suggested_price`;
- contagem de suspensão atual pelo histórico.

## Validação de infraestrutura

A validação hospedada continua condicionada à disponibilidade dos runners e do Vercel. Ausência de execução não é considerada PASS de código.
