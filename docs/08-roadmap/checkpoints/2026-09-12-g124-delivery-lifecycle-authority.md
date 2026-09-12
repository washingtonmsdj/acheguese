# G124 — Delivery Lifecycle Authority

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`useDelivery` mantinha uma lista local `ACTIVE_DELIVERY_STATES` que duplicava a state machine de Mobilidade. Isso criava risco de divergência quando novos estados fossem adicionados ou normalizados.

No caminho realtime havia ainda um erro funcional: após receber um evento, o hook buscava a corrida novamente e gravava o resultado diretamente em `activeDelivery`. Estados terminais não mapeados explicitamente pelo `useRideRealtime` — por exemplo uma falha de entrega chegando como `state_change` — podiam permanecer marcados como entrega ativa.

## Correção

- removida `ACTIVE_DELIVERY_STATES`;
- carga inicial usa `isOpenRideStatus(r.status)`;
- refetch realtime reconcilia `activeDelivery` com `isOpenRideStatus(updated.status)`;
- qualquer estado fechado limpa o ativo, independentemente do tipo de evento realtime recebido.

A authority de lifecycle continua sendo `RideLifecycleStatus.ts`/`RideStateMachine.ts`.

## Ratchet

`src/modules/mobility/__tests__/DeliveryLifecycleG124.test.ts`

Protege:

- ausência da lista local de estados;
- uso de `isOpenRideStatus` na carga inicial;
- limpeza de entrega terminal após refetch realtime;
- ausência do antigo `setActiveDelivery(updated)` incondicional.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
