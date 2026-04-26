# 🚀 Instruções: Ativar Rastreamento GPS Automático

**Objetivo**: Conectar pedidos de pizzaria ao rastreamento GPS em tempo real

---

## 📋 Pré-requisitos

- [x] GastronomyCheckoutService refatorado (✅ Concluído)
- [x] OrderDeliverySSOTService funcionando (✅ Concluído)
- [x] Sistema de mobilidade ativo (✅ Concluído)
- [ ] Conectar checkout → rastreamento (⏳ Próximo passo)

---

## 🔧 Passo 1: Conectar Checkout ao Rastreamento

### Arquivo: `src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts`

**Localizar a função `createOrderMutation`** e adicionar integração com mobilidade:

```typescript
import { useMotoboy } from '@/modules/mobility';

// ... código existente ...

const createOrderMutation = useMutation({
  mutationFn: async (input: CreateCheckoutInput) => {
    // 1. Criar pedido (já existe)
    const order = await GastronomyCheckoutService.createOrder({
      customer_profile_id: activeProfile.id,
      actor_profile_id: activeProfile.id,
      business: input.business,
      cart: input.cart,
      payment_method: input.payment_method,
      notes: input.notes,
    });

    // 2. ✅ ADICIONAR: Se delivery habilitado, criar ride_request
    if (input.business.gastronomy_profile.delivery_enabled && input.deliveryAddress) {
      try {
        const motoboy = useMotoboy({
          sourceType: 'gastronomy',
          sourceId: input.business.business_data_id,
        });

        await motoboy.requestDelivery({
          orderId: order.id,
          pickupAddressId: input.business.address_id,
          dropoffAddressId: input.deliveryAddress.id,
          pickupLocationId: input.business.location_id,
          originLat: input.business.lat,
          originLng: input.business.lng,
          destinationLat: input.deliveryAddress.lat,
          destinationLng: input.deliveryAddress.lng,
          recipientName: input.deliveryAddress.recipient_name || activeProfile.full_name,
          recipientPhone: input.deliveryAddress.phone || activeProfile.phone,
          packageSize: 'medium', // ou calcular baseado no pedido
          packageDescription: `Pedido #${order.id} - ${input.business.name}`,
          deliveryNotes: input.notes,
        });

        logger.info('[useGastronomyCheckout] Rastreamento GPS ativado', {
          order_id: order.id,
          business_id: input.business.business_data_id,
        });
      } catch (error) {
        // Não falhar o pedido se rastreamento falhar
        logger.error('[useGastronomyCheckout] Erro ao ativar rastreamento', error);
        toast.warning('Pedido criado, mas rastreamento não disponível no momento');
      }
    }

    return order;
  },
  // ... resto do código ...
});
```

---

## 🎨 Passo 2: Exibir Mapa na UI de Pedidos

### Arquivo: `src/modules/business/gastronomy/pages/OrderDetailsPage.tsx`

**Adicionar componente de rastreamento:**

```typescript
import { RideTrackingMap } from '@/modules/mobility/components/RideTrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

// ... dentro do componente ...

