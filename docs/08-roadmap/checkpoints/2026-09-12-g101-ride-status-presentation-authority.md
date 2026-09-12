# G101 — Ride Status Presentation Authority

Data: 2026-09-12

## Problema corrigido

A camada visual ainda possuía duas formas de divergir do lifecycle:

1. `AdminRealtimeDashboard` mantinha mapas locais e incompletos de label/cor de status;
2. `RideCardHeader` restringia status a uma lista histórica e convertia qualquer valor fora dela para `pending`.

Com isso, estados válidos mais novos podiam aparecer com texto cru, cor errada ou, pior, como `pending`.

## Correção

`src/modules/mobility/components/StatusBadge.tsx` permanece como componente canônico de apresentação e agora aceita o status bruto (`string`) do read boundary. Labels conhecidos continuam vindo de `RIDE_STATUS_LABELS`; valores ainda não conhecidos são exibidos sem falsificação de estado.

`RideCardHeader` agora passa o status original diretamente ao `StatusBadge` e não possui mais `rideCardStatuses/toRideStatus`.

`AdminRealtimeDashboard` removeu `getStatusColor/getStatusText` locais e reutiliza o mesmo `StatusBadge` da Mobilidade.

## Ratchet

`src/modules/mobility/__tests__/RideStatusPresentationAuthorityG101.test.ts`

O teste impede:

- retorno do fallback artificial para `pending`;
- retorno da whitelist local do `RideCardHeader`;
- mapas locais de label/cor no dashboard admin;
- abandono do `StatusBadge` canônico no dashboard.
