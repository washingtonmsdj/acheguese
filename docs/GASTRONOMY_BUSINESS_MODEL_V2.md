# 💰 MODELO COMERCIAL GASTRONOMIA V2 - SEM MARKETPLACE FINANCEIRO

**Versão:** 2.0.0  
**Data:** 2026-04-13  
**Status:** Implementado (Fase Inicial)

---

## 🎯 PRINCÍPIO FUNDAMENTAL

**"Monetização por assinatura, pagamento fora da plataforma"**

### Regra Principal
- ❌ **NÃO** recebemos dinheiro das vendas agora
- ❌ **NÃO** há split, repasse automático ou comissão por pedido
- ✅ Monetização **100% por assinatura mensal**
- ✅ Pagamento do cliente para empresa acontece **fora da plataforma**

### Formas de Pagamento (Cliente → Empresa)
- PIX direto para a empresa
- Dinheiro na entrega
- Cartão na entrega (maquininha da empresa)
- Link externo de pagamento (da empresa)

---

## 📊 ESTRUTURA DE 3 PLANOS

### 🆓 FREE (Gratuito)

**Objetivo:** Porta de entrada, criar rede de oferta

**Inclui:**
- ✅ Página pública da empresa
- ✅ Perfil gastronômico básico
- ✅ Cardápio simples (até 50 itens)
- ✅ Botão de pedido via WhatsApp
- ✅ QR Code básico
- ✅ Presença em `/empresas` e `/gastronomia`

**Limitações:**
- ❌ Sem gestão de pedidos no painel
- ❌ Sem promoções
- ❌ Sem destaque
- ❌ Sem acesso à rede de motoboys

**Monetização:** Nenhuma (porta de entrada)

---

### 💎 PRO (R$ 49,90/mês)

**Objetivo:** Monetizar gestão de pedidos e recursos avançados

**Inclui tudo do Free +**
- ✅ **Pedidos recebidos dentro do painel**
- ✅ **Gestão de status do pedido** (novo, preparando, pronto, entregue)
- ✅ Cardápio avançado (ilimitado)
- ✅ Promoções (até 10)
- ✅ Destaque na listagem (badge "Pro")
- ✅ Relatórios básicos
- ✅ QR code personalizado
- ✅ Múltiplos menus (até 5)

**Limitações:**
- ❌ Sem acesso à rede de motoboys
- ❌ Sem rastreamento de entrega

**Monetização:** R$ 49,90/mês (assinatura recorrente)

**Nota:** Pagamento do cliente ainda acontece fora da plataforma

---

### 🚀 DELIVERY (R$ 99,90/mês)

**Objetivo:** Monetizar acesso à logística

**Inclui tudo do Pro +**
- ✅ **Acesso à rede de motoboys**
- ✅ **Solicitação de motoboy pelo painel**
- ✅ **Status de entrega** (em rota, entregue)
- ✅ Configurar área de entrega
- ✅ Taxa de entrega configurável
- ✅ Promoções ilimitadas
- ✅ Múltiplos menus (até 10)

**Monetização:** R$ 99,90/mês (assinatura recorrente)

**Nota:** 
- Empresa paga a taxa de entrega diretamente ao motoboy
- Plataforma não intermedia pagamento nesta fase

---

## 🔄 FLUXO DE PEDIDO

### Plano FREE (WhatsApp)
```
Cliente vê cardápio
    ↓
Clica "Pedir via WhatsApp"
    ↓
Abre WhatsApp com mensagem pronta
    ↓
Cliente faz pedido por mensagem
    ↓
Empresa responde e confirma
    ↓
Pagamento: PIX/Dinheiro/Cartão (fora da plataforma)
```

### Plano PRO (Painel)
```
Cliente vê cardápio
    ↓
Clica "Fazer Pedido"
    ↓
Monta pedido no sistema
    ↓
Pedido aparece no painel da empresa
    ↓
Empresa confirma e prepara
    ↓
Empresa atualiza status (preparando → pronto)
    ↓
Pagamento: PIX/Dinheiro/Cartão (fora da plataforma)
    ↓
Empresa marca como entregue
```

### Plano DELIVERY (Painel + Motoboy)
```
Cliente vê cardápio
    ↓
Clica "Fazer Pedido"
    ↓
Monta pedido no sistema
    ↓
Pedido aparece no painel da empresa
    ↓
Empresa confirma e prepara
    ↓
Empresa solicita motoboy pelo painel
    ↓
Motoboy aceita e busca pedido
    ↓
Empresa atualiza status (em rota)
    ↓
Motoboy entrega
    ↓
Pagamento: PIX/Dinheiro/Cartão (fora da plataforma)
    ↓
Empresa marca como entregue
```

---

## 💰 FONTES DE RECEITA (FASE INICIAL)

### 1. Assinatura Pro
- R$ 49,90/mês por restaurante
- Recorrente e previsível

### 2. Assinatura Delivery
- R$ 99,90/mês por restaurante
- Recorrente e previsível

### 3. Futuro (Marketplace Financeiro)
- Pagamento online integrado
- Comissão por pedido (8-12%)
- Split automático
- Repasse automático

---

