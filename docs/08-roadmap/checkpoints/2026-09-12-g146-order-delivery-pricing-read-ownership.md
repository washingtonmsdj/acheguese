# G146 — Order Delivery Pricing Read Ownership

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A integração gastronomia → mobilidade já tinha um reader dedicado para o vínculo pedido/entrega (`OrderDeliveryLinkReadService`), mas o enriquecimento financeiro de `OrderService` ainda dependia de um compatibility reader estático em `MobilityService.impl.ts`.

O primeiro corte do G146 removeu essa dependência, porém reutilizou `getLatestByOrderId()`, cujo payload contém rota, participantes, prova de entrega e outros campos desnecessários para calcular somente custo do courier/margem.

Isso centralizava ownership, mas regredia minimização de dados.

## Correção final

`OrderDeliveryLinkReadService` passou a expor:

`getLatestPricingByOrderId(orderId)`

com projeção estrita:

- `final_price`;
- `suggested_price`.

`OrderService.enrichDeliveryFinancials()` usa exclusivamente esse método para o snapshot de preço da entrega.

O compatibility reader antigo:

`MobilityService.getLatestRideBySource(sourceType, sourceId)`

foi removido fisicamente de `MobilityService.impl.ts`, junto com `SourceLinkedRidePricingRow`.

A leitura completa `getLatestByOrderId()` continua existindo apenas para consumidores que realmente precisam do read model do vínculo pedido/entrega.

## Ratchet

O ratchet existente:

`src/modules/mobility/__tests__/SourceLinkedRidePricingBoundaryG136.test.ts`

foi atualizado para a nova ownership e agora exige:

- ausência de `getLatestRideBySource` no compatibility service;
- ausência de `SourceLinkedRidePricingRow`;
- `getLatestPricingByOrderId()` com somente `final_price, suggested_price`;
- ausência de PII/rota/proof no método pricing-only;
- `OrderService` consumindo o método pricing-only e não o reader completo.

## Commits principais

- `d52e3ab1` — adiciona read pricing-only no bounded context de delivery;
- `44842427` — migra `OrderService` para o read mínimo;
- `63bd52bc` — aposenta o compatibility reader estático;
- `a8b3e0c8` — atualiza o ratchet de boundary.

## Validação

Os diffs/source foram inspecionados e o contrato foi protegido por ratchet versionado.

Este checkpoint **não declara suite/CI verde** sem execução confiável dos runners.
