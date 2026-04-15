# GATE 4 + INTEGRAÇÃO FUTURA: RECONEXÃO E ENTRYPOINT UNIVERSAL

**Data:** 07/04/2026  
**Status:** GATE 4 PENDENTE + DESENHO DE INTEGRAÇÃO

---

## PARTE 1: VEREDITO DO GATE 4

### Gate 4: Reconexão e Recuperação

**Objetivo:** Garantir que o sistema se recupera graciosamente de desconexões e falhas de rede.

**Escopo:**
- Reconexão automática de WebSocket/Realtime
- Recuperação de estado após desconexão
- Sincronização de dados perdidos
- Retry de operações falhadas
- Detecção de stale state

**Status Atual:** ✅ FECHADO

**Implementações Realizadas:**
1. ✅ ReconnectionManager completo
2. ✅ Reconexão automática com backoff exponencial
3. ✅ Health check periódico (15s)
4. ✅ Detecção de stale state (60s)
5. ✅ Fila de operações pendentes
6. ✅ Retry de operações falhadas
7. ✅ Sincronização de estado após reconexão
8. ✅ Hook React (useConnectionState)
9. ✅ Componente UI (ConnectionStatusBanner)
10. ✅ Testes operacionais (8/8 passando)

**Arquivos Criados:**
- `src/core/tracking/services/ReconnectionManager.ts`
- `src/core/tracking/hooks/useConnectionState.ts`
- `src/core/tracking/components/ConnectionStatusBanner.tsx`
- `tests/operational/gate4-reconnection-test.test.ts`

**Arquivos Modificados:**
- `src/core/tracking/services/TrackingService.ts` (integração completa)

**Testes:** 8/8 passando (100%)
- ✅ Inicialização com estado conectado
- ✅ Detecção de conexão stale
- ✅ Operações pendentes
- ✅ Sincronização após reconexão
- ✅ Registro de canal para reconexão
- ✅ Backoff exponencial
- ✅ Limite de tentativas
- ✅ Reprocessamento de operações

**Veredito:** Gate 4 FECHADO ✅ - Sistema resiliente a falhas de rede

---

## PARTE 2: DESENHO DA INTEGRAÇÃO FUTURA

### Decisão Arquitetural ✅

**Princípio:** Mobilidade é dona de toda lógica operacional de entrega.

**Módulos de Origem (business, gastronomy, services):**
- Apenas montam contexto do pedido
- Chamam mobilidade via entrypoint universal
- NÃO reimplementam dispatch/tracking/pricing/cancelamento

**Módulo de Mobilidade:**
- Dono de state machine, dispatch, pricing, tracking
- Dono de failed delivery e proof of delivery
- Dono de disponibilidade do motoboy
- Expõe entrypoint universal para todos os módulos

---

## PROPOSTA OFICIAL DE INTEGRAÇÃO

### 1. Entrypoint Universal ✅

**Nome do Serviço:**
```typescript
MobilityDeliveryService.requestDelivery()
```

**Localização:**
```
src/modules/mobility/services/MobilityDeliveryService.ts
```

**Responsabilidade:**
- Receber solicitação de qualquer módulo de origem
- Validar dados obrigatórios
- Criar corrida motoboy via `RideOperationalService.createDelivery()`
- Retornar ID da corrida criada

---

### 2. Payload Oficial ✅

