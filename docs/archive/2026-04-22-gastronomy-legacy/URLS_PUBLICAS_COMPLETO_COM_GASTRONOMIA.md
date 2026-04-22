# URLs Públicas Completo - Incluindo Gastronomia

## 📋 Mapa Completo de URLs Públicas

### **1. Perfil Pessoal**
- **Rota**: `/u/:username`
- **Exemplo**: `/u/joaosilva`
- **Service**: `buildPublicProfileUrl(username)`
- **Contexto**: Identidade pessoal/social
- **Status**: ✅ Implementado

---

### **2. Empresa (Institucional)**
- **Rota Completa**: `/empresas/:uf/:cidade/:bairro/:slug`
- **Exemplo**: `/empresas/ba/salvador/barra/restaurante-bom-sabor`
- **Rota Premium**: `/p/:slug` (redireciona para completa)
- **Service**: `BusinessUrlService.getCanonicalUrl(ctx)`
- **Contexto**: Página institucional da empresa
- **Status**: ✅ Implementado

---

### **3. Gastronomia (Vertical Especializado)**
- **Rota**: `/gastronomia/:uf/:cidade/:bairro/:slug`
- **Exemplo**: `/gastronomia/ba/salvador/barra/restaurante-bom-sabor`
- **Service**: `GastronomyUrlService.getCanonicalUrl(ctx)`
- **Contexto**: Cardápio, pedidos, delivery
- **Status**: ✅ Implementado
- **Relação**: Mesma empresa, contexto diferente

**Características**:
- ✅ Reutiliza `BusinessUrlService` internamente
- ✅ Mesma identidade (slug, território)
- ✅ Contexto especializado (cardápio, pedidos)
- ✅ Permissões por plano (FREE, PRO, DELIVERY)

---

### **4. Profissional**
- **Rota**: `/profissionais/:uf/:cidade/:slug`
- **Exemplo**: `/profissionais/ba/salvador/joao-silva-dev`
- **Service**: `ProfessionalUrlService.getCanonicalUrl(ctx)`
- **Contexto**: Serviços profissionais autônomos
- **Status**: ✅ Implementado

---

### **5. Motorista/Motoboy**
- **Rota**: ❌ Sem página pública
- **Contexto**: Informações aparecem em contexto operacional
- **Status**: ✅ Implementado (sem página pública)

---

## 🔗 Relação Empresa ↔ Gastronomia

### **Conceito**
Uma **empresa** pode ter um **vertical de gastronomia** ativo. São duas páginas diferentes da mesma entidade:

```
Restaurante Bom Sabor (empresa)
├── /empresas/ba/salvador/barra/restaurante-bom-sabor
│   └── Página institucional (sobre, contato, horários)
│
└── /gastronomia/ba/salvador/barra/restaurante-bom-sabor
    └── Vertical gastronômico (cardápio, pedidos, delivery)
```

### **Mesma Identidade, Contextos Diferentes**

| Aspecto | Empresa | Gastronomia |
|---------|---------|-------------|
| **Slug** | `restaurante-bom-sabor` | `restaurante-bom-sabor` |
| **Território** | `/ba/salvador/barra` | `/ba/salvador/barra` |
| **Contexto** | Institucional | Operacional |
| **Conteúdo** | Sobre, contato, fotos | Cardápio, pedidos, delivery |
| **Permissões** | Plano business | Plano gastronomy |

### **Navegação Entre Contextos**

```typescript
// Da página institucional para gastronomia
const businessCtx = await BusinessUrlService.resolveById(businessId);
const gastronomyUrl = GastronomyUrlService.getCanonicalUrl(businessCtx);
navigate(gastronomyUrl);

// Da gastronomia para página institucional
const businessCtx = await GastronomyUrlService.resolveById(businessId);
const businessUrl = BusinessUrlService.getCanonicalUrl(businessCtx);
navigate(businessUrl);
```

---

## 🎯 Regras de Permissões de Gastronomia

### **Planos Disponíveis**

