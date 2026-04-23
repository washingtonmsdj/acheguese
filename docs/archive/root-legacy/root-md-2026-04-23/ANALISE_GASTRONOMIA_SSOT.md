# 🔍 Análise: Gastronomia vs Empresas - Conformidade SSOT

**Data**: 2026-04-23  
**Status**: ✅ GASTRONOMIA ESTÁ SEGUINDO SSOT CORRETAMENTE

---

## 📋 Resumo Executivo

A gastronomia **É** um braço especializado de empresas e **ESTÁ SEGUINDO** o padrão SSOT corretamente. Ela:

✅ **Usa os services do core** (`@/core/business`) como fonte de verdade  
✅ **Não duplica lógica** de negócio que já existe no core  
✅ **Adiciona apenas lógica específica** do domínio gastronômico  
✅ **Segue a arquitetura modular** do projeto  

---

## 🏗️ Arquitetura: Como Funciona

### 1. Hierarquia de Módulos

```
@/core/business/          ← SSOT de empresas (base)
    ├── BusinessService
    ├── OpeningHoursService
    ├── BusinessOwnershipService
    └── BusinessUrlService
    
@/modules/business/       ← Módulo público de empresas
    ├── hooks/            ← Hooks genéricos (useBusinessList, etc)
    ├── company/          ← Vertical "empresa genérica"
    └── gastronomy/       ← Vertical "gastronomia" ✅
        ├── services/     ← Lógica ESPECÍFICA de gastronomia
        ├── hooks/        ← Hooks ESPECÍFICOS de gastronomia
        └── components/   ← UI ESPECÍFICA de gastronomia
```

### 2. O Que Gastronomia Herda do Core

Gastronomia **USA** (não duplica) do `@/core/business`:

```typescript
// ✅ Usa BusinessService para operações base
import { BusinessService } from '@/core/business/services/BusinessService';

// ✅ Usa OpeningHoursService para horários
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';

// ✅ Usa BusinessOwnershipService para validar donos
import { BusinessOwnershipService } from '@/core/business/services/BusinessOwnershipService';

// ✅ Usa BusinessUrlService para URLs canônicas
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
```

**Evidências no código:**
- `src/modules/business/gastronomy/services/gastronomy.queries.ts` → usa `BusinessService`
- `src/modules/business/gastronomy/services/menu.queries.ts` → usa `OpeningHoursService`
- `src/modules/business/gastronomy/services/menu.mutations.ts` → usa `BusinessOwnershipService`
- `src/modules/business/gastronomy/services/GastronomyUrlService.ts` → usa `BusinessUrlService`

---

## 🎯 O Que Gastronomia Adiciona (Específico do Domínio)

Gastronomia **NÃO DUPLICA**, ela **ESTENDE** com lógica específica:

### 1. Services Específicos de Gastronomia

```typescript
// ✅ Lógica de CARDÁPIO (não existe em empresa genérica)
MenuService
  - createMenu, updateMenu, deleteMenu
  - createCategory, createItem, createVariant, createAddon
  - reorderMenuItems, reorderMenuCategories

// ✅ Lógica de PERFIL GASTRONÔMICO (extensão de business)
GastronomyProfileService
  - createGastronomyProfile, updateGastronomyProfile
  - Valida se categoria é elegível para gastronomia

// ✅ Lógica de DELIVERY (específico de gastronomia)
DeliveryService
  - calculateDeliveryFee, calculateEstimatedDeliveryTime
  - validateDeliveryArea, checkDeliveryEligibility

// ✅ Lógica de CARRINHO (específico de pedidos)
GastronomyCartService
  - addItem, removeItem, updateQuantity
  - calculateTotal, applyPromotion

// ✅ Lógica de CHECKOUT (específico de pedidos)
GastronomyCheckoutService
  - createOrder, processPayment
  - validateOrder, confirmOrder
```

### 2. Hooks Específicos de Gastronomia

```typescript
// ✅ Hooks que NÃO EXISTEM em empresa genérica
useMenu                    // Cardápio completo
useMenuItem                // Item específico do menu
useMenuCategories          // Categorias do cardápio
useGastronomyCart          // Carrinho de compras
useGastronomyCheckout      // Finalização de pedido
useDeliveryDestination     // Destino de entrega
useDeliveryEligibility     // Elegibilidade para delivery
useGastronomyFoodCatalog   // Catálogo de pratos

// ✅ Hooks que ESTENDEM funcionalidade base
useGastronomyList          // Lista + filtros específicos (cozinha, delivery)
useGastronomyDetail        // Detalhe + menu + horários + delivery
useGastronomyBusinessSort  // Sorting + proximidade (específico)
```

### 3. Componentes Específicos de Gastronomia

