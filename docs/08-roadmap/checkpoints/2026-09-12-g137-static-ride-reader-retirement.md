# G137 — Static Ride Reader Retirement

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`MobilityService.impl.ts` ainda mantinha duas leituras estáticas duplicadas de `ride_requests`:

- `getRidesByPassenger()`;
- `getActiveRide()`.

Ambas usavam `select("*")`, embora os fluxos ativos já possuam a boundary canônica `mobility.queries.ts` consumida por `RideService.impl.ts`.

Manter as duas implementações criava authorities paralelas e permitia que a classe de compatibilidade voltasse a transportar a linha completa de corrida.

## Correção

Os dois métodos foram removidos da classe estática `MobilityService`.

Também foi removida de `MobilityService.impl.ts` a dependência de `QUERYABLE_OPEN_RIDE_STATUSES`, que existia somente para o reader estático aposentado.

O caminho ativo permanece:

`RideService` → `mobility.queries` → read boundary de corrida.

Nenhum consumidor foi redirecionado para um reader novo e nenhuma funcionalidade válida foi removida.

## Ratchet

`src/modules/mobility/__tests__/StaticRideReaderRetirementG137.test.ts`

Protege:

- ausência dos dois readers estáticos duplicados;
- ausência da antiga classificação de lifecycle dentro da classe estática;
- permanência do facade canônico sobre `mobility.queries`;
- não retorno do `select("*")` estático para passageiro/corrida ativa.

## Commits

- `911991ec` — aposentadoria dos readers duplicados;
- `d27d61a2` — restauração de alteração colateral, mantendo o corte cirúrgico;
- `5e761f45` — ratchet.

## Validação

Source e diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
