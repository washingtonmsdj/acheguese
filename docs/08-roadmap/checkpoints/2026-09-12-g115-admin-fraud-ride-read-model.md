# G115 — Admin Fraud Ride Read Model

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`FraudDetectionPanel` derivava corretamente `rideIds` dos alertas, mas não os usava para ler as corridas.

O código chamava:

`adminMobilityService.getUserRides(driverProfileIds[0] || "")`

O contrato desse método recebia `userId`, não `driverProfileId`. Além disso:

- somente o primeiro motorista seria consultado;
- alertas de outros motoristas/corridas poderiam ficar sem contexto;
- a leitura administrativa de corridas usava `select("*")`;
- o painel comparava status de alerta pendente com a constante de status de corrida.

## Correção

`AdminFraudService` ganhou `getRideSummaries(rideIds)`.

A leitura:

- recebe IDs explícitos de corridas presentes nos alertas;
- deduplica os IDs;
- retorna vazio quando não há IDs;
- consulta `ride_requests` por `.in("id", uniqueRideIds)`;
- projeta somente `id, origin, destination`.

`FraudDetectionPanel` agora executa em lote:

- `AdminFraudService.getRideSummaries(rideIds)`;
- `profileService.getProfilesSummary(driverProfileIds)`.

O mapa de corridas é montado pelo próprio `ride.id`, eliminando a confusão entre user/profile/ride IDs.

## Projection de alertas

`AdminFraudService.getAlerts()` também deixou de fazer `select("*")` e lê apenas:

- `id`;
- `ride_id`;
- `driver_profile_id`;
- `status`;
- `severity`;
- `fraud_type`;
- `description`;
- `evidence`;
- `created_at`.

As contagens administrativas usam `select("id", { count: "exact", head: true })`, sem payload de linhas desnecessário.

## Status authority

A ação de revisão do alerta usa `ALERT_STATUS.PENDING`. A constante `RIDE_STATUS.PENDING` não é mais usada para classificar estado de fraude.

## Ratchet

`src/modules/mobility/__tests__/AdminFraudRideReadModelG115.test.ts`

Protege:

- projection mínima de fraude;
- leitura de corrida por `rideIds` explícitos;
- ausência de `adminMobilityService.getUserRides` no painel de fraude;
- ausência do atalho `driverProfileIds[0]`;
- uso de `ALERT_STATUS.PENDING`.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
