# G94 — Retire duplicate shared mobility types

Data: 2026-09-12

## Problema

`src/shared/types/mobilidade.ts` preservava um conjunto paralelo de contratos antigos da Mobilidade:

- `DriverPlan = "padrao" | "prioritario"`;
- `Driver.subscription_plan`;
- `Driver.total_earnings`;
- status de corrida antigos/incompletos;
- `RideRequest`, `DriverEarnings` e `DriverStats` duplicados;
- outros shapes que já possuem authorities atuais em `core/mobility` e contratos gerados.

A busca de consumidores ativos mostrou que o arquivo inteiro tinha um único importador: `NeighborRankingPanel`, usando apenas `NeighborRank`.

## Correção

`NeighborRank` foi movido para o próprio `NeighborRankingPanel`, onde é efetivamente usado.

Em seguida, `src/shared/types/mobilidade.ts` foi removido fisicamente.

Não foi criado outro barrel de compatibilidade e não foram mantidos aliases para os contratos antigos.

## Efeito arquitetural

O sistema deixa de expor um segundo contrato concorrente para:

- motorista;
- corrida;
- ganhos;
- estatísticas;
- plano de motorista.

Os fluxos atuais devem usar os contratos de `core/mobility`, read models canônicos e tipos gerados pertinentes.

## Ratchet

Criado:

`src/modules/mobility/__tests__/LegacySharedMobilityTypesG94.test.ts`

O teste exige que o arquivo legado permaneça ausente e que `NeighborRank` continue local ao consumidor real.

## Rollout

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece inalterado.

Nenhuma migration, RLS ou Edge Function foi alterada neste checkpoint.
