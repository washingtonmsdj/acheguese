# G97 — Admin Driver Lifecycle Metrics Authority

Data: 2026-09-12

## Problema corrigido

O painel administrativo de cancelamentos misturava métricas factuais com regras locais sem authority server-side:

- `cancellation_rate` era calculada com denominador incorreto;
- `cancelled` genérico era tratado como cancelamento do motorista;
- a UI inventava "alto risco >25%" e "limite de suspensão 30%";
- `suspension_count` não representava histórico real de suspensões;
- `MobilityAdminQueryService` fabricava `total_earnings: 0`;
- `getDriversWithStats()` fazia leituras N+1 por motorista;
- `DriverCancellationMetrics` ainda buscava `ProfileContext` individualmente por motorista.

## Authority nova

`src/core/admin/services/AdminDriverLifecycleMetricsService.ts`

A leitura administrativa agora é feita em lote e paginada:

- `ride_requests` é lido por `driver_profile_id` em batches;
- `driver_moderation_events` é lido por `driver_profile_id` e `action = suspended`;
- paginação usa ordenação estável por `id`;
- somente `RIDE_STATUS.CANCELLED_BY_DRIVER` é contabilizado como cancelamento atribuível ao motorista;
- taxa = `driverCancelledRideCount / assignedRideCount`;
- histórico de suspensão = número real de eventos `suspended`.

## Agregador administrativo

`AdminMobilityService.getDriversWithStats()` agora compõe em paralelo:

1. perfis resumidos;
2. lifecycle administrativo em lote.

Foram removidos do contrato:

- `total_earnings`;
- `total_rides_accepted`;
- `total_rides_cancelled`;
- `cancellation_rate` genérica;
- `getHighCancellationDrivers(threshold = 25)`.

Entraram os nomes semanticamente explícitos:

- `assigned_ride_count`;
- `driver_cancelled_ride_count`;
- `driver_cancellation_rate`;
- `suspension_count`.

## Query service

`MobilityAdminQueryService` não contém mais:

- `total_earnings: 0`;
- `getDriverRideStatuses()`;
- `countDriverSuspensions()`.

Esses caminhos foram aposentados, não mantidos como fallback.

## UI administrativa

`DriverCancellationMetrics`:

- não usa mais thresholds locais de suspensão;
- não classifica motoristas como "alto risco" por percentual arbitrário;
- mostra somente taxa atribuível ao motorista, suspensões atuais, cancelamentos atribuíveis e histórico real de suspensões;
- usa `AdminDriverModerationService.getModerationRows()` em lote;
- ao reativar, persiste `reactivated` no histórico de moderação.

## Ratchet

`src/modules/mobility/__tests__/AdminDriverLifecycleMetricsAuthorityG97.test.ts`

O teste impede regressão para:

- `cancelled` genérico como culpa do motorista;
- consultas N+1 antigas;
- `total_earnings: 0` fabricado;
- thresholds 25/30;
- `profileService.getProfileContext()` por motorista no painel.

## Validação de infraestrutura

A validação hospedada continua condicionada à disponibilidade dos runners/Vercel. Ausência de execução não é considerada PASS de código.
