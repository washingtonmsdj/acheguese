# G99 — Admin Open Ride Lifecycle Authority

Data: 2026-09-12

## Problema corrigido

`MobilityAdminQueryService.getActiveRidesForMap()` mantinha uma lista local de estados considerados ativos. Essa duplicação podia divergir da state machine e exigir manutenção paralela sempre que o lifecycle mudasse.

## Correção

O read administrativo de corridas ativas agora consulta diretamente:

`QUERYABLE_OPEN_RIDE_STATUSES`

A lista local `activeStatuses` foi removida.

Com isso, o mapa/admin passa a herdar automaticamente:

- estados abertos canônicos;
- aliases históricos ainda necessários durante a convergência das migrations;
- futuras mudanças da authority `RideLifecycleStatus`.

## Ratchet

`src/modules/mobility/__tests__/AdminOpenRideLifecycleAuthorityG99.test.ts`

O teste exige:

- import/uso de `QUERYABLE_OPEN_RIDE_STATUSES`;
- `.in("status", QUERYABLE_OPEN_RIDE_STATUSES)`;
- ausência de `const activeStatuses = [` no query service.
