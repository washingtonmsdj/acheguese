# G134 — Order Delivery Tracking Boundary

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

A integracao gastronomia ↔ entrega ainda usava readers genericos de `ride_requests`:

- `getLatestRideBySource()` carregava `select("*")` para obter a entrega do pedido;
- `syncRideStatusToOrder()` usava `MobilityService.getRideById()`;
- `useOrderTracking` tipava esse payload cru como `RideRequest` completo;
- `OrderTrackingCard` esperava campos que a query nao populava (`driver_profile`, `estimated_duration`, `destination_address` derivado);
- apenas existir `driver_profile_id` era suficiente para montar tracking, inclusive em `driver_assigned` pre-aceite.

## Correcao

Foi criado `OrderDeliveryLinkReadService` com projecao explicita apenas para:

- identidade/status do ride;
- vinculacao source/order;
- participantes necessarios a sincronizacao;
- snapshots de origem/destino e coordenadas;
- prova e valores necessarios a fechamento/snapshot financeiro;
- `created_at` para selecionar o vinculo mais recente.

Foram removidos dessa fronteira:

- contato de destinatario;
- notas/pacote;
- metadata de failed delivery;
- outros campos nao usados do ride.

`OrderDeliveryLinkService` agora usa exclusivamente esse read model para:

- buscar entrega por order;
- resolver order por ride;
- sincronizar status;
- persistir snapshot financeiro.

`useOrderTracking` passou a usar o snapshot dedicado e `isOpenRideStatus`.

`OrderTrackingCard`:

- nao depende mais de `RideRequest` completo;
- nao apresenta `estimated_duration` ou `driver_profile` que nunca eram preenchidos pela query;
- usa `destination` real do snapshot;
- so monta `RideTrackingMap` quando `isDriverOwnedOpenRideStatus(status)` e verdadeiro;
- em `driver_assigned`, mostra espera por confirmacao sem tentar abrir tracking preciso.

A autoridade server-side de tracking continua sendo a defesa final; G134 corrige tambem a boundary do cliente.

## Ratchet

`src/modules/mobility/__tests__/OrderDeliveryTrackingBoundaryG134.test.ts`

Protege:

- projecao explicita;
- exclusao de PII/metadata nao necessaria;
- ausencia de readers genericos do `MobilityService`;
- lifecycle compartilhado no hook;
- tracking apenas apos aceite operacional;
- ausencia dos campos sinteticos antigos.

## Validacao

Sources foram inspecionados e o ratchet foi versionado. Este checkpoint **nao declara suite/CI verde** sem execucao confiavel.