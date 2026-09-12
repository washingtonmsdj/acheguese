# G144 — Boarding Point Read Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`BoardingPointService` ainda dependia de `MobilityService.listRecentRidePickupLocations()`, mantendo a classe estática de compatibilidade como dona indireta de uma leitura usada por um único domínio de UI.

Isso preservava acoplamento desnecessário e dificultava evoluir a semântica de pontos de embarque sem tocar no agregado estático de Mobilidade.

## Correção

A leitura narrow das corridas recentes foi movida para `BoardingPointService`:

- projeção somente de `pickup_location_id` + relação `locations` necessária;
- janela bounded pela constante `RECENT_BOARDING_POINT_SAMPLE_LIMIT`;
- nenhum `select("*")`;
- nenhuma presença, participante, rota completa, preço ou payload de entrega é carregado.

`MobilityService.listRecentRidePickupLocations()` foi removido da classe estática de compatibilidade.

## Ratchet

`src/modules/mobility/__tests__/BoardingPointReadOwnershipG144.test.ts`

Protege:

- ownership da query no serviço correto;
- projeção bounded;
- ausência de wildcard;
- ausência do antigo método estático e de sua chamada.

## Commits

- `deb50c64` — ownership da leitura em `BoardingPointService`;
- `11a7ba0b` — aposentadoria do reader estático;
- `2660a77f` — ratchet.

## Validação

Consumidores foram mapeados antes da remoção. Este checkpoint não declara suite/CI verde sem execução confiável.