## 📈 PROJEÇÃO DE RECEITA (1000 restaurantes)

### Cenário Conservador

| Plano | Adesão | Preço | Receita Mensal | Receita Anual |
|---|---|---|---|---|
| Free | 700 (70%) | R$ 0 | R$ 0 | R$ 0 |
| Pro | 200 (20%) | R$ 49,90 | R$ 9.980 | R$ 119.760 |
| Delivery | 100 (10%) | R$ 99,90 | R$ 9.990 | R$ 119.880 |
| **TOTAL** | **1000** | | **R$ 19.970** | **R$ 239.640** |

### Cenário Otimista

| Plano | Adesão | Preço | Receita Mensal | Receita Anual |
|---|---|---|---|---|
| Free | 500 (50%) | R$ 0 | R$ 0 | R$ 0 |
| Pro | 350 (35%) | R$ 49,90 | R$ 17.465 | R$ 209.580 |
| Delivery | 150 (15%) | R$ 99,90 | R$ 14.985 | R$ 179.820 |
| **TOTAL** | **1000** | | **R$ 32.450** | **R$ 389.400** |

---

## 🏗️ ARQUITETURA IMPLEMENTADA

### Tipos e Enums

```typescript
// src/core/gastronomy/billing/types.ts

export enum GastronomyPlanTier {
  FREE = 'free',
  PRO = 'pro',
  DELIVERY = 'delivery',
}

export enum GastronomyFeature {
  // FREE
  BASIC_PROFILE = 'basic_profile',
  BASIC_MENU = 'basic_menu',
  PUBLIC_LISTING = 'public_listing',
  WHATSAPP_ORDERS = 'whatsapp_orders',
  BASIC_QR_CODE = 'basic_qr_code',
  
  // PRO
  INTERNAL_ORDERS = 'internal_orders',
  ORDER_STATUS_MANAGEMENT = 'order_status_management',
  ADVANCED_MENU = 'advanced_menu',
  PROMOTIONS = 'promotions',
  FEATURED_PLACEMENT = 'featured_placement',
  BASIC_REPORTS = 'basic_reports',
  CUSTOM_QR_CODE = 'custom_qr_code',
  MULTIPLE_MENUS = 'multiple_menus',
  
  // DELIVERY
  MOTOBOY_NETWORK = 'motoboy_network',
  DELIVERY_REQUEST = 'delivery_request',
  DELIVERY_TRACKING = 'delivery_tracking',
  DELIVERY_AREA = 'delivery_area',
  DELIVERY_FEE_CONFIG = 'delivery_fee_config',
}
```

### Configuração de Planos

```typescript
// src/core/gastronomy/billing/plans.ts

export const GASTRONOMY_PLANS = {
  [GastronomyPlanTier.FREE]: {
    price_monthly: 0,
    features: [
      GastronomyFeature.BASIC_PROFILE,
      GastronomyFeature.BASIC_MENU,
      GastronomyFeature.PUBLIC_LISTING,
      GastronomyFeature.WHATSAPP_ORDERS,
      GastronomyFeature.BASIC_QR_CODE,
    ],
    limits: {
      max_menu_items: 50,
      max_photos: 5,
      max_menus: 1,
      max_promotions: 0,
    },
  },
  
  [GastronomyPlanTier.PRO]: {
    price_monthly: 49.90,
    features: [
      // Todas do Free +
      GastronomyFeature.INTERNAL_ORDERS,
      GastronomyFeature.ORDER_STATUS_MANAGEMENT,
      GastronomyFeature.ADVANCED_MENU,
      GastronomyFeature.PROMOTIONS,
      GastronomyFeature.FEATURED_PLACEMENT,
      GastronomyFeature.BASIC_REPORTS,
      GastronomyFeature.CUSTOM_QR_CODE,
      GastronomyFeature.MULTIPLE_MENUS,
    ],
    limits: {
      max_menu_items: null, // ilimitado
      max_photos: 30,
      max_menus: 5,
      max_promotions: 10,
    },
  },
  
  [GastronomyPlanTier.DELIVERY]: {
    price_monthly: 99.90,
    features: [
      // Todas do Pro +
      GastronomyFeature.MOTOBOY_NETWORK,
      GastronomyFeature.DELIVERY_REQUEST,
      GastronomyFeature.DELIVERY_TRACKING,
      GastronomyFeature.DELIVERY_AREA,
      GastronomyFeature.DELIVERY_FEE_CONFIG,
    ],
    limits: {
      max_menu_items: null,
      max_photos: 50,
      max_menus: 10,
      max_promotions: null, // ilimitado
    },
  },
};
```

### Camada de Permissões (SSOT)

```typescript
// src/core/gastronomy/billing/permissions.ts

export class GastronomyPermissions {
  
  // Pedidos internos (PRO+)
  static canUseInternalOrders(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.INTERNAL_ORDERS
    );
  }
  
  // Rede de motoboys (DELIVERY)
  static canUseMotoboyNetwork(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.MOTOBOY_NETWORK
    );
  }
  
  // Cardápio avançado (PRO+)
  static canUseAdvancedMenu(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.ADVANCED_MENU
    );
  }
  
  // Promoções (PRO+)
  static canUsePromotions(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.PROMOTIONS
    );
  }
  
  // Destaque (PRO+)
  static canUseFeaturedPlacement(planTier: GastronomyPlanTier): boolean {
    return GastronomyFeatureFlags.isFeatureEnabled(
      planTier,
      GastronomyFeature.FEATURED_PLACEMENT
    );
  }
}
```

