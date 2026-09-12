# G116 — Suspended Driver Metrics

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`ReputationBanishments` carregava todos os perfis suspensos e, para cada um, executava `adminMobilityService.getUserRides(user.id)`.

Havia três defeitos simultâneos:

1. N+1 de consultas de corridas;
2. o retorno de `getUserRides()` é um array, mas o componente o convertia por cast para `{ cancellation_rate }`, fazendo a taxa tender a `0%` sem authority real;
3. a seção se chamava “Motoristas Suspensos”, embora a lista base pudesse conter perfis suspensos que não pertenciam ao domínio de motorista.

## Correção

Foi criado `AdminSuspendedDriverMetricsService`.

A fronteira:

- recebe os `profiles.id` suspensos;
- deduplica os IDs;
- consulta `driver_data` apenas por `profile_id` para identificar quais perfis realmente são motoristas;
- carrega `AdminDriverLifecycleMetricsService` uma única vez para o conjunto resultante;
- devolve apenas métricas de perfis do domínio motorista.

`ReputationBanishments` agora:

- busca perfis suspensos e usuários de baixo rating em paralelo;
- faz uma única carga de métricas de motorista em lote;
- exclui perfis suspensos sem `driver_data` da seção de motoristas;
- exibe `driverCancellationRate` calculado pelo lifecycle G97.

## Readers genéricos aposentados

Depois de G115/G116, os métodos administrativos genéricos ficaram sem consumidores e foram removidos:

- `AdminMobilityService.getRecentRides()`;
- `AdminMobilityService.getUserRides()`;
- `MobilityAdminQueryService.getRecentRides()`;
- `MobilityAdminQueryService.getUserRides()`.

Com isso, saíram também os dois caminhos administrativos restantes que faziam `ride_requests.select("*")`.

O tipo público `RawRide` não foi removido neste gate porque ainda é reexportado por contratos legados; sua aposentadoria exige auditoria de API/reexports separada.

## Ratchet

`src/modules/mobility/__tests__/AdminSuspendedDriverMetricsG116.test.ts`

Protege:

- interseção de perfis suspensos com `driver_data`;
- carga em lote pelo lifecycle G97;
- ausência do cast de array para `cancellation_rate`;
- ausência de N+1 no componente;
- aposentadoria dos readers administrativos genéricos;
- ausência de `select("*")` no `MobilityAdminQueryService` atual.

## Validação

Source/diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
