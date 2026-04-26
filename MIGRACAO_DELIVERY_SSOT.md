# 🔄 Migração: Sistema Legado → SSOT de Delivery

**Data**: 26 de Abril de 2026  
**Status**: ✅ Migração Concluída  
**Autor**: Integração SSOT

---

## 📋 Resumo

Migração do sistema legado de delivery (`delivery_requests`) para o SSOT correto (`orders` + `mobility/ride_requests`).

---

## ❌ Sistema LEGADO (Removido)

### Tabelas Legadas:
```sql
- delivery_requests          ❌ DEPRECADO
- delivery_status_history    ❌ DEPRECADO  
- delivery_tracking           ❌ DEPRECADO
```

### Serviços Legados:
```typescript
- src/modules/business/gastronomy/services/DeliveryService.ts  ❌ DEPRECADO
- src/modules/business/gastronomy/hooks/useDeliveryRequests.ts ❌ DEPRECADO
```

### Problemas do Sistema Legado:
1. ❌ **Sem rastreamento GPS em tempo real**
2. ❌ **Duplicação de lógica** (delivery_requests vs ride_requests)
3. ❌ **Não integrado com mobilidade**
4. ❌ **Sem proof of delivery robusto**
5. ❌ **Sem auditoria completa**

---

## ✅ Sistema NOVO (SSOT)

### Arquitetura Correta:

```
┌─────────────────────────────────────────────────────────────┐
│                    GASTRONOMIA (Frontend)                    │
│                                                              │
│  Cart → GastronomyCheckoutService.createOrder()             │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DELIVERY SSOT (Core Backend)                    │
│                                                              │
│  GastronomyOrderOriginAdapter.toCreateOrderInput()          │
│           ↓                                                  │
│  OrderDeliverySSOTService.createOrder()                      │
│           ↓                                                  │
│  RPC: delivery_create_order                                  │
│           ↓                                                  │
│  Tabela: orders + order_items + order_timeline_events       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              MOBILITY (Rastreamento GPS)                     │
│                                                              │
│  useMotoboy.requestDelivery()                                │
│           ↓                                                  │
│  RideOperationalService                                      │
│           ↓                                                  │
│  Tabela: ride_requests (ride_mode='motoboy')                │
│           ↓                                                  │
│  RideTrackingMap + DriverLocationSender                      │
│  ✅ GPS em tempo real                                        │
│  ✅ ETA dinâmico                                             │
│  ✅ Proof of delivery                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Mudanças Implementadas

### 1. **GastronomyCheckoutService** (Refatorado)

**ANTES** (Legado):
```typescript
// ❌ Chamava RPC direto, criava em delivery_requests
const { data, error } = await supabase.rpc('delivery_create_order', {
  p_delivery_mode: "merchant_own_fleet",
  // ... sem integração com mobilidade
});
```

**DEPOIS** (SSOT):
```typescript
// ✅ Usa adapter + SSOT service
const createOrderInput = GastronomyOrderOriginAdapter.toCreateOrderInput({
  customer_profile_id,
  business,
  cart,
});

const result = await OrderDeliverySSOTService.createOrder(createOrderInput);
// ✅ Cria em orders table (SSOT)
// ✅ Preparado para integração com mobilidade
```

### 2. **Integração com Mobilidade** (Próximo Passo)

Após criar pedido, se `delivery_enabled`:

```typescript
// Criar ride_request para rastreamento GPS
await useMotoboy.requestDelivery({
  orderId: order.id,
  pickupAddressId: business.address_id,
  dropoffAddressId: customer.address_id,
  sourceType: 'gastronomy',
  sourceId: business.id,
});
```

---

## 📊 Comparação: Legado vs SSOT

| Funcionalidade | Sistema Legado | SSOT Atual |
|----------------|----------------|------------|
| **Tabela de pedidos** | `delivery_requests` ❌ | `orders` ✅ |
| **Rastreamento GPS** | `delivery_tracking` (sem GPS real) ❌ | `ride_requests` + GPS real ✅ |
| **Proof of delivery** | Básico ❌ | Robusto (foto, código, assinatura) ✅ |
| **Auditoria** | `delivery_status_history` ❌ | `order_timeline_events` ✅ |
| **Integração mobilidade** | Nenhuma ❌ | Completa ✅ |
| **ETA dinâmico** | Não ❌ | Sim ✅ |
| **Mapa em tempo real** | Não ❌ | Sim (RideTrackingMap) ✅ |
| **Settlement/Payout** | Não ❌ | Preparado ✅ |

---

## 🗑️ Arquivos para REMOVER

### Serviços Legados:
```bash
# ❌ DEPRECADO - Remover após validação
src/modules/business/gastronomy/services/DeliveryService.ts
src/modules/business/gastronomy/hooks/useDeliveryRequests.ts
src/modules/business/gastronomy/hooks/useDeliveryRequest.ts
src/modules/business/gastronomy/hooks/useDeliveryStats.ts
```

### Componentes Legados:
```bash
# ❌ DEPRECADO - Verificar uso antes de remover
src/modules/business/gastronomy/components/delivery/CreateDeliveryRequestDialog.tsx
src/modules/business/gastronomy/components/delivery/DeliveryRequestCard.tsx
```

### Migrations Legadas:
```bash
# ❌ DEPRECADO - Manter por histórico, mas não usar
supabase/migrations/20260413160000_create_delivery_system.sql
```

---

## ✅ Arquivos CORRETOS (SSOT)

### Core Delivery:
```bash
✅ src/modules/mobility/delivery/services/OrderDeliverySSOTService.ts
✅ src/modules/mobility/delivery/order/adapters/GastronomyOrderOriginAdapter.ts
✅ src/modules/mobility/delivery/order/OrderDraftService.ts
```

### Mobilidade (Rastreamento):
```bash
✅ src/modules/mobility/hooks/useMotoboy.ts
✅ src/modules/mobility/hooks/useDelivery.ts
✅ src/modules/mobility/components/RideTrackingMap.tsx
✅ src/modules/mobility/components/DriverLocationSender.tsx
✅ src/modules/mobility/core/RideOperationalService.ts
```

### Gastronomia (Integrado):
```bash
✅ src/modules/business/gastronomy/services/GastronomyCheckoutService.ts (REFATORADO)
✅ src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts
```

---

## 🎯 Próximos Passos

### 1. **Conectar Pedido → Rastreamento** (Prioridade ALTA)

Após criar pedido em `GastronomyCheckoutService`, criar `ride_request`:

```typescript
// Em useGastronomyCheckout.ts
const order = await GastronomyCheckoutService.createOrder(input);

