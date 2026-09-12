# G132 — Bounded Operational Ride Contexts

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Varios caminhos operacionais usavam o reader generico `getRideById()`/`select("*")` para decisoes que precisavam de poucos campos:

- aceite do motorista;
- intervencao administrativa de motoboy;
- confirmar coleta/iniciar entrega/confirmar entrega/falhar entrega;
- resolver failed delivery;
- read-back idempotente de handoff apos possivel commit.

Isso misturava payload de UI, PII e dados financeiros com autoridade de lifecycle/custodia.

## Correcao

Foi criado `RideOperationalContextReadService` com dois contratos explicitos:

### Lifecycle

- `id`;
- `status`;
- `passenger_profile_id`;
- `driver_profile_id`;
- `ride_mode`.

### Failed delivery

O mesmo lifecycle + `failed_delivery_metadata`.

Foram migrados para essa fronteira:

- `RideDispatchService`;
- `RideDeliveryOperationalActions`;
- `FailedDeliveryHandoffService`;
- `AdminMotoboyOperationsService`.

Nenhum desses caminhos precisa mais carregar rota, telefone, destinatario, prova, notas ou valores para tomar decisoes de lifecycle.

## Residual explicitamente separado

`RideOperationalService` ainda possui chamadas ao reader generico em seu orquestrador de transicoes/cancelamento/completude. Esse corte e propositalmente separado como proximo gate (G133), por ser uma authority critica e exigir validacao isolada.

Readers de UI/readback tambem nao fazem parte do G132.

## Ratchet

`src/modules/mobility/__tests__/RideOperationalContextBoundaryG132.test.ts`

Protege:

- projecao lifecycle minima;
- metadata de falha apenas no caminho dedicado;
- ausencia de `select("*")` no novo reader;
- ausencia de rota/contato/prova/preco na fronteira operacional;
- uso do reader por dispatch, delivery, handoff e admin.

## Validacao

Sources foram inspecionados e o ratchet foi versionado. Este checkpoint **nao declara suite/CI verde** sem execucao confiavel.