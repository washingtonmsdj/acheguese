# MOTOBOY â€” ExtensÃ£o Oficial da Mobilidade

**Data:** 07/04/2026  
**Status:** âœ… Implementado

---

## Importante

O fluxo deste documento pertence ao runtime de `mobility` e representa dispatch/plataforma de motoboy.

Ele **nÃ£o Ã©** o SSOT de pedido/logÃ­stica de `merchant_own_fleet`.

Para pedido com pagamento direto ao merchant e frota propria do estabelecimento, o modulo correto e `src/modules/mobility/delivery`.

---
## 1. MODELAGEM

Motoboy **nÃ£o Ã© mÃ³dulo separado**. Ã‰ uma extensÃ£o da tabela `ride_requests` via campo `ride_mode`.

```
ride_requests
  ride_mode: 'ride' | 'motoboy'          â† diferencia corrida de entrega
  source_type: 'passenger' | 'business' | 'gastronomy' | 'service'
  source_id: UUID                         â† ID da empresa/restaurante/serviÃ§o
  recipient_name: TEXT
  recipient_phone: TEXT
  delivery_notes: TEXT
  package_description: TEXT
  package_size: 'small' | 'medium' | 'large'
  proof_of_delivery: JSONB                â† { photo_url, code, observation, signed_at }
  pickup_confirmed_at: TIMESTAMPTZ
  delivered_at: TIMESTAMPTZ
  failed_delivery_at: TIMESTAMPTZ
  failed_delivery_reason: TEXT

driver_data
  can_do_delivery: BOOLEAN DEFAULT true   â† habilita motorista para entregas
```

MigraÃ§Ã£o: `src/modules/mobility/migrations/add_motoboy_fields.sql`

---

## 2. FLUXO OPERACIONAL

```
REQUESTED
  â†’ SEARCHING_DRIVER       (dispatch automÃ¡tico â€” mesmo motor de corrida)
  â†’ DRIVER_ASSIGNED        (motoboy atribuÃ­do)
  â†’ DRIVER_ACCEPTED        (motoboy confirmou)
  â†’ DRIVER_ARRIVING        (motoboy a caminho do ponto de coleta)
  â†’ PICKUP_CONFIRMED       (motoboy coletou o pacote)  â† novo
  â†’ IN_DELIVERY            (em rota de entrega)         â† novo
  â†’ DELIVERED              (entregue com sucesso)       â† novo
  â†’ COMPLETED              (fluxo encerrado)

Falha:
  IN_DELIVERY â†’ FAILED_DELIVERY â†’ FAILED | CANCELLED_BY_DRIVER
```

Estados de cancelamento e expiraÃ§Ã£o: idÃªnticos ao fluxo de corrida.

---

## 3. PRICING

Modo: `'motoboy'` no `PricingService`.

Regra fallback:
- Base: R$ 3,50
- Por km: R$ 1,80
- Por minuto: R$ 0,30
- MÃ­nimo: R$ 6,00

Regra oficial configurÃ¡vel via painel admin em `pricing_rules` (mode = 'motoboy').

O `useDelivery` calcula automaticamente via `pricingService.calculateEstimate({ mode: 'motoboy', ... })` antes de criar a entrega. Se o pricing falhar, a entrega Ã© criada sem preÃ§o sugerido (fallback seguro).

---

## 4. DISPATCH

Reutiliza 100% o `AutoDispatchService` e `RideDispatchService`.

DiferenÃ§a: `findEligibleDrivers` filtra `driver_data.can_do_delivery = true` quando `rideMode = 'motoboy'`.

Timeout, retry e auditoria: idÃªnticos ao fluxo de corrida.

---

## 5. INTEGRAÃ‡ÃƒO COM EMPRESAS / GASTRONOMIA / SERVIÃ‡OS

