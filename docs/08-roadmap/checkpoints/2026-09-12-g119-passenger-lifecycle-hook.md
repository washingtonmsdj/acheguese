# G119 — Passenger Lifecycle Hook

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`useMobilidade` mantinha três listas locais de status (`ACTIVE_RIDE_STATUSES`, `PENDING_RIDE_STATUSES`, `ONGOING_RIDE_STATUSES`) que já divergiam da state machine compartilhada.

Além disso, quando um refetch não encontrava mais corrida aberta, `activeRide` podia permanecer apontando para estado antigo.

## Correção

O hook passou a usar exclusivamente os classifiers de `RideLifecycleStatus.ts`:

- `isOpenRideStatus` para `activeRide`;
- `isPreAcceptRideStatus` para `pendingRides`;
- `isDriverOwnedOpenRideStatus` para `activeRides` operacionais do motorista.

As três listas locais foram removidas.

Na query principal, `activeRide` agora é sempre reconciliado com o resultado atual, inclusive para `null`.

No realtime, uma corrida recarregada só permanece em `activeRide` enquanto `isOpenRideStatus(nextRide.status)` for verdadeiro.

## Ratchet

`src/modules/mobility/__tests__/PassengerLifecycleHookG119.test.ts`

Protege:

- ausência das três listas locais;
- uso dos classifiers canônicos;
- limpeza de estado ativo obsoleto.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
