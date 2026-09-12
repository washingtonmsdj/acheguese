# G135 — Static Ride Lookup Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A classe estática legada `MobilityService` ainda expunha `getRideById()` com `select("*")`. O consumidor relevante remanescente era `MotoboyAuthorizationService.canCancelDelivery()`, que precisava apenas confirmar `passenger_profile_id` para autorizar o solicitante.

Isso fazia uma checagem simples de ownership carregar a linha completa da corrida.

## Correção

`MobilityService.getRideById()` foi mantido temporariamente como wrapper de compatibilidade, mas agora delega para:

`RideOperationalContextReadService.getLifecycle(id)`

Assim o contrato estático recebe somente:

- `id`;
- `status`;
- `passenger_profile_id`;
- `driver_profile_id`;
- `ride_mode`.

`MotoboyAuthorizationService.canCancelDelivery()` preserva a mesma regra de autorização, mas não recebe mais rota, contato, prova, preço ou outros campos do ride.

O reader de UI/runtime `mobilityService.getRideById()` em `MobilityRuntimeService` permanece separado e não foi alterado neste gate.

## Ratchet

`src/modules/mobility/__tests__/StaticRideLookupBoundaryG135.test.ts`

Protege:

- delegação do wrapper estático ao read model lifecycle;
- ausência de `select("*")` nesse método;
- escopo requester-only da autorização de cancelamento;
- separação entre wrapper estático operacional e reader runtime de UI.

## Residual

O nome genérico `MobilityService.getRideById()` ainda existe por compatibilidade e poderá ser removido quando o último consumidor estático for migrado diretamente. Este gate reduz imediatamente o payload e impede que a compatibilidade seja usada como atalho para dados completos.

## Validação

Sources foram inspecionados e o ratchet foi versionado. Este checkpoint **não declara suite/CI verde** sem execução confiável.