```typescript
// Em qualquer mÃ³dulo externo:
import { useMotoboy } from "@/modules/mobility";

// Gastronomia
const motoboy = useMotoboy({ sourceType: 'gastronomy', sourceId: restaurantId });

// Empresa
const motoboy = useMotoboy({ sourceType: 'business', sourceId: businessId });

// ServiÃ§o
const motoboy = useMotoboy({ sourceType: 'service', sourceId: serviceId });

// Solicitar entrega
await motoboy.requestDelivery({
  pickupAddressId, dropoffAddressId, pickupLocationId,
  originLat, originLng, destinationLat, destinationLng,
  recipientName: 'JoÃ£o Silva',
  packageSize: 'medium',
  sourceType: 'gastronomy',
  sourceId: restaurantId,
});
```

O modal `CreateDeliveryModal` aceita `defaultPickup` prÃ©-preenchido (endereÃ§o do estabelecimento).

---

## 6. ARQUIVOS CRIADOS / ALTERADOS

### Criados
- `migrations/add_motoboy_fields.sql` â€” campos na ride_requests e driver_data
- `hooks/useDelivery.ts` â€” hook principal de entrega
- `hooks/useMotoboy.ts` â€” entrypoint pÃºblico para mÃ³dulos externos
- `components/CreateDeliveryModal.tsx` â€” modal de solicitaÃ§Ã£o
- `components/DeliveryTrackingCard.tsx` â€” acompanhamento da entrega
- `components/driver/MotoboyDeliveryActions.tsx` â€” aÃ§Ãµes do motoboy

### Alterados
- `constants/index.ts` â€” RIDE_STATUS (novos estados), RIDE_MODE, SOURCE_TYPE, PACKAGE_SIZE
- `core/RideStateMachine.ts` â€” novos estados e transiÃ§Ãµes de motoboy
- `core/RideOperationalService.ts` â€” createDelivery, confirmPickup, startDelivery, confirmDelivery, failDelivery
- `core/RideDispatchService.ts` â€” filtro can_do_delivery, estados ativos de motoboy
- `index.ts` â€” exports pÃºblicos

---

## 7. PENDÃŠNCIAS REAIS

1. **SQL nÃ£o executado** â€” `add_motoboy_fields.sql` precisa ser rodado no banco Supabase.

2. **AddressSelector no modal** â€” `CreateDeliveryModal` tem placeholder para seleÃ§Ã£o de endereÃ§o de destino. Precisa integrar com o componente de endereÃ§o existente (mesmo padrÃ£o do `CreateRideModal`).

3. **Dashboard do motorista** â€” `MotoboyDeliveryActions` precisa ser integrado ao `MotoristaPage` / `MotoristaPage` quando `ride.ride_mode === 'motoboy'`.

4. **HistÃ³rico de entregas** â€” `DeliveryTrackingCard` pode ser usado em uma aba de histÃ³rico. NÃ£o hÃ¡ pÃ¡gina dedicada ainda.

5. **Upload de foto** â€” `proof_of_delivery.photo_url` estÃ¡ na estrutura mas o upload de imagem nÃ£o foi implementado. Pode usar o serviÃ§o de storage existente.

6. **Regra de pricing no banco** â€” Inserir regra `motoboy` ativa em `pricing_rules` via painel admin.

7. **NotificaÃ§Ã£o push** â€” Motoboy recebe oferta via realtime (mesmo canal do motorista). NotificaÃ§Ã£o push especÃ­fica para entrega pode ser adicionada.

---

## 8. VEREDITO

- âœ… Motoboy dentro da mobilidade (sem mÃ³dulo separado)
- âœ… Empresas/gastronomia/serviÃ§os originam via `useMotoboy`
- âœ… Dispatch reutiliza motor existente (filtro can_do_delivery)
- âœ… Pricing integrado (modo 'motoboy' jÃ¡ existia no PricingService)
- âœ… State machine estendida sem quebrar fluxo de corrida
- âœ… Coleta e entrega com confirmaÃ§Ã£o e prova
- âœ… Auditoria completa (ride_state_audit)
- âš ï¸ SQL pendente de execuÃ§Ã£o
- âš ï¸ AddressSelector no modal pendente de integraÃ§Ã£o
- âš ï¸ Dashboard do motorista pendente de integraÃ§Ã£o do MotoboyDeliveryActions

