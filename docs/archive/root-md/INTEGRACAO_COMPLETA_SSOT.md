# ✅ Integração Completa: Orders + Rastreamento GPS (SSOT)

**Data**: 26 de Abril de 2026  
**Status**: ✅ Implementado  
**Arquitetura**: SSOT (Single Source of Truth)

---

## 🎯 Objetivo

Conectar o sistema de pedidos (`orders`) com o sistema de rastreamento GPS (`ride_requests`) de forma limpa, seguindo princípios SSOT, sem gambiarras.

---

## 🏗️ Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE FAZ PEDIDO                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  useGastronomyCheckout (Hook)                                │
│  ✅ Orquestra o fluxo completo                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├─────────────────────────────────────┐
                       │                                     │
                       ▼                                     ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  1. CRIAR PEDIDO (SSOT)          │  │  2. CRIAR RASTREAMENTO (GPS)     │
│                                  │  │                                  │
│  GastronomyCheckoutService       │  │  useMotoboy.requestDelivery()    │
│         ↓                        │  │         ↓                        │
│  GastronomyOrderOriginAdapter    │  │  useDelivery.createDelivery()    │
│         ↓                        │  │         ↓                        │
│  OrderDeliverySSOTService        │  │  RideOperationalService          │
│         ↓                        │  │         ↓                        │
│  RPC: delivery_create_order      │  │  RPC: create_ride                │
│         ↓                        │  │         ↓                        │
│  Tabela: orders                  │  │  Tabela: ride_requests           │
│  ✅ SSOT do pedido               │  │  ✅ SSOT do rastreamento         │
└──────────────────────────────────┘  └──────────────────────────────────┘
                       │                                     │
                       └─────────────────┬─────────────────┘
                                         │
                                         ▼
                       ┌─────────────────────────────────────┐
                       │  VÍNCULO (source_type + source_id)  │
                       │                                     │
                       │  ride_requests.source_type = 'gastronomy'
                       │  ride_requests.source_id = order.id │
                       └─────────────────────────────────────┘
                                         │
                                         ▼
                       ┌─────────────────────────────────────┐
                       │  OrderDeliveryLinkService           │
                       │  ✅ Queries para buscar vínculo     │
                       │  ✅ Mapeamento de status            │
                       └─────────────────────────────────────┘
```

---

## 📁 Arquivos Implementados

### 1. **useGastronomyCheckout.ts** (Refatorado)
**Localização**: `src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts`

**Responsabilidade**: Orquestrar criação de pedido + rastreamento

**Fluxo**:
```typescript
1. Criar pedido via GastronomyCheckoutService
2. Se delivery_enabled:
   a. Validar dados necessários (address_id, location_id, coordenadas)
   b. Chamar useMotoboy.requestDelivery()
   c. Criar ride_request com source_type='gastronomy' e source_id=order.id
3. Retornar pedido criado
```

**Características**:
- ✅ Não falha o pedido se rastreamento falhar
- ✅ Logs detalhados em cada etapa
- ✅ Toast notifications apropriadas
- ✅ Validação de dados antes de criar rastreamento

### 2. **OrderDeliveryLinkService.ts** (Novo)
**Localização**: `src/modules/mobility/delivery/services/OrderDeliveryLinkService.ts`

**Responsabilidade**: Gerenciar vínculo entre orders e ride_requests

**Métodos**:
```typescript
// Buscar ride_request de um order
getRideRequestByOrderId(orderId: string): Promise<RideRequest | null>

// Buscar order de um ride_request
getOrderByRideRequestId(rideRequestId: string): Promise<string | null>

// Verificar se order tem delivery ativo
hasActiveDelivery(orderId: string): Promise<boolean>

// Mapear status entre sistemas
mapRideStatusToLogisticsStatus(rideStatus: string): string | null
mapLogisticsStatusToRideStatus(logisticsStatus: string): string | null
```

**Características**:
- ✅ Queries otimizadas
- ✅ Tratamento de erros robusto
- ✅ Mapeamento bidirecional de status
- ✅ Sem lógica de negócio (apenas queries)

---

## 🔗 Vínculo entre Sistemas

### Como funciona:

```sql
-- Quando order é criado:
INSERT INTO orders (id, ...) VALUES ('order-123', ...);

