# G136 — Source-linked Ride Pricing Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A integração gastronomia → mobilidade ainda usava `MobilityService.getLatestRideBySource()` sobre `ride_requests` com um read model mais amplo do que o cálculo financeiro exigia.

O único consumidor ativo, `OrderService.enrichDeliveryFinancials()`, precisa somente do preço final da corrida e, como fallback, do preço sugerido. Identidade da corrida, lifecycle, participantes, rota e metadados não pertencem a esse boundary financeiro.

## Correção

`MobilityService.getLatestRideBySource(sourceType, sourceId)` agora:

- mantém `source_type` e `source_id` somente como predicados da query;
- mantém `created_at` somente como critério de ordenação no banco;
- retorna apenas `final_price` e `suggested_price`;
- não usa `select("*")`;
- não transporta lifecycle, identidade, rota, participantes ou dados de entrega para o consumidor financeiro.

O método continua temporariamente na classe estática de compatibilidade porque existe um consumidor ativo em Gastronomia; a mudança não cria uma segunda authority de preço.

## Ratchet

`src/modules/mobility/__tests__/SourceLinkedRidePricingBoundaryG136.test.ts`

Protege:

- projeção limitada a `final_price, suggested_price`;
- ausência de `select("*")` no método;
- ausência de campos de participante/rota no contrato;
- uso do lookup limitado pelo `OrderService` sem regressão para `getRideById()` genérico.

## Commits

- `0fb9154c` — primeiro estreitamento do lookup source-linked;
- `f021dbd8` — minimização definitiva do snapshot financeiro;
- `ddd5bbef` — ratchet do boundary.

## Validação

Source e diffs foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