| Plano | Preço | Características |
|-------|-------|-----------------|
| **FREE** | Grátis | Cardápio básico (50 itens), WhatsApp |
| **PRO** | R$ 49/mês | Cardápio ilimitado, pedidos internos, promoções |
| **DELIVERY** | R$ 99/mês | Tudo do PRO + rede de motoboys, rastreamento |

### **Matriz de Permissões**

| Funcionalidade | FREE | PRO | DELIVERY |
|----------------|------|-----|----------|
| **Cardápio básico** | ✅ 50 itens | ✅ Ilimitado | ✅ Ilimitado |
| **Pedidos internos** | ❌ | ✅ | ✅ |
| **Rede de motoboys** | ❌ | ❌ | ✅ |
| **Promoções** | ❌ | ✅ 10 | ✅ Ilimitado |
| **Múltiplos menus** | ❌ 1 | ✅ 5 | ✅ 10 |
| **QR code personalizado** | ❌ | ✅ | ✅ |
| **Relatórios** | ❌ | ✅ Básicos | ✅ Básicos |
| **Badge destaque** | ❌ | ✅ "Pro" | ✅ "Delivery" |
| **Rastreamento** | ❌ | ❌ | ✅ |
| **Área de entrega** | ❌ | ❌ | ✅ |

### **Uso das Permissões**

```typescript
import { GastronomyPermissions } from '@/modules/business/gastronomy/billing/permissions';

// Verificar permissão
if (GastronomyPermissions.canUseInternalOrders(planTier)) {
  // Mostrar painel de pedidos
}

if (GastronomyPermissions.canUseMotoboyNetwork(planTier)) {
  // Mostrar botão "Solicitar motoboy"
}

// Obter todas as permissões
const permissions = GastronomyPermissions.getAllPermissions(planTier);
```

---

## 🔄 Fluxo de Ativação de Gastronomia

### **1. Empresa Sem Gastronomia**
```
/empresas/ba/salvador/barra/restaurante
└── Botão: "Ativar Gastronomia"
    └── Cria gastronomy_profile
        └── Redireciona para /gastronomia/ba/salvador/barra/restaurante
```

### **2. Empresa Com Gastronomia**
```
/empresas/ba/salvador/barra/restaurante
├── Link: "Ver Cardápio" → /gastronomia/ba/salvador/barra/restaurante
└── Badge: "Gastronomia Ativa"
```

### **3. Upgrade de Plano**
```
/gastronomia/ba/salvador/barra/restaurante
└── Plano FREE
    └── Banner: "Upgrade para PRO"
        └── Stripe Checkout
            └── Atualiza gastronomy_subscriptions
                └── Libera funcionalidades PRO
```

---

## 📊 Estrutura de Dados

### **business_data**
```sql
CREATE TABLE business_data (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  slug TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES locations(id),
  -- ... outros campos
);
```

### **gastronomy_profiles**
```sql
CREATE TABLE gastronomy_profiles (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES business_data(id),
  plan_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'delivery'
  is_active BOOLEAN DEFAULT true,
  -- ... outros campos
);
```

### **gastronomy_subscriptions**
```sql
CREATE TABLE gastronomy_subscriptions (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES business_data(id),
  plan_tier TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT, -- 'active', 'canceled', 'past_due'
  -- ... outros campos
);
```

---

## 🚀 Exemplos de Uso

### **Criar Link para Gastronomia**

```typescript
import { GastronomyUrlService } from '@/modules/business/gastronomy/services';

// A partir do contexto de business
const ctx = await BusinessUrlService.resolveById(businessId);
const gastronomyUrl = GastronomyUrlService.getCanonicalUrl(ctx);

// Exemplo: /gastronomia/ba/salvador/barra/restaurante-bom-sabor
```

### **Verificar se Empresa Tem Gastronomia**

