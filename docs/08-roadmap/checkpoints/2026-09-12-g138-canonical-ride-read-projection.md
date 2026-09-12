# G138 — Canonical Ride Read Projection

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

O reader canônico `mobility.queries.ts` ainda usava `select("*")` para:

- corrida por ID;
- histórico do passageiro;
- corridas ativas do motorista;
- corrida aberta mais recente;
- corridas do usuário ativo.

Além disso, `RideService` e `useRideSearch` faziam casts para `RideRequest`, escondendo a diferença entre linha SQL e contrato de runtime/UI.

## Correção

Foi criado `RideRequestReadModel.ts`, que concentra:

- a projeção SQL mínima necessária para montar o contrato `RideRequest`;
- o tipo `RideRequestReadRow` derivado do schema versionado;
- a adaptação para `toRideRequestContract()` em um único boundary.

`mobility.queries.ts` agora usa essa projeção nos readers de corrida e devolve contratos adaptados para passageiro e corrida ativa. O caminho de motorista mantém o histórico terminal redigido separado, mas as corridas abertas também usam a projeção bounded.

`RideService` deixou de fazer casts em `getRidesByPassenger()` e `getActiveRide()`.

`useRideSearch` também consome `getRideById()` tipado diretamente.

## Segurança / minimização

A projeção compartilhada não inclui payloads específicos de entrega como telefone do destinatário, notas de entrega, prova de entrega, metadata de falha ou descrição do pacote.

## Ratchet

`src/modules/mobility/__tests__/CanonicalRideReadProjectionG138.test.ts`

Protege:

- ausência de `select("*")` em `mobility.queries.ts`;
- uso obrigatório do read model compartilhado;
- ausência de campos sensíveis de entrega na projeção de UI;
- ausência dos casts antigos de passageiro/corrida ativa e busca.

## Commits

- `abe8aae6` — read model bounded compartilhado;
- `0278928e` — cutover dos readers canônicos;
- `3ff63225` — remoção de casts do facade;
- `b8e496ed` — remoção do cast no hook de busca;
- `96e2c66d` — ratchet.

## Validação

Source e diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
