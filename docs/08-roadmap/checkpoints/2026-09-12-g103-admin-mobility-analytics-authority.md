# G103 — Admin Mobility Analytics Authority

Data: 2026-09-12

## Problemas corrigidos

A superfície `/admin/analytics-mobilidade` ainda reconstruía o lifecycle e a semântica financeira localmente:

- `pending` era contado isoladamente;
- `driver_assigned` era tratado como `inProgress`;
- somente `cancelled` era contado como cancelamento;
- taxa de conclusão e cancelamento usavam todas as corridas como denominador;
- `suggested_price` era usado como fallback de valor realizado;
- `final_price/suggested_price` era apresentado como `Receita`;
- conclusões/cancelamentos eram atribuídos ao dia de criação da corrida;
- `is_verified !== true` era apresentado como status de moderação “pendente”.

## Lifecycle

O hook `useAdminMobilityAnalytics` agora usa os classificadores compartilhados de `RideLifecycleStatus`:

- `isOpenRideStatus()`;
- `isClosedRideStatus()`;
- `isCancelledRideStatus()`;
- `isPreAcceptRideStatus()`;
- `isDriverOwnedOpenRideStatus()`.

O contrato estatístico expõe explicitamente:

- corridas criadas no período;
- abertas;
- pré-aceite;
- abertas com motorista como participante operacional;
- resolvidas;
- concluídas;
- canceladas;
- falhas;
- expiradas.

## Taxas

`completionRate` e `cancellationRate` usam apenas corridas resolvidas como denominador. Corridas ainda abertas não reduzem artificialmente a taxa de conclusão nem entram na taxa de cancelamento.

## Valor concluído

O valor realizado de uma corrida concluída agora é:

`final_price ?? actual_fare ?? 0`

` suggested_price ` não é aceito como valor realizado.

O contrato e a UI foram renomeados de `revenue/totalRevenue` para `completedValue` / “Valor concluído”. A interface não afirma que esse total seja receita líquida da plataforma.

## Temporalidade

- corridas criadas são atribuídas ao dia de `created_at`;
- conclusões usam `completed_at`, com `updated_at` como fallback de read model;
- cancelamentos usam `cancelled_at`, com `updated_at` como fallback;
- top motoristas usa somente conclusões resolvidas dentro do período selecionado.

## Motoristas

A UI passou de “pendentes/aprovação” para o que o read realmente conhece nessa superfície:

- verificados;
- não verificados;
- taxa de verificação.

Nenhuma decisão de moderação é inferida a partir de `is_verified`.

## Ratchet

`src/modules/mobility/__tests__/AdminMobilityAnalyticsAuthorityG103.test.ts`

O teste bloqueia:

- comparação local com `pending/cancelled/driver_assigned`;
- retorno de `suggested_price` ao valor realizado;
- retorno de `totalRevenue/revenue`;
- taxas calculadas sobre `totalRides`;
- buckets antigos `pendingRides/inProgressRides`.
