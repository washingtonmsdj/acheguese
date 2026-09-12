# G96 — Canonical ride status schema

Data: 2026-09-12

## Problema

`RideStatusSchema` continuava preso a um subconjunto antigo do ciclo de vida da corrida. O schema aceitava apenas alguns estados básicos e não reconhecia estados hoje válidos no contrato `RIDE_STATUS`, como:

- `requested`;
- `searching_driver`;
- `driver_accepted`;
- `driver_arriving`;
- estados de pickup/entrega;
- `failed_delivery`;
- cancelamentos específicos;
- `expired` e `failed`.

Como `mobilitySchemas.ts` é reexportado pelo módulo público de Mobilidade, esse desalinhamento poderia fazer um consumidor rejeitar um payload operacional válido.

## Correção

`RideStatusSchema` foi alinhado ao conjunto completo atualmente declarado por `RIDE_STATUS`.

Foram incluídos explicitamente todos os estados canônicos de:

- solicitação/busca;
- atribuição/chegada;
- execução de corrida;
- execução de entrega;
- conclusão;
- cancelamento;
- expiração/falha.

`RideRequestSchema` e `MobilidadeFiltersSchema` continuam referenciando `RideStatusSchema`, agora sem manter uma enumeração paralela incompleta.

## Ratchet

Criado:

`src/modules/mobility/__tests__/RideStatusSchemaCanonicalG96.test.ts`

O teste exige a presença de cada membro atual de `RIDE_STATUS` no schema e garante que os schemas de request/filtro continuem vinculados a ele.

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration, RLS ou Edge Function foi alterada neste checkpoint.
