# G117 — Ride History Lifecycle

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Dois hooks ainda mantinham semântica local de lifecycle:

- `useActiveRide` considerava somente `pending`, `driver_accepted` e `in_progress` como ativos;
- `useRideHistory` mantinha uma lista própria de cancelamentos e aceitava corridas abertas no histórico.

Além disso, o histórico convertia `estimated_price` em `final_price` quando o valor realizado não existia, podendo contabilizar estimativa como gasto real. Quando havia paginação, as estatísticas eram calculadas somente sobre a página visível.

## Correção

### `useActiveRide`

Passou a usar `isOpenRideStatus(ride.status)` da authority `RideLifecycleStatus.ts`.

A lista local de estados ativos foi removida.

### `useRideHistory`

Passou a:

- admitir no histórico somente `isClosedRideStatus`;
- usar `isCancelledRideStatus` para toda a família de cancelamentos, incluindo compatibilidade histórica;
- tratar o filtro visual `cancelled` como categoria, não como um único literal;
- manter estimativa e valor realizado separados;
- usar `final_price ?? 0` como gasto realizado;
- somar `totalSpent` somente para corridas `completed`;
- calcular estatísticas sobre todo o conjunto filtrado **antes** de paginar a lista exibida;
- aplicar corretamente o offset `(page - 1) * pageSize`.

## Ratchet

`src/modules/mobility/__tests__/RideHistoryLifecycleG117.test.ts`

Protege:

- classifier canônico de corrida aberta;
- boundary de histórico fechado;
- classifier canônico de cancelamentos;
- ausência de fallback de estimate para gasto realizado;
- estatísticas independentes da paginação.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
