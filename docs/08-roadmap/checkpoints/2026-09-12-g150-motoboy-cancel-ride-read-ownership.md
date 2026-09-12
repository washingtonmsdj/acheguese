# G150 — Motoboy Cancel Ride Read Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`MotoboyAuthorizationService.canCancelDelivery()` ainda dependia do wrapper temporário:

`MobilityService.getRideById()`

O wrapper já delegava para `RideOperationalContextReadService`, portanto não agregava regra nem autorização; apenas mantinha uma compatibility layer adicional.

## Correção

`MotoboyAuthorizationService` passou a consultar diretamente:

`RideOperationalContextReadService.getLifecycle(rideId)`

A decisão continua limitada ao `passenger_profile_id` do contexto operacional; nenhum payload de destinatário, proof ou rota foi adicionado.

`MobilityService.getRideById()` foi removido fisicamente de `MobilityService.impl.ts`.

O reader de UI/runtime `mobilityService.getRideById()` em `MobilityRuntimeService` permanece separado e não foi alterado.

## Ratchets evoluídos

- `StaticRideLookupBoundaryG135.test.ts` agora exige ausência do wrapper e uso direto do bounded reader pela autorização;
- `StaticMobilityReaderRetirementG147.test.ts` também bloqueia a reintrodução de `getRideById` estático.

## Commits

- `149a548c` — migra autorização para `RideOperationalContextReadService`;
- `81d51b0c` — remove wrapper estático;
- `1d8fd616` — evolui ratchet G135;
- `b2689b90` — evolui ratchet G147.

## Validação

O diff do serviço de autorização foi inspecionado após a substituição integral; a mudança funcional ficou restrita ao owner do read de cancelamento.

Este checkpoint **não declara suite/CI verde** sem execução confiável dos runners.
