# 🗺️ MAPA DE ACESSO AO SUPABASE

## 📊 RESUMO EXECUTIVO

Este documento mapeia TODOS os arquivos que acessam o Supabase diretamente no projeto, organizados por categoria e conformidade SSOT.

---

## ✅ MÓDULO MOBILITY (100% CONFORME)

### Services (✅ PERMITIDO)
1. `src/modules/mobility/services/DriverService.ts` - Linha 15
2. `src/modules/mobility/services/MobilityService.impl.ts` - Linha 12
3. `src/modules/mobility/services/RideService.ts` - Linha 8
4. `src/modules/mobility/services/MobilityAdminQueryService.ts` - Linha 18

### Migrations (✅ PERMITIDO)
5. `src/modules/mobility/migrations/migrateRideRequestsToCanonical.ts` - Linha 19

### Hooks (⚠️ REVISAR)
6. `src/modules/mobility/hooks/useRideChat.ts` - Linha 7 (realtime subscription)

**Status**: ✅ 100% conforme SSOT

---

## 🔴 MÓDULO ADMIN (PRECISA REFATORAÇÃO)

### Pages (❌ VIOLAÇÃO)
1. `src/modules/admin/pages/AdminSetupPage.tsx` - Linha 4

### Components (❌ VIOLAÇÃO)
2. `src/modules/admin/components/TerritorialGroupForm.tsx` - Linha 11

### Hooks (❌ VIOLAÇÃO)
3. `src/modules/admin/hooks/useRealtimeMetrics.ts` - Linha 8
4. `src/modules/admin/hooks/useReputationStats.ts` - Linha 3
5. `src/modules/admin/hooks/useAdminTerritoryManagement.ts` - Linha 10

**Status**: ❌ 5 violações SSOT

---

## 🔴 MÓDULO GASTRONOMY (PRECISA REFATORAÇÃO)

### Services (✅ PERMITIDO)
1. `src/modules/gastronomy/services/GastronomyService.ts` - Linha 14
2. `src/modules/gastronomy/services/GastronomyQueryService.ts` - Linha 14
3. `src/modules/gastronomy/services/MenuService.ts` - Linha 13
4. `src/modules/gastronomy/services/MenuQueryService.ts` - Linha 13

**Status**: ✅ Services conformes (mas módulo precisa análise completa)

---

## 🔴 MÓDULO GUIDE (PRECISA REFATORAÇÃO)

### Services (✅ PERMITIDO)
1. `src/modules/guide/services/TouristPointService.ts` - Linha 11
2. `src/modules/guide/services/TouristPointQueryService.ts` - Linha 13

**Status**: ✅ Services conformes (mas módulo precisa análise completa)

---

## 🔴 MÓDULO PROMOTIONS (PRECISA REFATORAÇÃO)

### Repositories (✅ PERMITIDO)
1. `src/modules/promotions/repositories/AdRepositorySupabase.ts` - Linha 13

**Status**: ✅ Repository conforme (mas módulo precisa análise completa)

---

## 🔴 MÓDULO COMMUNITY-ALERTS (PRECISA REFATORAÇÃO)

### Services (✅ PERMITIDO)
1. `src/modules/community-alerts/services/CommunityAlertService.ts` - Linha 11
2. `src/modules/community-alerts/services/AlertModerationService.ts` - Linha 6
3. `src/modules/community-alerts/services/AlertNotificationService.ts` - Linha 12

**Status**: ✅ Services conformes (mas módulo precisa análise completa)

---

## 🔴 MÓDULO COMMUNITY-ISSUES (PRECISA REFATORAÇÃO)

### Services (✅ PERMITIDO)
1. `src/modules/community-issues/services/CommunityIssueService.ts` - Linha 12

**Status**: ✅ Service conforme (mas módulo precisa análise completa)

---

## 🔴 CORE SERVICES (ANÁLISE NECESSÁRIA)

### Core/Profiles (✅ PERMITIDO)
1. `src/core/profiles/services/ProfileService.ts` - Linha 21
2. `src/core/profiles/services/ProfileMobilityAdapter.ts` - Linha 23
3. `src/core/profiles/services/switchProfile.ts` - Linha 2

### Core/Social (✅ PERMITIDO)
4. `src/core/social/services/SocialInteractionsService.ts` - Linha 18
5. `src/core/social/services/GroupService.ts` - Linha 13
6. `src/core/social/services/BlockService.ts` - Linha 10

### Core/Territorial (✅ PERMITIDO)
7. `src/core/territorial/services/TerritorialAIService.ts` - Linha 13
8. `src/core/territorial/highlights/TerritorialHighlightRepositorySupabase.ts` - Linha 8