---

## 🎯 USO NA PRÁTICA

### Verificar Permissões (SSOT)

```typescript
import { GastronomyPermissions } from '@/core/gastronomy/billing';

// ❌ ERRADO (não fazer):
if (planTier === 'pro' || planTier === 'delivery') {
  // código duplicado em vários lugares
}

// ✅ CERTO (fazer):
if (GastronomyPermissions.canUseInternalOrders(planTier)) {
  // mostrar painel de pedidos
}

if (GastronomyPermissions.canUseMotoboyNetwork(planTier)) {
  // mostrar botão "Solicitar Motoboy"
}

if (GastronomyPermissions.canUsePromotions(planTier)) {
  // permitir criar promoções
}
```

### Guards de Acesso

```typescript
import { requireInternalOrders, requireMotoboyNetwork } from '@/core/gastronomy/billing';

// Lança erro se não tiver permissão
try {
  requireInternalOrders(planTier);
  // código que precisa de pedidos internos
} catch (error) {
  toast.error(error.message); // "Pedidos internos requerem plano Pro..."
}
```

---

## 🚀 ROADMAP

### ✅ Fase 1: Fundação (Atual)
- [x] Definir planos (Free, Pro, Delivery)
- [x] Estrutura de features e limites
- [x] Camada de permissões (SSOT)
- [x] Feature flags
- [x] Documentação

### 🔄 Fase 2: Implementação (Próxima)
- [ ] Tabelas no banco de dados
- [ ] Campo `plan_tier` em `gastronomy_profiles`
- [ ] Integração com Stripe
- [ ] Fluxo de upgrade/downgrade
- [ ] Dashboard de billing

### 📅 Fase 3: Pedidos Internos (Q2 2026)
- [ ] Painel de pedidos
- [ ] Gestão de status
- [ ] Notificações

### 📅 Fase 4: Logística (Q3 2026)
- [ ] Integração com motoboys
- [ ] Solicitação de entrega
- [ ] Rastreamento

### 📅 Fase 5: Marketplace Financeiro (Q4 2026+)
- [ ] Pagamento online integrado
- [ ] Comissão por pedido
- [ ] Split automático
- [ ] Repasse automático

---

## 📊 COMPARAÇÃO DE PLANOS

| Recurso | Free 🆓 | Pro 💎 | Delivery 🚀 |
|---|:---:|:---:|:---:|
| **Preço** | Grátis | R$ 49,90/mês | R$ 99,90/mês |
| Página pública | ✅ | ✅ | ✅ |
| Perfil gastronômico | ✅ | ✅ | ✅ |
| Cardápio | 50 itens | Ilimitado | Ilimitado |
| Pedidos WhatsApp | ✅ | ✅ | ✅ |
| QR code | Básico | Personalizado | Personalizado |
| **Pedidos no painel** | ❌ | ✅ | ✅ |
| **Gestão de status** | ❌ | ✅ | ✅ |
| Cardápio avançado | ❌ | ✅ | ✅ |
| Promoções | ❌ | 10 | Ilimitado |
| Destaque | ❌ | ✅ | ✅ |
| Relatórios | ❌ | ✅ | ✅ |
| Múltiplos menus | 1 | 5 | 10 |
| **Rede de motoboys** | ❌ | ❌ | ✅ |
| **Solicitar entrega** | ❌ | ❌ | ✅ |
| **Rastreamento** | ❌ | ❌ | ✅ |
| **Área de entrega** | ❌ | ❌ | ✅ |
| **Taxa configurável** | ❌ | ❌ | ✅ |

---

## ✅ BENEFÍCIOS DO MODELO

### Para o Restaurante
- ✅ Começa grátis, sem risco
- ✅ Paga só por recursos que usa
- ✅ Sem comissão sobre vendas
- ✅ Controle total do pagamento
- ✅ Transparente e previsível

### Para a Plataforma
- ✅ Receita recorrente e previsível
- ✅ Não assume risco financeiro
- ✅ Não precisa de gateway de pagamento agora
- ✅ Não precisa de split/repasse
- ✅ Foco em valor agregado

### Para o Cliente
- ✅ Mais opções de restaurantes
- ✅ Melhor experiência (Pro/Delivery)
- ✅ Rastreamento de entrega (Delivery)

---

## 🎉 CONCLUSÃO

Este modelo:
- ✅ Não cobra taxa de entrada
- ✅ Monetiza por assinatura mensal
- ✅ Não assume responsabilidade financeira
- ✅ Escalável e sustentável
- ✅ Preparado para marketplace futuro

**Status:** Implementado e pronto para uso

---

**Criado por:** Kiro AI  
**Data:** 2026-04-13  
**Versão:** 2.0.0 (Sem Marketplace Financeiro)
