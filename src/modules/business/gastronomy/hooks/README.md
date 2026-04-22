# 📚 Hooks do Módulo Gastronomy

Documentação completa dos hooks disponíveis no módulo de Gastronomia.

---

## 📋 Índice

- [Hooks de Listagem](#hooks-de-listagem)
- [Hooks de Detalhe](#hooks-de-detalhe)
- [Hooks de Menu](#hooks-de-menu)
- [Hooks de Cart](#hooks-de-cart)
- [Hooks de Checkout](#hooks-de-checkout)
- [Hooks de Utilidades](#hooks-de-utilidades)

---

## 🔍 Hooks de Listagem

### `useGastronomyList`

Hook para listagem paginada de negócios gastronômicos com filtros territoriais.

**Uso**:
```typescript
import { useGastronomyList } from '@/modules/business/gastronomy/hooks';

function MyComponent() {
  const { data, isLoading, fetchNextPage, hasNextPage } = useGastronomyList({
    territoryFilter: { scope: 'city', city_id: '123' },
    cuisine_type: 'italiana',
    delivery_enabled: true,
  });

  const businesses = data?.pages.flatMap(page => page.businesses) || [];
}
```

**Parâmetros**:
- `filters`: `GastronomyBusinessFilters` - Filtros de busca
- `options.enabled`: `boolean` - Habilitar/desabilitar query

**Retorno**: React Query `useInfiniteQuery` result

---

### `useGastronomyFoodCatalog`

Hook para catálogo público de pratos com filtros.

**Uso**:
```typescript
import { useGastronomyFoodCatalog } from '@/modules/business/gastronomy/hooks';

function FoodCatalog() {
  const { data: foods = [] } = useGastronomyFoodCatalog({
    territoryFilter: { scope: 'district', district_id: '456' },
    cuisineType: 'japonesa',
    deliveryEnabled: true,
    isOpenNow: true,
  });
}
```

---

### `useGastronomyBusinessSort`

Hook unificado para ordenação e cálculo de proximidade de negócios.

**Uso**:
```typescript
import { useGastronomyBusinessSort } from '@/modules/business/gastronomy/hooks';

function SortedBusinessList() {
  const {
    sortedBusinesses,
    businessDistanceMap,
    nearestDistance,
    hasDistanceData,
  } = useGastronomyBusinessSort({
    businesses: allBusinesses,
    sortBy: 'nearest', // 'relevance' | 'nearest' | 'rating' | 'delivery_time' | 'delivery_fee'
    distanceReferenceCoords: { latitude: -12.9714, longitude: -38.5014 },
  });

  // businessDistanceMap contém distâncias em metros por business_data_id
  const distance = businessDistanceMap.get(business.business_data_id);
}
```

**Parâmetros**:
- `businesses`: Array de `GastronomyBusiness`
- `sortBy`: Critério de ordenação
- `distanceReferenceCoords`: Coordenadas de referência para cálculo de distância

**Retorno**:
- `sortedBusinesses`: Array ordenado
- `businessDistanceMap`: Map<string, number> com distâncias em metros
- `nearestDistance`: Menor distância encontrada
- `hasDistanceData`: Boolean indicando se há dados de distância

---

## 📄 Hooks de Detalhe

### `useGastronomyDetail`

Hook para buscar detalhes de um negócio gastronômico por slug e território.

**Uso**:
```typescript
import { useGastronomyDetail } from '@/modules/business/gastronomy/hooks';

function BusinessDetail() {
  const { data: business, isLoading } = useGastronomyDetail({
    slug: 'restaurante-exemplo',
    state: 'ba',
    city: 'salvador',
    district: 'pelourinho',
  });
}
```

---

### `useGastronomyProfile`

Hook para verificar se um negócio possui perfil gastronômico.

**Uso**:
```typescript
import { useGastronomyProfile } from '@/modules/business/gastronomy/hooks';

function BusinessPage({ businessId }: { businessId: string }) {
  const { data: profile } = useGastronomyProfile(businessId);

  if (profile) {
    return <GastronomyCTA />;
  }
}
```

---

## 🍽️ Hooks de Menu

### `useMenu`

Hook para buscar cardápio completo com categorias e itens.

**Uso**:
```typescript
import { useMenu } from '@/modules/business/gastronomy/hooks';

function MenuDisplay({ menuId }: { menuId: string }) {
  const { data: menu, isLoading } = useMenu(menuId);

  return (
    <div>
      {menu?.categories.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          {category.items.map(item => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

---

### `useMenusByBusiness`

Hook para listar todos os cardápios de um negócio.

**Uso**:
```typescript
import { useMenusByBusiness } from '@/modules/business/gastronomy/hooks';

function BusinessMenus({ businessId }: { businessId: string }) {
  const { data: menus = [] } = useMenusByBusiness(businessId);
}
```

---

### `useMenuItem`

Hook para buscar detalhes de um item específico do cardápio.

**Uso**:
```typescript
import { useMenuItem } from '@/modules/business/gastronomy/hooks';

function ItemDetail({ itemId }: { itemId: string }) {
  const { data: item } = useMenuItem(itemId);
}
```

---

### `useFeaturedItems`

Hook para buscar itens em destaque de um negócio.

**Uso**:
```typescript
import { useFeaturedItems } from '@/modules/business/gastronomy/hooks';

function FeaturedSection({ businessId }: { businessId: string }) {
  const { data: featured = [] } = useFeaturedItems(businessId, 10);
}
```

---

### `useActivePromotions`

Hook para buscar promoções ativas de um negócio.

**Uso**:
```typescript
import { useActivePromotions } from '@/modules/business/gastronomy/hooks';

function PromotionsSection({ businessId }: { businessId: string }) {
  const { data: promotions = [] } = useActivePromotions(businessId);
}
```

---

## 🛒 Hooks de Cart

### `useGastronomyCart`

Hook para gerenciar carrinho de compras com sincronização automática.

**Uso**:
```typescript
import { useGastronomyCart } from '@/modules/business/gastronomy/hooks';

function CartManager({ business }: { business: GastronomyBusiness }) {
  const {
    cart,
    hasCart,
    isCurrentBusinessCart,
    itemCount,
    minimumOrderRemaining,
    minimumOrderReached,
    addItem,
    removeItem,
    clearCart,
  } = useGastronomyCart(business);

  const handleAddItem = () => {
    addItem({
      business_id: business.business_data_id,
      delivery_fee: business.gastronomy_profile.delivery_fee ?? 0,
      item_input: {
        item: menuItem,
        quantity: 1,
        variant_id: selectedVariant?.id,
        addon_quantities: { [addon.id]: 2 },
        special_instructions: 'Sem cebola',
      },
    });
  };
}
```

**Retorno**:
- `cart`: Carrinho atual ou vazio
- `hasCart`: Boolean indicando se há itens no carrinho
- `isCurrentBusinessCart`: Boolean indicando se o carrinho é do negócio atual
- `itemCount`: Quantidade total de itens
- `minimumOrderRemaining`: Valor restante para atingir pedido mínimo
- `minimumOrderReached`: Boolean indicando se atingiu pedido mínimo
- `addItem`: Função para adicionar item
- `removeItem`: Função para remover item
- `clearCart`: Função para limpar carrinho

---

## 💳 Hooks de Checkout

### `useGastronomyCheckout`

Hook para finalizar pedido com integração ao sistema de delivery.

**Uso**:
```typescript
import { useGastronomyCheckout } from '@/modules/business/gastronomy/hooks';

function CheckoutButton({ business, cart }: CheckoutProps) {
  const {
    checkout,
    createdOrder,
    isSubmitting,
    errorMessage,
    hasActiveProfile,
  } = useGastronomyCheckout();

  const handleCheckout = async () => {
    try {
      const order = await checkout({
        business,
        cart,
        payment_method: 'pix',
        notes: 'Entregar na portaria',
      });
      
      console.log('Pedido criado:', order.id);
    } catch (error) {
      console.error('Erro no checkout:', errorMessage);
    }
  };

  if (!hasActiveProfile) {
    return <div>Selecione um perfil ativo</div>;
  }

  return (
    <button onClick={handleCheckout} disabled={isSubmitting}>
      {isSubmitting ? 'Processando...' : 'Finalizar Pedido'}
    </button>
  );
}
```

---

## 🛠️ Hooks de Utilidades

### `useDeliveryDestination`

Hook complexo para gerenciar destino de entrega com GPS, endereço manual e residência salva.

**Uso**:
```typescript
import { useDeliveryDestination } from '@/modules/business/gastronomy/hooks';

function DeliveryManager() {
  const {
    deliveryDestination,
    showDestinationEditor,
    destinationAddressQuery,
    destinationErrorMessage,
    isResolvingDestinationAddress,
    isLocatingUser,
    distanceReferenceCoords,
    destinationSourceLabel,
    hasSavedResidence,
    setShowDestinationEditor,
    setDestinationAddressQuery,
    handleActivateLocation,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
    handleClearDestination,
  } = useDeliveryDestination({
    userId: user?.id,
    resolved: territorialContext?.resolved,
    autoRequestLocation: true,
  });

  // distanceReferenceCoords pode ser usado para cálculos de proximidade
}
```

**Recursos**:
- ✅ Geolocalização automática com fallback IP
- ✅ Entrada manual de endereço com geocoding
- ✅ Uso de residência principal salva
- ✅ Persistência em localStorage
- ✅ Reverse geocoding para melhorar labels
- ✅ Tratamento de erros contextuais

---

## 🎯 Boas Práticas

### 1. Sempre use React Query hooks
Todos os hooks de dados usam React Query para cache automático e revalidação.

### 2. Habilite/desabilite queries condicionalmente
```typescript
const { data } = useGastronomyList(filters, {
  enabled: Boolean(territoryFilter && deliveryDestination),
});
```

### 3. Use o hook unificado de sorting
Não crie lógica de sorting duplicada. Use `useGastronomyBusinessSort` que já inclui cálculo de proximidade.

### 4. Sincronize cart com business context
O hook `useGastronomyCart` sincroniza automaticamente delivery_fee quando o business muda.

### 5. Valide perfil ativo antes de checkout
```typescript
const { hasActiveProfile } = useGastronomyCheckout();

if (!hasActiveProfile) {
  // Mostrar seletor de perfil
}
```

---

## 🚫 Anti-Patterns

### ❌ NÃO faça queries diretas ao Supabase nos componentes
```typescript
// ❌ ERRADO
const { data } = useQuery({
  queryFn: () => supabase.from('gastronomy_profiles').select('*'),
});

// ✅ CORRETO
const { data } = useGastronomyList(filters);
```

### ❌ NÃO duplique lógica de sorting/proximity
```typescript
// ❌ ERRADO
const sorted = businesses.sort((a, b) => {
  const distA = calculateDistance(...);
  const distB = calculateDistance(...);
  return distA - distB;
});

// ✅ CORRETO
const { sortedBusinesses } = useGastronomyBusinessSort({
  businesses,
  sortBy: 'nearest',
  distanceReferenceCoords,
});
```

### ❌ NÃO manipule cart diretamente
```typescript
// ❌ ERRADO
const cart = useGastronomyCartStore(state => state.cart);
cart.items.push(newItem); // Mutação direta!

// ✅ CORRETO
const { addItem } = useGastronomyCart(business);
addItem({ business_id, delivery_fee, item_input });
```

---

## 📊 Hierarquia de Hooks

```
useGastronomyList (listagem paginada)
  └─> useGastronomyBusinessSort (ordenação + proximidade)
      └─> useGastronomyCart (carrinho por negócio)
          └─> useGastronomyCheckout (finalização)

useGastronomyDetail (detalhe do negócio)
  └─> useMenusByBusiness (cardápios)
      └─> useMenu (cardápio completo)
          └─> useMenuItem (item específico)

useDeliveryDestination (destino de entrega)
  └─> usado por useGastronomyBusinessSort para proximidade
```

---

## 🔄 Fluxo Típico de Uso

1. **Landing Page**:
   - `useDeliveryDestination` → obter coordenadas
   - `useGastronomyList` → buscar negócios
   - `useGastronomyBusinessSort` → ordenar e calcular distâncias
   - `useGastronomyFoodCatalog` → buscar pratos

2. **Página de Negócio**:
   - `useGastronomyDetail` → detalhes do negócio
   - `useMenusByBusiness` → listar cardápios
   - `useMenu` → cardápio completo
   - `useGastronomyCart` → gerenciar carrinho

3. **Checkout**:
   - `useGastronomyCart` → validar carrinho
   - `useGastronomyCheckout` → finalizar pedido

---

## 📝 Notas Importantes

- Todos os hooks respeitam o SSOT (Single Source of Truth)
- Nenhum hook faz queries diretas duplicadas
- Lógica de negócio está nos services, não nos hooks
- Hooks são apenas camada de estado/fetch/loading/error
- Use TypeScript para garantir type safety

---

**Última atualização**: 2026-04-10  
**Versão**: 1.0.0  
**Status**: ✅ Validado e documentado
