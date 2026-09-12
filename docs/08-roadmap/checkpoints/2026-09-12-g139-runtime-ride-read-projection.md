# G139 — Runtime Ride Read Projection

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

`MobilityRuntimeService` ainda mantinha duas leituras amplas de `ride_requests`:

- `getRideById()` com `select("*")`;
- `getUserRides()` com `select("*")`.

Isso duplicava a projeção já corrigida no G138 e permitia divergência entre `mobility.queries` e o singleton runtime.

## Correção

Os dois métodos passaram a reutilizar o boundary compartilhado `RideRequestReadModel`:

- `RIDE_REQUEST_READ_SELECT` define a projeção;
- `RideRequestReadRow` tipa o payload do banco;
- `toRideRequestReadModel()` converte para o contrato `RideRequest`.

Nenhuma lista local paralela de campos foi criada no runtime.

`getRideWithAddresses()` permanece fora deste gate porque possui relações adicionais de endereço/localização e requer uma projeção específica; ele será tratado separadamente.

## Ratchet

`src/modules/mobility/__tests__/RuntimeRideReadProjectionG139.test.ts`

Protege:

- uso do read model compartilhado em `getRideById()`;
- uso do mesmo boundary em `getUserRides()`;
- ausência de `select("*")` nesses métodos;
- ausência de uma segunda constante de projeção no runtime.

## Commits

- `3ff35987` — cutover do runtime para o boundary compartilhado;
- `9db28a16` — ratchet.

## Validação

Source e diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
