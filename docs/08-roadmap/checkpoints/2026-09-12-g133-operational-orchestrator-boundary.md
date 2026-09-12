# G133 — Operational Orchestrator Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Mesmo apos o G132, o orquestrador central `RideOperationalService` ainda chamava o reader generico `getRideById()` para:

- obter estado antes de uma transicao;
- validar passageiro/motorista em cancelamento;
- validar motorista e estado antes de concluir corrida.

Essas decisoes precisavam apenas do contexto de lifecycle/participantes, mas herdavam o payload completo de `ride_requests`.

## Correcao

`RideOperationalService` passou a usar `RideOperationalContextReadService.getLifecycle()` em seus tres caminhos criticos.

Foram preservados:

- `RideStateMachine.assertCanTransition` como authority local de transicao valida;
- `MobilityRpcService.transitionRideState` e `transitionDeliveryState` como authority de mutacao atomica no backend;
- verificacao operacional/PIN;
- sincronizacao de entrega com pedido;
- comandos especializados de delivery introduzidos nos gates anteriores.

Nenhuma rota, contato, prova, metadata de entrega ou valor financeiro precisa mais ser carregado para decidir transicao/cancelamento/conclusao genericos.

## Ratchet

`src/modules/mobility/__tests__/RideOperationalOrchestratorBoundaryG133.test.ts`

Protege:

- ausencia de `getRideById` no orquestrador;
- uso do contexto lifecycle limitado;
- preservacao da state machine;
- preservacao das RPCs atomicas;
- ausencia de `select("*")` nesse motor.

## Proximo corte

O reader generico continua existindo para readback/UI e alguns servicos especializados, especialmente sincronizacao com pedidos e hooks de UI. Esses usos devem ser separados por read model antes de estreitar ou aposentar `getRideById` globalmente.

## Validacao

Source foi reaberto apos a alteracao e o ratchet foi versionado. Este checkpoint **nao declara suite/CI verde** sem execucao confiavel.