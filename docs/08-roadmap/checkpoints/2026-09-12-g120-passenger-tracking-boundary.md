# G120 — Passenger Tracking Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`PassageiroPage` duplicava lifecycle em três arrays locais e incluía `driver_assigned` entre estados rastreáveis.

`driver_assigned` representa oferta/atribuição pré-aceite; a UI não deve tentar abrir rastreamento preciso antes da aceitação do motorista. A RPC ride-scoped já bloqueava essa tentativa no servidor, mas o frontend ainda fazia trabalho desnecessário e apresentava uma fronteira semântica errada.

## Correção

A página removeu:

- `ACTIVE_RIDE_STATUSES`;
- `SEARCHING_RIDE_STATUSES`;
- `TRACKABLE_RIDE_STATUSES`.

Agora:

- corridas abertas usam `isOpenRideStatus`;
- estados pré-aceite usam `isPreAcceptRideStatus` e permanecem no card de espera/aguardando confirmação;
- `RideTrackingMap` só é montado quando existe `driver_profile_id` **e** `isDriverOwnedOpenRideStatus(ride.status)` é verdadeiro.

Assim `driver_assigned` não inicia tracking no cliente.

## Defesa em profundidade preservada

Nenhuma autorização server-side foi removida. `RideTrackingAccessService`/`mobility_get_driver_location_for_ride` continuam sendo a authority final que deriva:

- participante autorizado;
- binding da corrida ao motorista;
- elegibilidade de lifecycle;
- permissão de localização precisa.

G120 corrige a boundary da UI; não substitui a autorização do banco.

## Ratchet

`src/modules/mobility/__tests__/PassengerTrackingBoundaryG120.test.ts`

Protege:

- ausência dos arrays locais;
- uso de classifiers compartilhados;
- tracking somente em driver-owned open state;
- ausência de `RIDE_STATUS.DRIVER_ASSIGNED` na decisão de tracking da página.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
