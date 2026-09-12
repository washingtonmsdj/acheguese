# G151 — Driver Availability Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`DriverAvailabilityService` ainda dependia de `MobilityService.impl.ts` apenas para executar o bootstrap `ensure_owned_driver_data`, enquanto o mesmo bounded service já era owner das transições e leituras de disponibilidade.

Além disso, `getStatus()` ainda usava `driver_availability.select("*")`, ampliando desnecessariamente o contrato operacional.

Depois dos gates G147–G150, `MobilityService.impl.ts` ficou reduzido a esse único wrapper de compatibilidade.

## Correção

- `DriverAvailabilityService.ensureDriverDataRow()` passou a chamar diretamente a RPC `ensure_owned_driver_data`.
- `getStatus()` passou a usar projeção explícita de `driver_availability`.
- coordenadas `0` passaram a ser tratadas corretamente com checagem `!= null`.
- `runtime.ts`, `MobilityService.ts`, `services/index.ts` e `modules/mobility/index.ts` passaram a exportar `mobilityService` diretamente de `MobilityRuntimeService`.
- a classe estática `MobilityService` de compatibilidade deixou de ser exportada.
- `src/core/mobility/services/MobilityService.impl.ts` foi removido fisicamente.

## Ratchets

- `src/modules/mobility/__tests__/StaticMobilityReaderRetirementG147.test.ts` foi evoluído para exigir a remoção física do compatibility service.
- `src/modules/mobility/__tests__/DriverAvailabilityOwnershipG151.test.ts` protege:
  - bootstrap owned por `DriverAvailabilityService`;
  - projeção explícita de disponibilidade;
  - ausência de `MobilityService.impl.ts` nos entrypoints;
  - export do singleton diretamente por `MobilityRuntimeService`.

## Commits principais

- `d27abc03265e140c1124e5ab02ebda9f1d94a471` — mover bootstrap/status para o owner de disponibilidade.
- `5ca30b054b8297c8c4e043d3dd4bf5e628de6fe9` — desacoplar runtime do compatibility service.
- `ed7339bde6ad697e4d466fd076f11daeac790ba0` — retirar export legado da facade.
- `0aed881a2ffc1ed6ded572ca5d1dc3b292f4ad29` — apontar índice público ao owner runtime.
- `9082d522c68f889c02b2c5b67e475ea8098d467e` — limpar API pública do módulo.
- `fd6f3547c332e40d77014c7ad3838d69e3a160c8` — remover `MobilityService.impl.ts`.
- `7b61328d4dcb09a6f63a24b6b881da6474d439e3` — evoluir ratchet G147.
- `17b6bcad161f1b7fa437ca6de51777245124301a` — ratchet G151.

## Validação

O source/diff foi inspecionado e os ratchets foram versionados. Este checkpoint **não declara suite/CI verde** sem uma execução confiável dos testes.