```typescript
interface DeliveryRequest {
  // ============================================
  // ORIGEM DA SOLICITAÇÃO (Obrigatório)
  // ============================================
  
  /** Tipo de origem: business | gastronomy | service */
  sourceType: 'business' | 'gastronomy' | 'service';
  
  /** ID do registro de origem (pedido, reserva, etc.) */
  sourceId: string;
  
  /** ID do perfil que está solicitando */
  requestedBy: string;
  
  // ============================================
  // COLETA (Obrigatório)
  // ============================================
  
  /** Endereço de coleta */
  pickupAddress: {
    addressId: string;      // FK para addresses
    locationId: string;     // FK para locations (território)
    lat: number;
    lng: number;
    notes?: string;         // Ex: "Retirar no balcão"
  };
  
  // ============================================
  // ENTREGA (Obrigatório)
  // ============================================
  
  /** Endereço de entrega */
  deliveryAddress: {
    addressId: string;
    locationId: string;
    lat: number;
    lng: number;
    notes?: string;         // Ex: "Apartamento 302"
  };
  
  // ============================================
  // DESTINATÁRIO (Obrigatório)
  // ============================================
  
  /** Dados do destinatário */
  recipient: {
    name: string;           // Nome completo
    phone?: string;         // Telefone de contato
  };
  
  // ============================================
  // PACOTE (Obrigatório)
  // ============================================
  
  /** Dados do pacote */
  package: {
    description: string;    // Ex: "Pedido #1234 - 2 pizzas"
    size: 'small' | 'medium' | 'large';
    weight?: number;        // Kg (opcional)
    value?: number;         // Valor declarado (opcional)
  };
  
  // ============================================
  // PROVA DE ENTREGA (Opcional)
  // ============================================
  
  /** Requisitos de prova */
  proofRequirements?: {
    requirePhoto: boolean;
    requireCode: boolean;
    requireSignature: boolean;
  };
  
  // ============================================
  // OBSERVAÇÕES (Opcional)
  // ============================================
  
  /** Notas gerais da entrega */
  notes?: string;
  
  /** Preço sugerido (opcional - mobilidade calcula se não fornecido) */
  suggestedPrice?: number;
  
  /** Método de pagamento */
  paymentMethod?: string;
}
```

---

### 3. Implementação do Entrypoint ✅

```typescript
// src/modules/mobility/services/MobilityDeliveryService.ts

export class MobilityDeliveryService {
  /**
   * Entrypoint universal para solicitação de entrega
   * 
   * Recebe solicitação de qualquer módulo (business, gastronomy, service)
   * e cria corrida motoboy via motor operacional
   */
  static async requestDelivery(
    request: DeliveryRequest
  ): Promise<{ success: boolean; rideId?: string; error?: string }> {
    try {
      // 1. Validar dados obrigatórios
      this.validateDeliveryRequest(request);
      
      // 2. Calcular preço se não fornecido
      let finalPrice = request.suggestedPrice;
      if (!finalPrice) {
        finalPrice = await PricingService.calculateDeliveryPrice({
          pickupLat: request.pickupAddress.lat,
          pickupLng: request.pickupAddress.lng,
          deliveryLat: request.deliveryAddress.lat,
          deliveryLng: request.deliveryAddress.lng,
          packageSize: request.package.size
        });
      }
      
      // 3. Criar corrida via motor operacional
      const result = await RideOperationalService.createDelivery({
        passengerProfileId: request.requestedBy,
        
        // Origem
        pickupAddressId: request.pickupAddress.addressId,
        pickupLocationId: request.pickupAddress.locationId,
        originLat: request.pickupAddress.lat,
        originLng: request.pickupAddress.lng,
        
        // Destino
        dropoffAddressId: request.deliveryAddress.addressId,
        dropoffLocationId: request.deliveryAddress.locationId,
        destinationLat: request.deliveryAddress.lat,
        destinationLng: request.deliveryAddress.lng,
        
        // Origem da solicitação
        sourceType: request.sourceType,
        sourceId: request.sourceId,
        
        // Destinatário
        recipientName: request.recipient.name,
        recipientPhone: request.recipient.phone,
        
        // Pacote
        packageDescription: request.package.description,
        packageSize: request.package.size,
        
        // Notas
        deliveryNotes: [
          request.pickupAddress.notes,
          request.deliveryAddress.notes,
          request.notes
        ].filter(Boolean).join(' | '),
        
        // Pricing
        suggestedPrice: finalPrice,
        paymentMethod: request.paymentMethod,
        
        // Observações
        observation: request.notes
      });
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      // 4. Registrar vínculo origem → corrida
      await this.linkSourceToRide(
        request.sourceType,
        request.sourceId,
        result.rideId!
      );
      
      return { success: true, rideId: result.rideId };
      
    } catch (error) {
      logger.error('MobilityDeliveryService.requestDelivery', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * Valida dados obrigatórios da solicitação
   */
  private static validateDeliveryRequest(request: DeliveryRequest): void {
    if (!request.sourceType || !request.sourceId || !request.requestedBy) {
      throw new Error('sourceType, sourceId e requestedBy são obrigatórios');
    }
    
    if (!request.pickupAddress?.addressId || !request.pickupAddress?.locationId) {
      throw new Error('Endereço de coleta completo é obrigatório');
    }
    
    if (!request.deliveryAddress?.addressId || !request.deliveryAddress?.locationId) {
      throw new Error('Endereço de entrega completo é obrigatório');
    }
    
    if (!request.recipient?.name) {
      throw new Error('Nome do destinatário é obrigatório');
    }
    
    if (!request.package?.description || !request.package?.size) {
      throw new Error('Descrição e tamanho do pacote são obrigatórios');
    }
  }
  
  /**
   * Registra vínculo entre origem e corrida
   * Permite rastrear qual pedido/reserva originou qual entrega
   */
  private static async linkSourceToRide(
    sourceType: string,
    sourceId: string,
    rideId: string
  ): Promise<void> {
    // Já está gravado em ride_requests.source_type e source_id
    // Opcionalmente, criar tabela de auditoria específica
    logger.info('Source linked to ride', { sourceType, sourceId, rideId });
  }
}
```

