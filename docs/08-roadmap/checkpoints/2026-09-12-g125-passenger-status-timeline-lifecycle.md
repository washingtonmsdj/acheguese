# G125 — Passenger Status Timeline Lifecycle

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`StatusTimeline` ainda reconstruía a lifecycle com aliases históricos e apresentava `driver_assigned` como “Motorista Aceitou”. Isso contradizia a state machine atual, na qual `driver_assigned` é apenas atribuição/oferta pré-aceite e `driver_accepted` é a confirmação operacional do motorista.

A timeline também dependia de comparações locais com `pending`, `driver_on_the_way`, `driver_arrived` e `passenger_on_board`.

## Correção

- a progressão visual usa `toCanonicalRideState` e `RIDE_STATE`;
- `driver_assigned` passou a ser “Motorista encontrado · aguardando confirmação”;
- `driver_accepted` ganhou etapa explícita “Motorista confirmou”;
- estados visuais seguintes usam `driver_arriving`, `passenger_boarded`, `in_progress` e `completed` canônicos;
- cancelamento usa `isCancelledRideStatus`;
- `accepted_at` é usado apenas como timestamp de exibição; timestamps não decidem a state machine.

## Ratchet

`src/modules/mobility/__tests__/PassengerStatusTimelineG125.test.ts`

Protege:

- uso do lifecycle canônico;
- ausência das comparações visuais legadas;
- separação entre atribuição e aceite;
- uso do timestamp normalizado de aceite;
- cancelamento via classifier compartilhado.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