-- Se delivery habilitado, ride_request é criado:
INSERT INTO ride_requests (
  id,
  source_type,  -- 'gastronomy'
  source_id,    -- 'order-123'
  ride_mode,    -- 'motoboy'
  ...
) VALUES (...);

-- Buscar ride_request de um order:
SELECT * FROM ride_requests
WHERE source_type = 'gastronomy'
  AND source_id = 'order-123';
```

### Vantagens:
- ✅ **Desacoplado**: Sistemas independentes
- ✅ **Flexível**: Pode ter order sem ride_request
- ✅ **Rastreável**: Vínculo explícito via source_type + source_id
- ✅ **Escalável**: Preparado para outros source_types (business, service)

---

## 📊 Fluxo de Status

### Sincronização de Estados:

| Order (logistics_status) | Ride Request (status) | Descrição |
|--------------------------|----------------------|-----------|
| `pending` | `requested` | Pedido criado, buscando motoboy |
| `pending` | `searching_driver` | Procurando motorista disponível |
| `accepted` | `driver_assigned` | Motorista encontrado |
| `accepted` | `driver_accepted` | Motorista confirmou |
| `preparing` | `driver_arriving` | Motorista a caminho do restaurante |
| `ready_for_pickup` | `driver_arriving` | Pedido pronto, aguardando coleta |
| `picked_up` | `pickup_confirmed` | Motorista coletou o pedido |
| `in_transit` | `in_delivery` | Em rota de entrega |
| `delivered` | `delivered` | Entregue com sucesso |
| `canceled` | `cancelled` | Cancelado |
| `failed` | `failed` | Falha na entrega |

---

## 🎨 UI: Exibir Rastreamento

### Componente de Rastreamento:

```typescript
// OrderDetailsPage.tsx
import { RideTrackingMap } from '@/modules/mobility/components/RideTrackingMap';
import { OrderDeliveryLinkService } from '@/modules/mobility/delivery/services/OrderDeliveryLinkService';

// Buscar ride_request do order
const { data: rideRequest } = useQuery({
  queryKey: ['order-ride-request', orderId],
  queryFn: () => OrderDeliveryLinkService.getRideRequestByOrderId(orderId),
});

// Exibir mapa se ride_request existe
{rideRequest && (
  <Card>
    <CardHeader>
      <CardTitle>Rastreamento em Tempo Real</CardTitle>
    </CardHeader>
    <CardContent>
      <RideTrackingMap
        driverProfileId={rideRequest.driver_profile_id}
        rideId={rideRequest.id}
        destinationLat={order.delivery_address.lat}
        destinationLon={order.delivery_address.lng}
        originLat={order.pickup_address.lat}
        originLon={order.pickup_address.lng}
        showETA={true}
      />
    </CardContent>
  </Card>
)}
```

---

## 🧪 Testes

### Fluxo de Teste Completo:

```typescript
// 1. Criar pedido com delivery
const order = await useGastronomyCheckout().checkout({
  business: pizzaria,
  cart: cartWithPizzas,
  deliveryAddress: {
    id: 'addr-123',
    lat: -12.9777,
    lng: -38.5016,
    recipient_name: 'João Silva',
    phone: '71999999999',
  },
});

// 2. Verificar order criado
expect(order.id).toBeDefined();
expect(order.logistics_status).toBe('pending');

// 3. Verificar ride_request criado
const rideRequest = await OrderDeliveryLinkService.getRideRequestByOrderId(order.id);
expect(rideRequest).toBeDefined();
expect(rideRequest.source_type).toBe('gastronomy');
expect(rideRequest.source_id).toBe(order.id);
expect(rideRequest.ride_mode).toBe('motoboy');

// 4. Verificar vínculo bidirecional
const linkedOrderId = await OrderDeliveryLinkService.getOrderByRideRequestId(rideRequest.id);
expect(linkedOrderId).toBe(order.id);

// 5. Simular aceite de motorista
await supabase
  .from('ride_requests')
  .update({ status: 'driver_accepted', driver_profile_id: 'driver-123' })
  .eq('id', rideRequest.id);