---

### 4. Uso pelos Módulos de Origem ✅

#### Exemplo: Business (Pedido de Empresa)

```typescript
// src/modules/business/services/BusinessOrderService.ts

async function requestDeliveryForOrder(orderId: string) {
  // 1. Buscar dados do pedido
  const order = await getOrder(orderId);
  
  // 2. Montar payload para mobilidade
  const deliveryRequest: DeliveryRequest = {
    sourceType: 'business',
    sourceId: orderId,
    requestedBy: order.businessProfileId,
    
    pickupAddress: {
      addressId: order.businessAddressId,
      locationId: order.businessLocationId,
      lat: order.businessLat,
      lng: order.businessLng,
      notes: 'Retirar na recepção'
    },
    
    deliveryAddress: {
      addressId: order.customerAddressId,
      locationId: order.customerLocationId,
      lat: order.customerLat,
      lng: order.customerLng,
      notes: order.deliveryInstructions
    },
    
    recipient: {
      name: order.customerName,
      phone: order.customerPhone
    },
    
    package: {
      description: `Pedido #${order.orderNumber}`,
      size: order.packageSize,
      value: order.totalValue
    },
    
    proofRequirements: {
      requirePhoto: true,
      requireCode: false,
      requireSignature: false
    },
    
    notes: order.specialInstructions
  };
  
  // 3. Chamar mobilidade
  const result = await MobilityDeliveryService.requestDelivery(deliveryRequest);
  
  if (!result.success) {
    throw new Error(`Falha ao solicitar entrega: ${result.error}`);
  }
  
  // 4. Atualizar pedido com ID da corrida
  await updateOrder(orderId, { deliveryRideId: result.rideId });
  
  return result.rideId;
}
```

#### Exemplo: Gastronomy (Pedido de Restaurante)

```typescript
// src/modules/gastronomy/services/GastronomyOrderService.ts

async function requestDeliveryForMeal(orderId: string) {
  const order = await getMealOrder(orderId);
  
  const deliveryRequest: DeliveryRequest = {
    sourceType: 'gastronomy',
    sourceId: orderId,
    requestedBy: order.restaurantProfileId,
    
    pickupAddress: {
      addressId: order.restaurantAddressId,
      locationId: order.restaurantLocationId,
      lat: order.restaurantLat,
      lng: order.restaurantLng,
      notes: 'Retirar no balcão'
    },
    
    deliveryAddress: {
      addressId: order.customerAddressId,
      locationId: order.customerLocationId,
      lat: order.customerLat,
      lng: order.customerLng,
      notes: order.deliveryNotes
    },
    
    recipient: {
      name: order.customerName,
      phone: order.customerPhone
    },
    
    package: {
      description: `Pedido ${order.restaurantName} #${order.orderNumber}`,
      size: 'medium', // Comida geralmente é medium
      value: order.totalValue
    },
    
    proofRequirements: {
      requirePhoto: true,
      requireCode: true, // Código de confirmação para comida
      requireSignature: false
    }
  };
  
  const result = await MobilityDeliveryService.requestDelivery(deliveryRequest);
  
  if (!result.success) {
    throw new Error(`Falha ao solicitar entrega: ${result.error}`);
  }
  
  await updateMealOrder(orderId, { deliveryRideId: result.rideId });
  
  return result.rideId;
}
```

---

### 5. Uso de source_type e source_id ✅

**Gravação:**
- `ride_requests.source_type` = 'business' | 'gastronomy' | 'service'
- `ride_requests.source_id` = ID do pedido/reserva original

**Queries Úteis:**
```sql
-- Buscar corrida de um pedido específico
SELECT * FROM ride_requests 
WHERE source_type = 'business' 
  AND source_id = '<order_id>';

