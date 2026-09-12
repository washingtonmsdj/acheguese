# G118 — Unified Ride History Lifecycle

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`RideHistoryUnified` ainda considerava histórico somente:

- `completed`;
- o literal legado `cancelled`.

Isso ocultava estados fechados válidos como `cancelled_by_driver`, `cancelled_by_passenger`, `failed` e `expired`.

A tela também usava `suggested_price` como fallback de gasto/valor final quando não havia `final_price`, misturando estimativa com valor realizado.

## Correção

O componente passou a:

- usar `isClosedRideStatus` na boundary do histórico;
- usar `isCancelledRideStatus` na categoria visual/filtro de cancelamentos;
- usar `StatusBadge` como presentation authority de status;
- aceitar no modo “Todos” todo lifecycle fechado suportado;
- usar somente `final_price` para gasto realizado;
- exibir `—` quando não há valor final em vez de promover estimate;
- calcular `Total Gasto` somente sobre corridas `completed`;
- aplicar o filtro de valor sobre `final_price`.

O texto de estado vazio foi ajustado de “concluídas” para “encerradas”, refletindo que histórico inclui outros terminais além de sucesso.

## Ratchet

`src/modules/mobility/__tests__/RideHistoryUnifiedLifecycleG118.test.ts`

Protege:

- boundary fechada canônica;
- classifier canônico de cancelamentos;
- presentation via `StatusBadge`;
- ausência de fallback `suggested_price` como valor realizado;
- filtro “cancelled” como categoria.

## Validação

Source/diff foi inspecionado e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