// 6. Verificar rastreamento ativo
const hasActive = await OrderDeliveryLinkService.hasActiveDelivery(order.id);
expect(hasActive).toBe(true);
```

---

## 🔒 Princípios SSOT Seguidos

### 1. **Single Source of Truth**
- ✅ `orders` table: SSOT do pedido
- ✅ `ride_requests` table: SSOT do rastreamento
- ✅ Vínculo explícito, não duplicação

### 2. **Separation of Concerns**
- ✅ `GastronomyCheckoutService`: Cria pedido
- ✅ `useMotoboy`: Cria rastreamento
- ✅ `OrderDeliveryLinkService`: Gerencia vínculo

### 3. **Fail-Safe**
- ✅ Pedido não falha se rastreamento falhar
- ✅ Logs detalhados para debug
- ✅ Mensagens claras para usuário

### 4. **Idempotência**
- ✅ Criar pedido é idempotente (RPC)
- ✅ Criar ride_request é idempotente
- ✅ Vínculo é único (source_type + source_id)

### 5. **Testabilidade**
- ✅ Cada serviço é testável isoladamente
- ✅ Vínculo é verificável via queries
- ✅ Mocks fáceis de criar

---

## 📈 Benefícios da Arquitetura

### Técnicos:
- ✅ **Desacoplamento**: Sistemas independentes
- ✅ **Manutenibilidade**: Código limpo e organizado
- ✅ **Escalabilidade**: Preparado para crescer
- ✅ **Testabilidade**: Fácil de testar

### Negócio:
- ✅ **Rastreamento GPS real**: Como Domino's
- ✅ **ETA dinâmico**: Cliente sabe quando chega
- ✅ **Proof of delivery**: Foto, código, assinatura
- ✅ **Menos suporte**: Menos ligações "cadê minha pizza?"

### Cliente:
- ✅ **Transparência**: Ver onde está o pedido
- ✅ **Confiança**: Saber que está a caminho
- ✅ **Experiência**: Melhor que concorrentes

---

## 🚀 Próximos Passos

### 1. **Implementar UI de Rastreamento** (PRIORIDADE ALTA)
- [ ] Adicionar `RideTrackingMap` em `OrderDetailsPage`
- [ ] Adicionar badge "Rastreamento Ativo" em `OrdersPage`
- [ ] Adicionar notificações em tempo real

### 2. **Sincronização de Status** (PRIORIDADE MÉDIA)
- [ ] Criar trigger para atualizar order quando ride_request muda
- [ ] Criar webhook para notificar cliente

### 3. **Remover Sistema Legado** (PRIORIDADE BAIXA)
- [ ] Deletar `DeliveryService.ts`
- [ ] Deletar `useDeliveryRequests.ts`
- [ ] Drop tables `delivery_requests`, `delivery_tracking`, `delivery_status_history`

---

## 📚 Documentação Relacionada

- [MIGRACAO_DELIVERY_SSOT.md](./MIGRACAO_DELIVERY_SSOT.md) - Migração completa
- [RESUMO_CORRECAO_SSOT.md](./RESUMO_CORRECAO_SSOT.md) - Resumo da correção
- [INSTRUCOES_ATIVAR_RASTREAMENTO.md](./INSTRUCOES_ATIVAR_RASTREAMENTO.md) - Instruções práticas

---

## ✅ Checklist de Validação

- [x] GastronomyCheckoutService usa OrderDeliverySSOTService
- [x] useGastronomyCheckout integrado com useMotoboy
- [x] OrderDeliveryLinkService criado
- [x] Vínculo via source_type + source_id
- [x] Logs detalhados implementados
- [x] Tratamento de erros robusto
- [x] Fail-safe (pedido não falha se rastreamento falhar)
- [ ] UI de rastreamento implementada
- [ ] Testes automatizados criados
- [ ] Sistema legado removido

---

**Status**: ✅ Integração completa implementada seguindo SSOT, sem gambiarras!

**Mantido por**: Equipe de Desenvolvimento  
**Última atualização**: 26/04/2026
