# G105 — Admin Mobility Record Counts

Data: 2026-09-12

## Problema

`AdminMobilityService.getMobilityStats()` buscava todos os registros de `driver_data` e todos os registros de `ride_requests` apenas para retornar `drivers.length` e `rides.length`.

Esse padrão aumenta payload, memória e CPU linearmente com a base e não é aceitável para uma superfície administrativa escalável.

## Correção

O admin passou a reutilizar `getMobilityStats()` de `MobilityServiceDriverQueries`, importado como `getMobilityRecordCounts`.

A authority já existente usa contagens sem payload:

```ts
.select("id", { count: "exact", head: true })
```

para `driver_data` e `ride_requests`.

Nenhuma linha de motorista/corrida é transferida ao navegador apenas para contagem.

## Ratchet

`src/modules/mobility/__tests__/AdminMobilityRecordCountsG105.test.ts`

O teste impede que `AdminMobilityService.getMobilityStats()` volte a usar:

- `getAllRides()`;
- `getDriversRaw()`;
- `.length` sobre datasets globais.

Também exige que a authority de contagem continue usando `count: "exact", head: true`.

## Relação com G104

G105 não substitui o snapshot agregado planejado no G104. Ele elimina imediatamente um full-scan independente que já tinha uma solução canônica disponível e não depende de DDL novo.