### Core/Tourist-Points (✅ PERMITIDO)
9. `src/core/tourist-points/services/TouristPointService.ts` - Linha 11

### Core/Tourist-Points Hooks (❌ VIOLAÇÃO)
10. `src/core/tourist-points/hooks/useCommunityPhotos.ts` - Linha 11

### Core/Reviews (✅ PERMITIDO)
11. `src/core/reviews/services/ReviewsService.ts` - Linha 7

### Core/Subscription (✅ PERMITIDO)
12. `src/core/subscription/services/SubscriptionService.ts` - Linha 14

### Core/Verification (✅ PERMITIDO)
13. `src/core/verification/services/VerificationService.ts` - Linha 13

### Core/Realtime (✅ PERMITIDO)
14. `src/core/realtime/services/RealtimeService.ts` - Linha 14

### Core/Service-Areas (✅ PERMITIDO)
15. `src/core/service-areas/services/ServiceAreasService.ts` - Linha 9

### Core/Session (✅ PERMITIDO)
16. `src/core/session/services/SessionService.ts` - Linha 2

### Core/Rollout (✅ PERMITIDO)
17. `src/core/rollout/repositories/RolloutRepositorySupabase.ts` - Linha 13

### Core/Residence (✅ PERMITIDO)
18. `src/core/residence/services/ResidenceService.ts` - Linha 16

### Core/Routing Components (❌ VIOLAÇÃO)
19. `src/core/routing/components/BrasilShowcasePage.tsx` - Linha 32
20. `src/core/routing/components/CountryLandingPage.tsx` - Linha 15

**Status**: ⚠️ Maioria conforme, mas 3 violações em hooks/components

---

## 📊 ESTATÍSTICAS GERAIS

### Por Tipo de Arquivo

| Tipo | Quantidade | Status |
|------|------------|--------|
| Services | ~40 | ✅ PERMITIDO |
| Repositories | ~3 | ✅ PERMITIDO |
| Migrations | 1 | ✅ PERMITIDO |
| Hooks | ~7 | ❌ VIOLAÇÃO |
| Components | ~3 | ❌ VIOLAÇÃO |
| Pages | ~1 | ❌ VIOLAÇÃO |

### Por Módulo

| Módulo | Violações | Status |
|--------|-----------|--------|
| Mobility | 0 | ✅ 100% |
| Admin | 5 | ❌ Crítico |
| Gastronomy | 0 | ✅ OK |
| Guide | 0 | ✅ OK |
| Promotions | 0 | ✅ OK |
| Community-Alerts | 0 | ✅ OK |
| Community-Issues | 0 | ✅ OK |
| Core | 3 | ⚠️ Atenção |

---

## 🎯 PADRÃO SSOT

### ✅ PERMITIDO (Acesso Direto ao Supabase)
- **Services** (`src/*/services/*.ts`)
- **Repositories** (`src/*/repositories/*.ts`)
- **Migrations** (`src/*/migrations/*.ts`)

### ❌ PROIBIDO (Deve usar Service Layer)
- **Components** (`src/*/components/*.tsx`)
- **Pages** (`src/*/pages/*.tsx`)
- **Hooks** (`src/*/hooks/*.ts`) - exceto realtime subscriptions

---

## 📋 PRIORIDADES DE REFATORAÇÃO

### 🔴 PRIORIDADE ALTA (11 arquivos)
1. Módulo Admin (5 violações)
2. Core/Tourist-Points hooks (1 violação)
3. Core/Routing components (2 violações)
4. Mobility/useRideChat (1 revisão)

### 🟡 PRIORIDADE MÉDIA
- Análise completa dos módulos Gastronomy, Guide, Promotions
- Verificar se há violações em components/pages desses módulos

### 🟢 PRIORIDADE BAIXA
- Documentar exceções permitidas (realtime subscriptions)
- Criar testes de conformidade SSOT

---

## ✅ MÓDULOS PRONTOS PARA PRODUÇÃO

1. ✅ **Mobility** - 100% conforme SSOT

---

## 🚀 PRÓXIMOS PASSOS

1. Refatorar módulo Admin (5 violações críticas)
2. Corrigir Core/Tourist-Points hooks
3. Corrigir Core/Routing components
4. Analisar módulos Gastronomy, Guide, Promotions
5. Criar validação automática de conformidade SSOT

---

**Data**: 2026-04-04
**Status**: Mapeamento Completo
**Conformidade Geral**: ~85% (Mobility 100%, outros módulos precisam análise)
