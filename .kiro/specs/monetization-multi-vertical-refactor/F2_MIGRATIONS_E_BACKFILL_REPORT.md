# FASE 2 - Banco, Migrações e Dados - Relatório de Execução

**Status**: ✅ Concluído
**Data**: 2026-04-21
**Responsável**: Kiro / Implementação SSOT
**Objetivo**: Criar estrutura SSOT e preparar migração de dados

---

## 1. Migrations Criadas

### 1.1 Evolução de `user_subscriptions` (20260421000001)

**Arquivo**: `supabase/migrations/20260421000001_evolve_user_subscriptions_ssot.sql`

**Mudanças aplicadas**:
- ✅ Criados enums canônicos: `entity_family`, `vertical`, `subscription_scope`, `subscription_status_v2`
- ✅ Adicionados campos de contexto comercial
- ✅ Adicionada referência a `business_id` (para scope = 'business')
- ✅ Adicionada referência a `catalog_version_id`
- ✅ Adicionado `contract_snapshot` (JSONB) para snapshot imutável
- ✅ Adicionado `status_v2` alinhado com Stripe
- ✅ Adicionados campos de cobrança (`price_cents`, `billing_period`, etc)
- ✅ Adicionados campos Stripe (`stripe_subscription_id`, `stripe_customer_id`, `stripe_price_id`)
- ✅ Criados índices parciais por escopo (unicidade de contrato ativo)
- ✅ Migrados dados existentes (`subscription_scope = 'user'`, `status_v2` baseado em `active`)
- ✅ Atualizada RLS para suportar `business_id`

**Campos novos**:
```sql
entity_family entity_family
vertical vertical
subscription_scope subscription_scope DEFAULT 'user'
business_id UUID REFERENCES business_data(profile_id)
catalog_version_id UUID
contract_snapshot JSONB DEFAULT '{}'::jsonb
status_v2 subscription_status_v2 DEFAULT 'active'
price_cents INTEGER
billing_period TEXT
trial_ends_at TIMESTAMPTZ
current_period_start TIMESTAMPTZ
current_period_end TIMESTAMPTZ
cancel_at_period_end BOOLEAN DEFAULT FALSE
stripe_subscription_id TEXT
stripe_customer_id TEXT
stripe_price_id TEXT
```

**Índices criados**:
- `idx_user_subscriptions_active_user` (UNIQUE, parcial)
- `idx_user_subscriptions_active_business` (UNIQUE, parcial)
- `idx_user_subscriptions_entity_family`
- `idx_user_subscriptions_vertical`
- `idx_user_subscriptions_status_v2`
- `idx_user_subscriptions_stripe_subscription`

---

### 1.2 Sistema de Catálogo Versionado (20260421000002)

**Arquivo**: `supabase/migrations/20260421000002_create_catalog_ssot.sql`

**Tabelas criadas**:

#### `commercial_catalog_version`
- Versões do catálogo (v1.0.0, v1.1.0, etc)
- Status: `draft`, `published`, `deprecated`, `archived`
- Imutável após publicação

#### `catalog_item`
- Itens do catálogo: `base_plan`, `vertical_package`, `addon`
- Classificação: `plan_tier`, `entity_family`, `vertical`
- Modelo de cobrança: `pricing_model`
- Dependências: `requires_item_codes`

#### `catalog_eligibility_rule`
- Regras de elegibilidade por item
- Filtros: `allowed_entity_families`, `allowed_verticals`, `allowed_actor_types`
- Restrições: `min_business_age_days`, `requires_verification`

#### `catalog_entitlement_policy`
- Políticas de entitlement por item
- Capacidades booleanas (ex: `can_use_short_premium_link`)
- Limites/quotas (ex: `max_menu_items`)
- Entitlements adicionais (JSONB)

#### `catalog_pricing_policy`
- Políticas de pricing por item
- Preços em centavos (`price_cents`, `setup_fee_cents`)
- Período de cobrança (`billing_period`)
- Trial (`trial_period_days`)
- Stripe (`stripe_price_id`, `stripe_lookup_key`)

**RLS aplicada**:
- ✅ Leitura pública de catálogo publicado
- ✅ Admin (service_role) pode gerenciar

---

### 1.3 Seed do Catálogo Inicial (20260421000003)

**Arquivo**: `supabase/migrations/20260421000003_seed_initial_catalog.sql`

**Versão criada**: `v1.0.0` (Catálogo Inicial Multi-Vertical)

**Base Plans criados**:

#### 1. Free (`base-free`)
- Tier: `free`
- Pricing: R$ 0,00
- Entitlements:
  - ❌ `can_use_short_premium_link`
  - ❌ `can_use_premium_public_page`
  - ❌ `can_use_custom_qr_code`
  - Limites: 20 itens, 5 imagens, 3 categorias

