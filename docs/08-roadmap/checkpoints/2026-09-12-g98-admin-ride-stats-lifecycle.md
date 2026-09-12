# G98 — Admin Ride Stats Lifecycle

Data: 2026-09-12

## Problema corrigido

`AdminMobilityService.getRideStats()` ainda tratava o lifecycle como se existissem apenas:

- `pending`;
- `completed`;
- `cancelled`.

Isso ignorava a máquina atual (`requested`, `searching_driver`, `cancelled_by_driver`, `cancelled_by_passenger`, `failed`, `expired`, etc.) e chamava a soma de `final_price` de `total_revenue`, atribuindo semântica financeira que o read não garante.

## Correção

O resumo administrativo agora deriva estados de:

- `QUERYABLE_OPEN_RIDE_STATUSES`;
- `LEGACY_CLOSED_RIDE_STATUSES`;
- `RIDE_STATE`.

Contrato atual:

- `total_rides`;
- `open_rides`;
- `completed_rides`;
- `cancelled_rides`;
- `failed_rides`;
- `expired_rides`;
- `completed_value`.

`cancelled_rides` inclui apenas cancelamentos canônicos por motorista/passageiro e o alias histórico não resolvido `cancelled`.

`completed_value` soma `final_price` somente das corridas efetivamente `completed`; o nome não afirma que o valor é receita líquida da plataforma.

## Ratchet

`src/modules/mobility/__tests__/AdminRideStatsLifecycleG98.test.ts`

O teste impede o retorno de:

- `pending_rides`;
- `total_revenue`;
- comparações locais com `status === "pending"`;
- comparações locais com `status === "cancelled"`.