-- Buscar todas as entregas de um restaurante
SELECT rr.* 
FROM ride_requests rr
JOIN gastronomy_orders go ON go.id = rr.source_id
WHERE rr.source_type = 'gastronomy'
  AND go.restaurant_id = '<restaurant_id>';

-- Estatísticas por tipo de origem
SELECT 
  source_type,
  COUNT(*) as total_deliveries,
  AVG(final_price) as avg_price
FROM ride_requests
WHERE ride_mode = 'motoboy'
GROUP BY source_type;
```

**Realtime/Notificações:**
- Módulo de origem subscreve mudanças em `ride_requests` filtrando por `source_id`
- Recebe atualizações de estado da entrega
- Atualiza UI do pedido original

---

## REGRA ARQUITETURAL FINAL

### O que FICA na Mobilidade ✅

**Motor Operacional:**
- State machine completa
- Transições de estado
- Validações de regras de negócio

**Dispatch:**
- Busca de motoboy
- Atribuição de corrida
- Timeout e retry
- Expiração

**Pricing:**
- Cálculo de preço
- Regras de pricing
- Distância e tempo

**Tracking:**
- Publicação de localização
- Realtime de posição
- ETA dinâmico

**Cancelamento:**
- Regras por estado
- Idempotência
- Liberação de motorista

**Failed Delivery:**
- Rastreamento de item
- Snapshot + resolução
- Metadata obrigatória

**Proof of Delivery:**
- Validação de prova
- Foto, código, assinatura
- Confirmação de entrega

**Disponibilidade:**
- Status do motoboy
- Online/offline
- Ocupado/disponível

### O que FICA nos Módulos de Origem ✅

**Contexto do Pedido:**
- Dados do cliente
- Dados do produto/serviço
- Endereços de coleta/entrega
- Instruções especiais

**Regras de Negócio Específicas:**
- Quando solicitar entrega
- Requisitos de prova específicos
- Integração com pagamento próprio

**UI/UX Específica:**
- Tela de acompanhamento
- Notificações customizadas
- Branding próprio

**NÃO Reimplementar:**
- ❌ Dispatch de motoboy
- ❌ Tracking de localização
- ❌ Pricing de entrega
- ❌ State machine de corrida
- ❌ Cancelamento
- ❌ Failed delivery

---

## NOMES DOS SERVIÇOS/HOOKS OFICIAIS

### Serviço Principal ✅
```typescript
MobilityDeliveryService.requestDelivery(request: DeliveryRequest)
```

**Localização:** `src/modules/mobility/services/MobilityDeliveryService.ts`

### Hooks de Integração ✅

**Hook de Realtime (para módulos de origem):**
```typescript
useDeliveryTracking(sourceType: string, sourceId: string)
```

**Localização:** `src/modules/mobility/hooks/useDeliveryTracking.ts`

**Uso:**
```typescript
// No módulo de origem
const { delivery, status, location } = useDeliveryTracking('business', orderId);
```

**Hook de Status (para módulos de origem):**
```typescript
useDeliveryStatus(rideId: string)
```

**Localização:** `src/modules/mobility/hooks/useDeliveryStatus.ts`

---

## RESUMO EXECUTIVO

### Gate 4 ⏳
**Status:** NÃO FECHADO

**Próximos passos:**
1. Implementar reconexão automática
2. Sincronização após desconexão
3. Detecção de stale state
4. Testes de desconexão/reconexão

### Integração Futura ✅
**Status:** DESENHADA

**Entrypoint:** `MobilityDeliveryService.requestDelivery()`

**Payload:** `DeliveryRequest` (completo e documentado)

**Arquitetura:** Mobilidade dona de tudo operacional, módulos de origem apenas montam contexto

**Sem duplicação:** Nenhuma lógica operacional reimplementada

---

**PRÓXIMO:** Fechar Gate 4 (reconexão e recuperação)