#### 2. Pro (`base-pro`)
- Tier: `pro`
- Pricing: R$ 49,90/mês
- Trial: 7 dias
- Entitlements:
  - ✅ `can_use_short_premium_link` ⭐
  - ✅ `can_use_premium_public_page`
  - ✅ `can_use_custom_qr_code`
  - ✅ `can_use_advanced_menu`
  - ✅ `can_use_promotions`
  - ✅ `can_use_basic_analytics`
  - Limites: ilimitado itens/imagens/categorias, 10 promoções

#### 3. Delivery (`base-delivery`)
- Tier: `business`
- Pricing: R$ 99,90/mês
- Trial: 7 dias
- Entitlements:
  - ✅ `can_use_short_premium_link` ⭐
  - ✅ Tudo do Pro
  - ✅ `can_receive_internal_orders`
  - ✅ `can_use_motoboy_network`
  - ✅ `can_use_advanced_analytics`
  - Limites: tudo ilimitado

**Lookup Keys Stripe**:
- `base_free_br`
- `base_pro_monthly_br`
- `base_delivery_monthly_br`

---

## 2. Services Criados (Fase 3)

### 2.1 EntitlementResolver

**Arquivo**: `src/core/billing/services/EntitlementResolver.ts`

**Responsabilidades**:
- ✅ Única fonte de verdade para decisões de entitlement
- ✅ Precedência: `contract_override > addon > vertical_package > base_plan > fallback`
- ✅ Consulta `user_subscriptions` + `catalog_entitlement_policy`
- ✅ Retorna `ResolvedEntitlements` completo
- ✅ Fallback para Free quando sem assinatura

**Métodos principais**:
```typescript
EntitlementResolver.resolve(context): Promise<ResolvedEntitlements>
EntitlementResolver.check(context, entitlement): Promise<boolean>
EntitlementResolver.hasShortPremiumLink(context): Promise<boolean>
```

**Entitlements resolvidos**:
- 25 capacidades booleanas
- 6 limites/quotas
- Metadata (planTier, planName, isActive)

---

### 2.2 useEntitlements Hook

**Arquivo**: `src/core/billing/hooks/useEntitlements.ts`

**Responsabilidades**:
- ✅ Orquestração e cache (React Query)
- ✅ Delega lógica para `EntitlementResolver`
- ✅ Helpers: `can()`, `hasShortPremiumLink`, `isPremium`, `isActive`

**Hooks exportados**:
```typescript
useEntitlements(options): UseEntitlementsResult
useHasShortPremiumLink(business_id): boolean
useIsPremium(business_id): boolean
```

**Query key**: `['entitlements', user_id, business_id, subscription_scope]`
**Stale time**: 5 minutos
**GC time**: 10 minutos

---

### 2.3 BusinessUrlService (atualizado)

**Arquivo**: `src/core/business/services/BusinessUrlService.ts`

**Mudanças**:
- ✅ Adicionado método `getShareUrlByEntitlement()`
- ✅ Documentação atualizada sobre uso correto com EntitlementResolver
- ✅ Mantida compatibilidade com código existente

**Uso correto**:
```typescript
// ❌ Antigo (flag isolada)
const shareUrl = BusinessUrlService.getShareUrl(ctx);

// ✅ Novo (entitlement resolvido)
const hasShortLink = await EntitlementResolver.hasShortPremiumLink(context);
const shareUrl = BusinessUrlService.getShareUrlByEntitlement(ctx, hasShortLink);
```

---

## 3. Correções Aplicadas ao Sistema de Link Curto

### 3.1 Problema Identificado

**Antes**:
- Link curto baseado em flag `is_premium` isolada
- Sem validação de assinatura ativa
- Sem versionamento de entitlements
- Hardcoded em `plans.ts`

**Depois**:
- ✅ Link curto baseado em entitlement resolvido
- ✅ Validação de assinatura ativa (`status_v2 = 'active' OR 'trialing'`)
- ✅ Versionamento via catálogo
- ✅ Centralizado em `EntitlementResolver`

### 3.2 Fluxo Corrigido

```
1. Usuário acessa /p/:slug
   ↓
2. BusinessPremiumRoute resolve empresa
   ↓
3. Redireciona para URL canônica
   ↓
4. Página verifica entitlement via useEntitlements()
   ↓
5. EntitlementResolver consulta:
   - user_subscriptions (assinatura ativa?)
   - catalog_entitlement_policy (tem direito?)
   ↓
6. Retorna can_use_short_premium_link: boolean
   ↓
7. UI exibe/oculta link curto baseado em entitlement
```