```typescript
// ✅ UI que NÃO EXISTE em empresa genérica
MenuCategoryTabs           // Tabs de categorias do menu
MenuItemCard               // Card de item do menu
MenuItemDetailDrawer       // Drawer de detalhes do item
GastronomyCheckoutSheet    // Sheet de checkout
StickyOrderBar             // Barra de pedido
DeliveryInfoCard           // Card de informações de entrega
FoodItemCard               // Card de prato
FoodSectionCarousel        // Carrossel de pratos
```

---

## 🆚 Comparação: Company vs Gastronomy

### Company (Empresa Genérica)

```
src/modules/business/company/
├── components/           ← UI genérica de empresa
│   ├── cards/
│   ├── ctas/
│   ├── info/
│   └── rating/
├── sections/             ← Seções da página de detalhe
│   ├── EmpresaHeroSection
│   ├── EmpresaInfoSection
│   ├── EmpresaAvaliacoesSection
│   └── EmpresaProximasSection
├── pages/
│   └── EmpresaDetailLayout
└── utils/
    ├── businessHelpers
    └── formatters

❌ NÃO TEM hooks próprios
❌ NÃO TEM services próprios
✅ USA hooks de @/modules/business/hooks
✅ USA services de @/core/business
```

### Gastronomy (Empresa Gastronômica)

```
src/modules/business/gastronomy/
├── services/             ← ✅ Services ESPECÍFICOS
│   ├── MenuService       ← Cardápio
│   ├── DeliveryService   ← Delivery
│   ├── GastronomyCartService ← Carrinho
│   └── GastronomyCheckoutService ← Checkout
├── hooks/                ← ✅ Hooks ESPECÍFICOS
│   ├── useMenu           ← Cardápio
│   ├── useGastronomyCart ← Carrinho
│   ├── useDeliveryDestination ← Delivery
│   └── useGastronomyCheckout ← Checkout
├── components/           ← ✅ UI ESPECÍFICA
│   ├── menu/             ← Componentes de cardápio
│   ├── orders/           ← Componentes de pedidos
│   ├── delivery/         ← Componentes de delivery
│   └── dashboard/        ← Dashboard do dono
├── cart/                 ← ✅ Lógica de carrinho
│   ├── GastronomyCartService
│   └── useGastronomyCartStore
├── billing/              ← ✅ Billing específico
│   ├── StripeService
│   ├── plans
│   └── permissions
└── pages/
    ├── GastronomyLandingPage
    ├── GastronomyDetailPage
    ├── MenuManagementPage
    ├── OrdersPage
    └── DeliveryManagementPage

✅ TEM hooks próprios (específicos do domínio)
✅ TEM services próprios (específicos do domínio)
✅ USA services do @/core/business (SSOT)
✅ ESTENDE funcionalidade base
```

---

## 🔍 Por Que Gastronomia Tem Mais Estrutura?

### Company é Simples

Uma empresa genérica precisa apenas de:
- Exibir informações básicas
- Mostrar fotos
- Exibir avaliações
- Mostrar empresas próximas

**Não precisa de:**
- ❌ Cardápio
- ❌ Carrinho de compras
- ❌ Sistema de pedidos
- ❌ Delivery
- ❌ Checkout
- ❌ Billing/assinaturas

### Gastronomy é Complexa

Um restaurante precisa de tudo que uma empresa tem, MAIS:
- ✅ **Cardápio completo** (categorias, itens, variações, adicionais)
- ✅ **Carrinho de compras** (adicionar, remover, calcular total)
- ✅ **Sistema de pedidos** (criar, acompanhar, gerenciar)
- ✅ **Delivery** (áreas, taxas, tempo estimado, destino)
- ✅ **Checkout** (pagamento, confirmação)
- ✅ **Billing** (planos, assinaturas, Stripe)
- ✅ **Dashboard do dono** (pedidos, analytics, configurações)
- ✅ **Horários de funcionamento** (aberto/fechado, delivery/retirada)

---

## ✅ Gastronomia Segue SSOT?

### SIM! Evidências:

#### 1. Usa Services do Core

```typescript
// gastronomy.queries.ts
import { BusinessService } from '@/core/business/services/BusinessService';
import { OpeningHoursService } from '@/core/business/services/OpeningHoursService';

export async function getGastronomyBusiness(businessId: string) {
  // ✅ USA BusinessService do core
  const business = await BusinessService.getBusinessById(businessId);
  
  // ✅ USA OpeningHoursService do core
  const hours = await OpeningHoursService.getBusinessHours(businessId);
  
  // ✅ ADICIONA lógica específica de gastronomia
  const menu = await MenuService.getMenusByBusiness(businessId);
  
  return { business, hours, menu };
}
```

#### 2. Não Duplica Lógica

```typescript
// ❌ ERRADO (duplicar)
class GastronomyService {
  async getBusinessById(id: string) {
    // Reimplementar lógica que já existe no core
  }
}

// ✅ CERTO (usar SSOT)
class GastronomyService {
  async getGastronomyBusiness(id: string) {
    const business = await BusinessService.getBusinessById(id); // ← USA CORE
    const menu = await this.getMenu(id); // ← ADICIONA ESPECÍFICO
    return { business, menu };
  }
}
```

