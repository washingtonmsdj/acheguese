# G141 — Ride State Audit Reader Retirement

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`mobility.ride-read-queries.ts` ainda mantinha `getRideStateAuditEntries()` com `ride_state_audit.select("*")`.

A busca de consumidores mostrou que a função não possuía caller ativo: ela era apenas definida e reexportada por `mobility.queries.ts`.

Manter um reader amplo sem consumidor aumentava superfície de manutenção e permitia reintrodução futura de payload bruto de auditoria sem contrato explícito.

## Correção

Foram removidos:

- `getRideStateAuditEntries()`;
- o tipo local `RideStateAuditRow`;
- o reexport público em `mobility.queries.ts`.

Nenhuma projeção substituta foi criada porque não existe consumidor ativo a justificar uma nova authority.

## Ratchet

`src/modules/mobility/__tests__/RideStateAuditReaderRetirementG141.test.ts`

Protege:

- ausência do reader de `ride_state_audit` nesse serviço;
- ausência do reexport morto em `mobility.queries.ts`.

## Commits

- `7241b435` — remoção do reader amplo morto;
- `1f7b3a10` — remoção do reexport;
- `3e554c21` — ratchet.

## Validação

Source e usos foram inspecionados. Este checkpoint não declara suite/CI verde sem execução confiável.
