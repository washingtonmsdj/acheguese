# G127 — Driver Dashboard Lifecycle Stats

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

O dashboard do motorista tratava `delivered` como estado pagável junto de `completed`, embora G70 feche `delivered -> completed` dentro da mesma transação. Isso podia atribuir valor realizado a um marco transitório que não deve permanecer como encerramento financeiro.

O fallback de `cancelledRides` também contava somente o alias histórico `cancelled`, ignorando cancelamentos canônicos por passageiro e motorista.

## Correção

- `isPayableRide` aceita somente `RIDE_STATE.COMPLETED`;
- o fallback de cancelamentos usa `isCancelledRideStatus`;
- a divergência já documentada de `actual_fare` não foi alterada neste gate.

## Evidência de lifecycle

`supabase/migrations/20260911222000_complete_delivery_in_single_transaction_g70.sql` encerra a confirmação de entrega como `delivered -> completed` antes do comando retornar. `RideLifecycleStatus.ts` também documenta `delivered` como marco transitório não operacional.

## Ratchet

`src/modules/mobility/__tests__/DriverDashboardLifecycleStatsG127.test.ts`

Protege:

- `completed` como único estado pagável no dashboard;
- ausência de `delivered` no predicate de ganho;
- uso do classifier compartilhado de cancelamentos.

## Validação

O diff do source foi inspecionado e contém apenas as mudanças esperadas. O ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