```typescript
import { GastronomyProfileService } from '@/modules/business/gastronomy/services';

const gastronomyProfile = await GastronomyProfileService.getByBusinessId(businessId);

if (gastronomyProfile && gastronomyProfile.is_active) {
  // Mostrar link para gastronomia
  const ctx = await BusinessUrlService.resolveById(businessId);
  const url = GastronomyUrlService.getCanonicalUrl(ctx);
  navigate(url);
}
```

### **Verificar Permissões e Mostrar Funcionalidades**

```typescript
import { GastronomyPermissions } from '@/modules/business/gastronomy/billing/permissions';

const planTier = gastronomyProfile.plan_tier; // 'free', 'pro', 'delivery'

// Mostrar botão de pedidos internos
{GastronomyPermissions.canUseInternalOrders(planTier) && (
  <Button onClick={handleCreateOrder}>
    Criar Pedido Interno
  </Button>
)}

// Mostrar botão de solicitar motoboy
{GastronomyPermissions.canUseMotoboyNetwork(planTier) && (
  <Button onClick={handleRequestDelivery}>
    Solicitar Motoboy
  </Button>
)}

// Mostrar badge de destaque
{GastronomyPermissions.canUseFeaturedPlacement(planTier) && (
  <Badge>
    {planTier === 'delivery' ? '🚚 Delivery' : '⭐ Pro'}
  </Badge>
)}
```

### **Upgrade de Plano**

```typescript
import { GastronomySubscriptionService } from '@/modules/business/gastronomy/services';

// Fazer upgrade de FREE para PRO
await GastronomySubscriptionService.upgradePlan({
  businessId,
  newPlanTier: 'pro',
  paymentMethodId: 'pm_xxx', // Stripe payment method
});

// Fazer upgrade de PRO para DELIVERY
await GastronomySubscriptionService.upgradePlan({
  businessId,
  newPlanTier: 'delivery',
  paymentMethodId: 'pm_xxx',
});
```

---

## 🎯 Checklist de Implementação

### **URLs e Rotas**
- [x] `BusinessUrlService` - URLs de empresas
- [x] `GastronomyUrlService` - URLs de gastronomia
- [x] Reutilização de contexto (slug, território)
- [x] Navegação entre contextos

### **Permissões**
- [x] `GastronomyPermissions` - Verificação de permissões
- [x] Matriz de permissões por plano
- [x] Guards para funcionalidades restritas

### **Assinaturas**
- [x] `gastronomy_subscriptions` - Tabela de assinaturas
- [x] `GastronomySubscriptionService` - Gerenciamento
- [x] Integração com Stripe
- [x] Upgrade/downgrade de planos

### **UI**
- [x] Páginas públicas de gastronomia
- [x] Verificação de permissões em componentes
- [x] Badges de plano
- [x] Botões condicionais por permissão

---

## ✅ Resultado Final

### **URLs Públicas Completas**

```
✅ /u/:username                                    → Personal
✅ /empresas/:uf/:cidade/:bairro/:slug             → Business
✅ /gastronomia/:uf/:cidade/:bairro/:slug          → Gastronomia
✅ /profissionais/:uf/:cidade/:slug                → Professional
✅ /p/:slug                                        → Business Premium (redirect)
❌ Driver                                          → Sem página pública
```

### **Services SSOT**

```typescript
✅ buildPublicProfileUrl(username)                 → Personal
✅ BusinessUrlService.getCanonicalUrl(ctx)         → Business
✅ GastronomyUrlService.getCanonicalUrl(ctx)       → Gastronomia
✅ ProfessionalUrlService.getCanonicalUrl(ctx)     → Professional
```

### **Permissões**

```typescript
✅ GastronomyPermissions.canUseInternalOrders()    → Pedidos internos
✅ GastronomyPermissions.canUseMotoboyNetwork()    → Rede de motoboys
✅ GastronomyPermissions.canUseAdvancedMenu()      → Cardápio avançado
✅ GastronomyPermissions.canUsePromotions()        → Promoções
✅ GastronomyPermissions.getAllPermissions()       → Todas as permissões
```

---

**Sistema completo de URLs públicas e permissões de gastronomia implementado!** 🚀🍽️

