# G147 — Static Mobility Reader Retirement

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`MobilityService.impl.ts` ainda carregava vários readers estáticos duplicados mesmo depois de o projeto já possuir owners funcionais/bounded dedicados.

Isso mantinha duas authorities para as mesmas leituras e criava risco de divergência futura de projeção, lifecycle e autorização.

## Auditoria de consumidores

Foram preservados os métodos com callers ativos comprovados:

- `listMotoboyDeliveries`;
- `listMotoboyStatsRows`;
- `countDeliveredBySource`;
- `countDeliveredMotoboyRides`;
- `ensureDriverDataRow`;
- `getRideById`.

`getRideById` continua temporariamente porque `MotoboyAuthorizationService` ainda o usa, mas o wrapper já delega para `RideOperationalContextReadService.getLifecycle()`.

## Readers aposentados

Foram removidos fisicamente do compatibility service:

- `getRideSourceIdById`;
- `getActiveRideByDriverProfile`;
- `getRideDispatchData`;
- `getDriverDataByProfileIds`;
- `getMobilityStats`;
- `getDriverEarnings`;
- `getCompletedRidePaymentsByDriver`;
- `getPassengerRating`.

As capabilities ativas correspondentes já pertencem a módulos dedicados, incluindo `mobility.queries.ts`, `MobilityServiceDriverQueries.ts`, `DriverEarningsReadService`, `RideRatingService` e `OrderDeliveryLinkReadService`.

Também foram removidos imports e métodos do client tipado que só existiam para sustentar os wrappers aposentados.

## Ratchet

`src/modules/mobility/__tests__/StaticMobilityReaderRetirementG147.test.ts`

Protege:

- ausência dos oito wrappers aposentados;
- permanência dos owners funcionais/dedicados;
- permanência apenas dos compatibility methods com uso atual comprovado;
- ausência dos imports órfãos de earnings/rating/profile.

## Commits

- `b274733b` — remove readers estáticos duplicados e reduz o compatibility surface;
- `26ccaef4` — adiciona ratchet de ownership.

## Validação

Source e diffs foram inspecionados. O ratchet foi versionado, mas este checkpoint **não declara CI/suite verde** sem execução confiável dos runners.