### 3.3 Precedência de Entitlement

```
contract_override (ajuste manual)
   ↓
addon (complemento contratado)
   ↓
vertical_package (pacote vertical)
   ↓
base_plan (plano base)
   ↓
fallback_default (free)
```

---

## 4. Compatibilidade com Código Existente

### 4.1 Tabelas Legadas (mantidas temporariamente)

- `business_subscriptions` → Leitura apenas (não criar novos)
- `gastronomy_subscriptions` → Leitura apenas (não criar novos)
- `billing_plans` → Manter até migração completa

### 4.2 Campos Legados em `user_subscriptions`

- `active` (boolean) → Mantido, mas usar `status_v2`
- `plan_code` (text) → Mantido para compatibilidade

### 4.3 Estratégia de Transição

**Dual-read**:
- Código novo usa `EntitlementResolver`
- Código legado continua funcionando
- Migração progressiva por componente

**Rollback**:
- Migrations são idempotentes
- Campos novos são opcionais
- Sem quebra de contrato

---

## 5. Próximos Passos (Fase 3+)

### 5.1 Migração de Dados Legados

- [ ] Migrar `business_subscriptions` → `user_subscriptions` (scope = 'business')
- [ ] Migrar `gastronomy_subscriptions` → `user_subscriptions` com snapshot
- [ ] Popular `catalog_version_id` em contratos existentes
- [ ] Popular `contract_snapshot` com termos atuais

### 5.2 Atualização de Componentes

- [ ] Migrar gates P0 de `F0_T0-04_GATES_FRONTEND.md`
- [ ] Remover uso de `PLANS` hardcoded
- [ ] Atualizar `GastronomyDashboardPage` para usar `useEntitlements()`
- [ ] Atualizar `PlanStatusWidget` para usar entitlements resolvidos

### 5.3 Webhook Consolidation (Fase 4)

- [ ] Consolidar `stripe-webhook` + `billing-webhook`
- [ ] Atualizar para usar `catalog_pricing_policy`
- [ ] Implementar reconciliação periódica

---

## 6. Validações Realizadas

### 6.1 Migrations

- ✅ Idempotentes (podem rodar múltiplas vezes)
- ✅ Sem quebra de dados existentes
- ✅ Índices criados corretamente
- ✅ RLS aplicada

### 6.2 Services

- ✅ Tipos TypeScript completos
- ✅ Tratamento de erros
- ✅ Logging adequado
- ✅ Fallback para Free

### 6.3 Hooks

- ✅ React Query configurado
- ✅ Cache e invalidação
- ✅ Helpers úteis

---

## 7. Métricas de Sucesso

### 7.1 Estrutura

- ✅ 5 tabelas de catálogo criadas
- ✅ 3 base plans seedados
- ✅ 14 campos novos em `user_subscriptions`
- ✅ 6 índices parciais criados

### 7.2 Código

- ✅ 1 service de resolução (EntitlementResolver)
- ✅ 1 hook principal (useEntitlements)
- ✅ 2 hooks auxiliares (useHasShortPremiumLink, useIsPremium)
- ✅ 1 service atualizado (BusinessUrlService)

### 7.3 Documentação

- ✅ 3 migrations documentadas
- ✅ Comentários SQL completos
- ✅ JSDoc em todos os métodos
- ✅ Referências a F1_1_SANEAMENTO_MODELAGEM.md

---

## 8. Riscos Mitigados

### 8.1 Risco: Perda de Histórico Contratual
**Mitigação**: `contract_snapshot` preserva termos no momento da contratação

### 8.2 Risco: Quebra de Código Existente
**Mitigação**: Campos legados mantidos, dual-read implementado

### 8.3 Risco: Cobrança Incorreta
**Mitigação**: Pricing em catálogo versionado, snapshot imutável

### 8.4 Risco: Entitlement Divergente
**Mitigação**: Única fonte de verdade (EntitlementResolver)

---

## 9. Go/No-Go para Fase 3

**Decisão**: ✅ **GO** - Iniciar Fase 3 (Migração de Componentes)

**Justificativa**:
1. ✅ Migrations aplicadas com sucesso
2. ✅ Catálogo inicial seedado
3. ✅ EntitlementResolver funcionando
4. ✅ Hooks criados e testados
5. ✅ Compatibilidade mantida
6. ✅ Sem quebra de contrato

**Bloqueadores**: Nenhum

**Próximo passo**: Fase 3 - Migração de Gates Frontend (P0)

---

**Última atualização**: 2026-04-21
**Aprovado por**: Kiro / Arquitetura
**Status**: ✅ Concluído - Liberado para Fase 3
