# MOTOBOY — Extensão Oficial da Mobilidade

**Data:** 07/04/2026  
**Status:** ✅ Implementado

---

## Importante

O fluxo deste documento pertence ao runtime de `mobility` e representa dispatch/plataforma de motoboy.

Ele **não é** o SSOT de pedido/logística de `merchant_own_fleet`.

Para pedido com pagamento direto ao merchant e frota propria do estabelecimento, o modulo correto e `src/modules/mobility/delivery`.

---
## 1. MODELAGEM

Motoboy **não é módulo separado**. É uma extensão da tabela `ride_requests` via campo `ride_mode`.

```
ride_requests
  ride_mode: 'ride' | 'motoboy'          ← diferencia corrida de entrega
  source_type: 'passenger' | 'business' | 'gastronomy' | 'service'
  source_id: UUID                         ← ID da empresa/restaurante/serviço
  recipient_name: TEXT
  recipient_phone: TEXT
  delivery_notes: TEXT
  package_description: TEXT
  package_size: 'small' | 'medium' | 'large'
  proof_of_delivery: JSONB                ← { photo_url, code, observation, signed_at }
  pickup_confirmed_at: TIMESTAMPTZ
  delivered_at: TIMESTAMPTZ
  failed_delivery_at: TIMESTAMPTZ
  failed_delivery_reason: TEXT

driver_data
  can_do_delivery: BOOLEAN DEFAULT true   ← habilita motorista para entregas
```

Migração: `src/modules/mobility/migrations/add_motoboy_fields.sql`

---

## 2. FLUXO OPERACIONAL

```
REQUESTED
  → SEARCHING_DRIVER       (dispatch automático — mesmo motor de corrida)
  → DRIVER_ASSIGNED        (motoboy atribuído)
  → DRIVER_ACCEPTED        (motoboy confirmou)
  → DRIVER_ARRIVING        (motoboy a caminho do ponto de coleta)
  → PICKUP_CONFIRMED       (motoboy coletou o pacote)  ← novo
  → IN_DELIVERY            (em rota de entrega)         ← novo
  → DELIVERED              (entregue com sucesso)       ← novo
  → COMPLETED              (fluxo encerrado)

Falha:
  IN_DELIVERY → FAILED_DELIVERY → FAILED | CANCELLED_BY_DRIVER
```

Estados de cancelamento e expiração: idênticos ao fluxo de corrida.

---

## 3. PRICING

Modo: `'motoboy'` no `PricingService`.

Regra fallback:
- Base: R$ 3,50
- Por km: R$ 1,80
- Por minuto: R$ 0,30
- Mínimo: R$ 6,00

Regra oficial configurável via painel admin em `pricing_rules` (mode = 'motoboy').

O `useDelivery` calcula automaticamente via `pricingService.calculateEstimate({ mode: 'motoboy', ... })` antes de criar a entrega. Se o pricing falhar, a entrega é criada sem preço sugerido (fallback seguro).

---

## 4. DISPATCH

Reutiliza 100% o `AutoDispatchService` e `RideDispatchService`.

Diferença: `findEligibleDrivers` filtra `driver_data.can_do_delivery = true` quando `rideMode = 'motoboy'`.

Timeout, retry e auditoria: idênticos ao fluxo de corrida.

---

## 5. INTEGRAÇÃO COM EMPRESAS / GASTRONOMIA / SERVIÇOS

```typescript
// Em qualquer módulo externo:
import { useMotoboy } from "@/modules/mobility";

// Gastronomia
const motoboy = useMotoboy({ sourceType: 'gastronomy', sourceId: restaurantId });

// Empresa
const motoboy = useMotoboy({ sourceType: 'business', sourceId: businessId });

// Serviço
const motoboy = useMotoboy({ sourceType: 'service', sourceId: serviceId });

// Solicitar entrega
await motoboy.requestDelivery({
  pickupAddressId, dropoffAddressId, pickupLocationId,
  originLat, originLng, destinationLat, destinationLng,
  recipientName: 'João Silva',
  packageSize: 'medium',
  sourceType: 'gastronomy',
  sourceId: restaurantId,
});
```

O modal `CreateDeliveryModal` aceita `defaultPickup` pré-preenchido (endereço do estabelecimento).

---

## 6. ARQUIVOS CRIADOS / ALTERADOS

### Criados
- `migrations/add_motoboy_fields.sql` — campos na ride_requests e driver_data
- `hooks/useDelivery.ts` — hook principal de entrega
- `hooks/useMotoboy.ts` — entrypoint público para módulos externos
- `components/CreateDeliveryModal.tsx` — modal de solicitação
- `components/DeliveryTrackingCard.tsx` — acompanhamento da entrega
- `components/driver/MotoboyDeliveryActions.tsx` — ações do motoboy

### Alterados
- `constants/index.ts` — RIDE_STATUS (novos estados), RIDE_MODE, SOURCE_TYPE, PACKAGE_SIZE
- `core/RideStateMachine.ts` — novos estados e transições de motoboy
- `core/RideOperationalService.ts` — createDelivery, confirmPickup, startDelivery, confirmDelivery, failDelivery
- `core/RideDispatchService.ts` — filtro can_do_delivery, estados ativos de motoboy
- `index.ts` — exports públicos

---

## 7. PENDÊNCIAS REAIS

1. **SQL não executado** — `add_motoboy_fields.sql` precisa ser rodado no banco Supabase.

2. **AddressSelector no modal** — `CreateDeliveryModal` tem placeholder para seleção de endereço de destino. Precisa integrar com o componente de endereço existente (mesmo padrão do `CreateRideModal`).

3. **Dashboard do motorista** — `MotoboyDeliveryActions` precisa ser integrado ao `MotoristaPage` / `MotoristaPageV2` quando `ride.ride_mode === 'motoboy'`.

4. **Histórico de entregas** — `DeliveryTrackingCard` pode ser usado em uma aba de histórico. Não há página dedicada ainda.

5. **Upload de foto** — `proof_of_delivery.photo_url` está na estrutura mas o upload de imagem não foi implementado. Pode usar o serviço de storage existente.

6. **Regra de pricing no banco** — Inserir regra `motoboy` ativa em `pricing_rules` via painel admin.

7. **Notificação push** — Motoboy recebe oferta via realtime (mesmo canal do motorista). Notificação push específica para entrega pode ser adicionada.

---

## 8. VEREDITO

- ✅ Motoboy dentro da mobilidade (sem módulo separado)
- ✅ Empresas/gastronomia/serviços originam via `useMotoboy`
- ✅ Dispatch reutiliza motor existente (filtro can_do_delivery)
- ✅ Pricing integrado (modo 'motoboy' já existia no PricingService)
- ✅ State machine estendida sem quebrar fluxo de corrida
- ✅ Coleta e entrega com confirmação e prova
- ✅ Auditoria completa (ride_state_audit)
- ⚠️ SQL pendente de execução
- ⚠️ AddressSelector no modal pendente de integração
- ⚠️ Dashboard do motorista pendente de integração do MotoboyDeliveryActions