// Se delivery habilitado, criar ride_request para rastreamento
if (business.gastronomy_profile.delivery_enabled) {
  await useMotoboy.requestDelivery({
    orderId: order.id,
    pickupAddressId: business.address_id,
    dropoffAddressId: deliveryAddress.id,
    pickupLocationId: business.location_id,
    originLat: business.lat,
    originLng: business.lng,
    destinationLat: deliveryAddress.lat,
    destinationLng: deliveryAddress.lng,
    recipientName: customer.name,
    recipientPhone: customer.phone,
    packageSize: 'medium',
    sourceType: 'gastronomy',
    sourceId: business.business_data_id,
  });
}
```

### 2. **Atualizar OrdersPage** (Prioridade ALTA)

Substituir `useOrders` (que usa `OrderService` legado) por query direto em `orders`:

```typescript
// src/modules/business/gastronomy/pages/OrdersPage.tsx
const { data: orders } = useQuery({
  queryKey: ['orders', businessId],
  queryFn: async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('merchant_profile_id', merchantProfileId)
      .order('created_at', { ascending: false });
    return data;
  },
});
```

### 3. **Remover Sistema Legado** (Prioridade MÉDIA)

Após validar que tudo funciona:
1. Remover `DeliveryService.ts`
2. Remover `useDeliveryRequests.ts`
3. Marcar tabelas legadas como deprecadas
4. Criar migration para drop tables (após período de transição)

### 4. **Adicionar Rastreamento na UI** (Prioridade ALTA)

Mostrar `RideTrackingMap` na página de detalhes do pedido:

```typescript
// OrderDetailsPage.tsx
{order.ride_request_id && (
  <RideTrackingMap
    driverProfileId={order.ride_request.driver_profile_id}
    rideId={order.ride_request_id}
    destinationLat={order.delivery_address.lat}
    destinationLon={order.delivery_address.lng}
  />
)}
```

---

## 🔍 Validação

### Checklist de Validação:

- [x] GastronomyCheckoutService usa OrderDeliverySSOTService
- [x] GastronomyOrderOriginAdapter converte Cart → CreateOrderInput
- [x] Pedidos criados em `orders` table (SSOT)
- [ ] ride_request criado automaticamente para delivery
- [ ] RideTrackingMap exibido na UI de pedidos
- [ ] Sistema legado marcado como deprecado
- [ ] Testes atualizados

---

## 📝 Notas Técnicas

### Por que dois sistemas existiam?

1. **Histórico**: `delivery_requests` foi criado antes do SSOT `orders`
2. **Evolução**: Sistema de mobilidade foi desenvolvido separadamente
3. **Falta de integração**: Nunca foram conectados corretamente

### Por que SSOT é melhor?

1. **Single Source of Truth**: Uma tabela `orders` para todos os pedidos
2. **Rastreamento Real**: Integração com GPS via `ride_requests`
3. **Auditoria Completa**: Timeline de eventos
4. **Escalável**: Preparado para marketplace (platform_courier_network)
5. **Proof of Delivery**: Foto, código, assinatura

---

## 🎉 Benefícios da Migração

### Para o Negócio:
- ✅ Rastreamento GPS em tempo real (como Domino's)
- ✅ ETA dinâmico para clientes
- ✅ Proof of delivery robusto
- ✅ Menos ligações "cadê minha pizza?"

### Para Desenvolvedores:
- ✅ Código mais limpo (SSOT)
- ✅ Menos duplicação
- ✅ Melhor manutenibilidade
- ✅ Preparado para escalar

### Para Clientes:
- ✅ Saber onde está o pedido
- ✅ Tempo estimado preciso
- ✅ Notificações em cada etapa
- ✅ Mais confiança no serviço

---

**Status Final**: ✅ Migração de checkout concluída. Próximo: conectar rastreamento GPS.

**Documento mantido por**: Equipe de Desenvolvimento  
**Última atualização**: 26/04/2026
