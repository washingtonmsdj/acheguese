# G145 — Driver Activity Read Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`DriverActivityStatsService` ainda dependia de `MobilityService.getDriverRideSessions()`, mantendo a classe estática de compatibilidade como dona indireta de uma leitura usada por um único read model.

A leitura já era estreita, mas o ownership estava errado e perpetuava a duplicação estrutural da classe estática.

## Correção

A leitura de sessões concluídas foi movida para `DriverActivityStatsService`:

- projeção `started_at, completed_at`;
- escopo por `driver_profile_id`;
- somente sessões com início e conclusão presentes;
- ordenação por `completed_at` decrescente;
- janela bounded em `DRIVER_ACTIVITY_SESSION_LIMIT = 300`.

A presença operacional continua vindo exclusivamente de `DriverAvailabilityService` / `driver_availability`.

`MobilityService.getDriverRideSessions()` foi removido da classe estática de compatibilidade.

## Ratchet

`src/modules/mobility/__tests__/DriverActivityReadOwnershipG145.test.ts`

Protege:

- ownership da query no serviço de atividade;
- projeção mínima e janela bounded;
- ausência de wildcard;
- presença fora de `driver_data`;
- ausência do antigo método estático.

## Commits

- `58718c56` — ownership da leitura em `DriverActivityStatsService`;
- `574c470e` — aposentadoria do reader estático;
- `2cb7d3fc` — ratchet.

## Validação

Consumidores foram mapeados antes da remoção. Este checkpoint não declara suite/CI verde sem execução confiável.
