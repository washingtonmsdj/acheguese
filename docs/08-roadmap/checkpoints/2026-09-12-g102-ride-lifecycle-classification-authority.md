# G102 — Ride Lifecycle Classification Authority

Data: 2026-09-12

## Problema

Várias superfícies precisavam classificar o mesmo lifecycle em categorias de leitura diferentes e acabavam recriando arrays locais para:

- corrida aberta;
- pré-aceite;
- participação operacional do motorista;
- cancelamento.

Essa duplicação já havia causado divergências como `driver_assigned` tratado como estado rastreável pelo passageiro e listas administrativas incompletas.

## Authority consolidada

`src/core/mobility/core/RideLifecycleStatus.ts` agora expõe:

- `QUERYABLE_OPEN_RIDE_STATUSES`;
- `QUERYABLE_CLOSED_RIDE_STATUSES`;
- `QUERYABLE_PRE_ACCEPT_RIDE_STATUSES`;
- `DRIVER_OWNED_OPEN_RIDE_STATUSES`;
- `QUERYABLE_CANCELLED_RIDE_STATUSES`;
- `isOpenRideStatus()`;
- `isClosedRideStatus()`;
- `isPreAcceptRideStatus()`;
- `isDriverOwnedOpenRideStatus()`;
- `isCancelledRideStatus()`.

`driver_assigned` permanece explicitamente pré-aceite. Atribuição de oferta não é convertida em autoridade de participante operacional.

## Consumidor já migrado

`AdminMobilityService.getRideStats()` não mantém mais sets administrativos próprios para aberto/cancelado e usa os classificadores compartilhados.

O ratchet G98 foi evoluído para exigir essa arquitetura.

## Ratchet

`src/modules/mobility/__tests__/RideLifecycleClassificationAuthorityG102.test.ts`

O teste protege a presença dos classificadores, a separação pré-aceite/driver-owned e o consumo pelo agregador administrativo.

## Próximo corte explícito

Ainda existem consumidores grandes que serão migrados em gate próprio para evitar substituição integral arriscada sem revisão completa:

- `src/core/admin/services/admin.queries.ts`;
- `src/modules/mobility/hooks/useMobilidade.ts`;
- `src/modules/mobility/pages/PassageiroPage.tsx`.

Essa pendência é de adoção da authority; a definição canônica está concluída neste gate.