{/* ✅ ADICIONAR: Seção de Rastreamento */}
{order.ride_request_id && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Navigation className="h-5 w-5 text-teal-400" />
        Rastreamento em Tempo Real
      </CardTitle>
      <CardDescription>
        Acompanhe a localização do entregador em tempo real
      </CardDescription>
    </CardHeader>
    <CardContent>
      <RideTrackingMap
        driverProfileId={order.ride_request.driver_profile_id}
        rideId={order.ride_request_id}
        destinationLat={order.delivery_address.lat}
        destinationLon={order.delivery_address.lng}
        originLat={order.pickup_address.lat}
        originLon={order.pickup_address.lng}
        showETA={true}
        className="h-96"
      />
      
      {/* Status da entrega */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Status da Entrega</p>
          <p className="text-xs text-muted-foreground">
            {getRideStatusLabel(order.ride_request.status)}
          </p>
        </div>
        {order.ride_request.driver_profile && (
          <div className="text-right">
            <p className="text-sm font-medium">Entregador</p>
            <p className="text-xs text-muted-foreground">
              {order.ride_request.driver_profile.full_name}
            </p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

---

## 📱 Passo 3: Adicionar na Lista de Pedidos

### Arquivo: `src/modules/business/gastronomy/pages/OrdersPage.tsx`

**Adicionar badge de rastreamento:**

```typescript
{/* ✅ ADICIONAR: Badge de rastreamento ativo */}
{order.ride_request_id && (
  <Badge variant="outline" className="gap-1">
    <Navigation className="h-3 w-3 animate-pulse text-teal-400" />
    Rastreamento Ativo
  </Badge>
)}
```

---

## 🔔 Passo 4: Notificações de Status

### Arquivo: `src/modules/business/gastronomy/hooks/useOrderRealtime.ts`

**Criar hook para notificações em tempo real:**

```typescript
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';

export function useOrderRealtime(orderId: string) {
  useEffect(() => {
    // Escutar mudanças no ride_request
    const channel = supabase
      .channel(`order-${orderId}-tracking`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `source_id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          
          // Notificar cliente sobre mudanças
          switch (newStatus) {
            case 'driver_assigned':
              toast.success('Entregador encontrado!');
              break;
            case 'driver_accepted':
              toast.success('Entregador a caminho do restaurante');
              break;
            case 'pickup_confirmed':
              toast.success('Pedido coletado! Entregador a caminho');
              break;
            case 'in_delivery':
              toast.info('Seu pedido está sendo entregue');
              break;
            case 'delivered':
              toast.success('Pedido entregue! Bom apetite! 🍕');
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
}
```

**Usar no componente:**

```typescript
// Em OrderDetailsPage.tsx
useOrderRealtime(order.id);
```

---

## 🧪 Passo 5: Testar a Integração

### Fluxo de Teste:

1. **Criar pedido de pizza**
   ```
   - Adicionar itens ao carrinho
   - Preencher endereço de entrega
   - Finalizar pedido
   ```

2. **Verificar criação**
   ```sql
   -- Verificar pedido criado
   SELECT * FROM orders WHERE id = '<order_id>';
   
   -- Verificar ride_request criado
   SELECT * FROM ride_requests 
   WHERE source_type = 'gastronomy' 
   AND source_id = '<order_id>';
   ```

3. **Simular aceite de motorista**
   ```sql
   -- Atribuir motorista (para teste)
   UPDATE ride_requests 
   SET 
     status = 'driver_assigned',
     driver_profile_id = '<driver_id>'
   WHERE id = '<ride_id>';
   ```

4. **Verificar rastreamento**
   ```
   - Abrir página de detalhes do pedido
   - Verificar se RideTrackingMap aparece
   - Verificar se localização do motorista é exibida
   ```

---

## 🐛 Troubleshooting

### Problema: ride_request não é criado

**Verificar:**
```typescript
// 1. business.gastronomy_profile.delivery_enabled está true?
console.log(business.gastronomy_profile.delivery_enabled);

// 2. deliveryAddress está preenchido?
console.log(input.deliveryAddress);

// 3. Verificar logs de erro
// Abrir console do navegador e procurar por erros
```

### Problema: Mapa não aparece

**Verificar:**
```typescript
// 1. order.ride_request_id existe?
console.log(order.ride_request_id);

// 2. Componente RideTrackingMap importado?
import { RideTrackingMap } from '@/modules/mobility/components/RideTrackingMap';

// 3. Verificar se driver_profile_id está preenchido
console.log(order.ride_request.driver_profile_id);
```

### Problema: GPS não atualiza

**Verificar:**
```typescript
// 1. Motorista está online?
SELECT is_online FROM driver_data WHERE id = '<driver_id>';

// 2. DriverLocationSender está ativo?
// Verificar no painel do motorista se GPS está ligado

// 3. Verificar permissões de geolocalização
// Navegador deve ter permissão para acessar localização
```

---

## 📊 Métricas de Sucesso

Após implementar, verificar:

- [ ] 100% dos pedidos com delivery criam ride_request
- [ ] Mapa de rastreamento aparece em todos os pedidos ativos
- [ ] ETA é calculado e exibido corretamente
- [ ] Notificações são enviadas em cada mudança de status
- [ ] Clientes conseguem ver localização do entregador
- [ ] Proof of delivery é registrado ao finalizar

---

## 🎯 Resultado Esperado

### Antes:
```
Cliente faz pedido → Pedido criado → ❌ Sem rastreamento
```

### Depois:
```
Cliente faz pedido 
  → Pedido criado em orders
  → ride_request criado automaticamente
  → GPS ativado
  → Mapa exibido na UI
  → Cliente vê entregador em tempo real
  → ✅ Rastreamento completo!
```

---

## 📚 Referências

- [MIGRACAO_DELIVERY_SSOT.md](./MIGRACAO_DELIVERY_SSOT.md) - Documentação completa da migração
- [RESUMO_CORRECAO_SSOT.md](./RESUMO_CORRECAO_SSOT.md) - Resumo da correção
- [src/modules/mobility/MOTOBOY.md](./src/modules/mobility/MOTOBOY.md) - Documentação do sistema de motoboy
- [src/modules/mobility/delivery/README.md](./src/modules/mobility/delivery/README.md) - SSOT de delivery

---

**Próximo**: Após ativar rastreamento, implementar Sistema de Fidelidade (Fase 3)

**Mantido por**: Equipe de Desenvolvimento  
**Última atualização**: 26/04/2026
