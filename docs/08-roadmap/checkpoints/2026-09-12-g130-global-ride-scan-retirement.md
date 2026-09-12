# G130 — Global Ride Scan Retirement

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A Mobilidade ainda preservava dois readers genéricos perigosos:

- `getAllRideRequests()` carregava toda `ride_requests` com `select("*")`;
- `getActiveRides()` carregava todas as corridas abertas também com `select("*")`.

O primeiro só era usado por um script de manutenção que queria validar disponibilidade da tabela e contar uma pequena amostra de corridas em pré-aceite. O segundo não possuía consumidor runtime real, mas continuava exposto no facade e duplicado na classe estática legada.

Isso ampliava payload, PII potencial e custo sem necessidade.

## Correção

Foram removidos `getAllRideRequests` e `getActiveRides` de:

- `mobility.queries.ts`;
- `MobilityService.ts` / `MobilityFacade`;
- `MobilityService.impl.ts`.

O script `tools/maintenance/validate-mobility-dispatch.ts` agora:

- testa `ride_requests` com projeção mínima `id` + `limit(1)`;
- consulta apenas `id, status, created_at` para uma amostra limitada de corridas pré-aceite;
- usa `QUERYABLE_PRE_ACCEPT_RIDE_STATUSES` em vez de array local;
- limita a amostra operacional a 50 registros;
- lê disponibilidade somente de `driver_availability`.

## Ratchet

`src/modules/mobility/__tests__/GlobalRideScanRetirementG130.test.ts`

Protege:

- ausência dos dois readers genéricos no facade/query/impl;
- ausência de `select("*")` no script de validação;
- uso da authority de lifecycle pré-aceite;
- leitura de presença pela authority `driver_availability`.

## Validação

Os sources atuais do default branch foram reabertos após os writes e o ratchet foi versionado. Este checkpoint **não declara suite/CI verde** sem execução confiável.