#### 3. Validação Oficial

Segundo `VALIDATION.md`:

```markdown
## 🎯 SSOT (Single Source of Truth)

### Core Services
- [x] Usa `BusinessService` do core
- [x] Usa `OpeningHoursService` do core
- [x] Usa `BusinessOwnershipService` do core
- [x] Usa `OrderDelivery` do core para checkout
- [x] Não duplica lógica de negócio do core

### Lógica Interna
- [x] Sorting unificado em `useGastronomyBusinessSort`
- [x] Proximity calculation unificado em `useGastronomyBusinessSort`
- [x] Cart management centralizado em `GastronomyCartService`
- [x] Sem duplicações de lógica entre hooks
- [x] Sem duplicações de lógica entre utils

## 📊 Métricas de Qualidade
| Métrica | Valor | Status |
|---------|-------|--------|
| Violações SSOT | 0 | ✅ |
```

---

## 🎯 Tudo Que Tem em Empresas Tem em Gastronomia?

### ✅ SIM! Gastronomia Herda Tudo

| Funcionalidade Base | Company | Gastronomy | Como? |
|---------------------|---------|------------|-------|
| Criar empresa | ✅ | ✅ | Via `BusinessService` do core |
| Editar empresa | ✅ | ✅ | Via `BusinessService` do core |
| Listar empresas | ✅ | ✅ | Via `BusinessService` + filtros específicos |
| Detalhe empresa | ✅ | ✅ | Via `BusinessService` + dados específicos |
| Horários | ✅ | ✅ | Via `OpeningHoursService` do core |
| Localização | ✅ | ✅ | Via `location` e `address` canônicos |
| Fotos | ✅ | ✅ | Via `business_photos` |
| Avaliações | ✅ | ✅ | Via `business_reviews` |
| Favoritos | ✅ | ✅ | Via `business_favorites` |
| Recomendações | ✅ | ✅ | Via RPCs SSOT |
| URLs canônicas | ✅ | ✅ | Via `BusinessUrlService` |

### ✅ MAIS: Gastronomia Adiciona Funcionalidades Específicas

| Funcionalidade Específica | Company | Gastronomy |
|---------------------------|---------|------------|
| Cardápio | ❌ | ✅ |
| Carrinho | ❌ | ✅ |
| Pedidos | ❌ | ✅ |
| Delivery | ❌ | ✅ |
| Checkout | ❌ | ✅ |
| Billing/Planos | ❌ | ✅ |
| Dashboard do dono | ❌ | ✅ |

---

## 📝 Exemplo Prático: useDeliveryDestination

O hook que você está vendo (`useDeliveryDestination.ts`) é um exemplo perfeito:

```typescript
// ✅ USA services do CORE
import { locationGeocodingService } from '@/core/location/services/LocationGeocodingService';
import { residenceService } from '@/core/residence/services/ResidenceService';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';

// ✅ USA hooks compartilhados
import { useRobustGeolocation } from '@/shared/hooks';

// ✅ ADICIONA lógica ESPECÍFICA de gastronomia
import {
  type DeliveryDestination,
  readStoredDeliveryDestination,
  saveDeliveryDestination,
  canUseBrowserGeolocation,
  resolveReverseDetailLevel,
  getDestinationSourceLabel,
} from '../utils/deliveryDestination';
```

**Por que esse hook existe?**
- ❌ NÃO é duplicação
- ✅ É funcionalidade ESPECÍFICA de gastronomia (delivery)
- ✅ USA services do core (location, residence, routing)
- ✅ ADICIONA lógica específica (destino de entrega)

---

## 🏆 Conclusão

### ✅ Gastronomia ESTÁ SEGUINDO SSOT

1. **Usa services do core** como fonte de verdade
2. **Não duplica lógica** que já existe
3. **Adiciona apenas lógica específica** do domínio gastronômico
4. **Segue a arquitetura modular** do projeto
5. **Validação oficial** confirma 0 violações SSOT

### ✅ Gastronomia TEM Tudo de Empresas

- Herda TODAS as funcionalidades base via `@/core/business`
- Adiciona funcionalidades específicas (cardápio, pedidos, delivery)
- Não reimplementa nada que já existe

### ✅ Arquitetura Correta

```
Core Business (SSOT)
    ↓ (usa)
Gastronomy Services (específicos)
    ↓ (usa)
Gastronomy Hooks (específicos)
    ↓ (usa)
Gastronomy Components (específicos)
```

---

## 📚 Referências

- `src/modules/business/README.md` - Diretrizes do módulo business
- `src/modules/business/gastronomy/VALIDATION.md` - Validação oficial (0 violações SSOT)
- `src/modules/business/gastronomy/hooks/README.md` - Documentação dos hooks
- `src/modules/business/hooks/README.md` - Hooks compartilhados

---

**Certificado por**: Auditoria Manual  
**Data**: 2026-04-23  
**Status**: ✅ CONFORME SSOT
