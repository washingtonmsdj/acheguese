# FASE 1 - Hardening Arquitetural (Gate-First)

Gerado em: 2026-07-08T22:29:45.978Z

## Problemas encontrados

- Dependencias ciclicas detectadas: 7
- Imports relativos profundos (>= 3 niveis): 3
- Arquivos com acesso DB fora de service/repository: 2
- Services com implementacao duplicada: 1
- Services com aliases/reexports publicos: 15
- Services homonimos em contextos distintos: 2
- Components com implementacao duplicada: 26
- Components com aliases/reexports publicos: 24
- Arquivos grandes (>= 900 linhas): 13
- Violacoes de layer (shared/core boundaries): 0

## Modulos mais criticos

- community
- mobility
- profile/professional
- admin
- landing/routing

## Arquivos mais problematicos

- `src/app/pages/CidadeLandingPage.tsx` (1891 linhas)
- `src/core/community/components/composer/CreatePostModal.tsx` (1332 linhas)
- `src/modules/business/education/services/education.queries.ts` (1133 linhas)
- `src/core/work-opportunities/services/WorkOpportunitiesService.ts` (1122 linhas)
- `src/modules/business/gastronomy/services/MenuService.ts` (1025 linhas)
- `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts` (1022 linhas)
- `src/core/maps/components/v3/MapLibreAdapter.tsx` (1020 linhas)
- `src/config/security.config.ts` (1013 linhas)
- `src/core/community/pages/ComunidadePage.tsx` (961 linhas)
- `src/core/pricing/services/PricingService.ts` (956 linhas)
- `src/modules/business/gastronomy/services/menu.queries.ts` (930 linhas)
- `src/core/maps/pages/MapaPageV4.tsx` (912 linhas)

## Riscos arquiteturais

- Ciclo: src/core/routing/hooks/useResolveTerritoryFromUrl.ts -> src/core/routing/utils/publicTerritoryFallbacks.ts -> src/core/routing/hooks/useResolveTerritoryFromUrl.ts
- Resolvido em 2026-07-15: Profile consulta somente
  `core/trust/services/ActiveBanReader.ts`; a antiga dependencia circular pela
  facade generica de Moderation foi removida.
- Ciclo: src/core/session/services/SessionService.ts -> src/core/profiles/services/ProfileService.ts -> src/core/profiles/services/profile.mutations.ts -> src/core/session/services/SessionService.ts
- Ciclo: src/core/session/services/SessionService.ts -> src/core/profiles/services/ProfileService.ts -> src/core/profiles/services/profile.mutations.ts -> src/core/profiles/services/profile.queries.ts -> src/core/session/services/SessionService.ts
- Resolvido em 2026-07-15: o ciclo de Reviews de Gastronomia foi removido;
  `BusinessReviewService` e o adapter de policy e `core/reviews` e o owner.
- Ciclo: src/modules/business/gastronomy/checkout/checkoutRules.ts -> src/modules/business/gastronomy/types/menu.ts -> src/modules/business/gastronomy/checkout/checkoutRules.ts
- Ciclo: src/core/mobility/services/MobilityRpcService.ts -> src/core/mobility/services/MobilityAuditService.ts -> src/core/mobility/services/MobilityRpcService.ts

## Melhorias aplicadas

- Gates de arquitetura e SSOT alinhados com estabilizacao gate-first.
- APIs de service reforcadas para eliminar acesso DB direto em UI.
- Ciclos criticos removidos em profile/professional e mobility driver UI.
- Taxonomia ajustada para modulos oficiais ativos.

## Pendencias restantes

- Duplicacoes amplas em community (componentes/hooks em paralelo) exigem fase dedicada.
- Arquivos grandes ainda exigem fatiamento gradual por responsabilidade.
- Consolidacao estrutural de roots compativeis em core/landing, core/classifieds e core/mobility.

## Score de estabilidade arquitetural

- Score Gate-First (ciclos/boundaries/DB/layers): **49/100**
- Score Debt Estrutural (inclui duplicacoes e arquivos gigantes): **58/100**
- Baseline de referencia: 70/100
- Meta desta fase: 85+/100

## Anexos tecnicos

### Duplicacao de services (top)

- `AnalyticsService.ts`: src/core/analytics/AnalyticsService.ts, src/core/analytics/services/AnalyticsService.ts

### Services com aliases/reexports (top)

- `AdminVagasService.ts`: canonic `src/core/admin/services/AdminVagasService.ts`, aliases `src/modules/classifieds/jobs/services/AdminVagasService.ts`
- `MobilityAdminQueryService.ts`: canonic `src/core/admin/services/MobilityAdminQueryService.ts`, aliases `src/core/mobility/services/MobilityAdminQueryService.ts`
- `TouristPointQueryService.ts`: canonic `src/core/guide/tourist-points/services/TouristPointQueryService.ts`, aliases `src/modules/guide/services/TouristPointQueryService.ts`
- `TouristPointService.ts`: canonic `src/core/guide/tourist-points/services/TouristPointService.ts`, aliases `src/modules/guide/services/TouristPointService.ts`
- `LocationAdminService.ts`: canonic `src/core/location/services/LocationAdminService.ts`, aliases `src/modules/admin/services/LocationAdminService.ts`
- `OrderDraftService.ts`: canonic `src/core/mobility/delivery/order/OrderDraftService.ts`, aliases `src/modules/mobility/delivery/order/OrderDraftService.ts`
- `PaymentContextService.ts`: canonic `src/core/mobility/delivery/payment-context/PaymentContextService.ts`, aliases `src/modules/mobility/delivery/payment-context/PaymentContextService.ts`
- `OrderDeliveryLinkService.ts`: canonic `src/core/mobility/delivery/services/OrderDeliveryLinkService.ts`, aliases `src/modules/mobility/delivery/services/OrderDeliveryLinkService.ts`
- `OrderDeliveryNotificationService.ts`: canonic `src/core/mobility/delivery/services/OrderDeliveryNotificationService.ts`, aliases `src/modules/mobility/delivery/services/OrderDeliveryNotificationService.ts`
- `OrderDeliverySSOTService.ts`: canonic `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts`, aliases `src/modules/mobility/delivery/services/OrderDeliverySSOTService.ts`
- `SettlementContextService.ts`: canonic `src/core/mobility/delivery/settlement-context/SettlementContextService.ts`, aliases `src/modules/mobility/delivery/settlement-context/SettlementContextService.ts`
- `DriverService.ts`: canonic `src/core/mobility/services/DriverService.impl.ts`, aliases `src/core/mobility/services/DriverService.ts`

### Services homonimos por contexto (top)

- `SubscriptionService.ts`: `src/core/billing/services/SubscriptionService.ts`, `src/core/billing/SubscriptionService.ts`, `src/core/subscription/services/SubscriptionService.ts`
- `SessionService.ts`: `src/core/auth/services/SessionService.ts`, `src/core/session/services/SessionService.ts`

### Duplicacao de components (top)

- `ErrorBoundary.tsx`: src/app/components/ErrorBoundary.tsx, src/modules/mobility/components/ErrorBoundary.tsx, src/shared/components/errors/ErrorBoundary.tsx
- `CommentItem.tsx`: src/core/community/components/CommentItem.tsx, src/core/community/components/comments/CommentItem.tsx, src/shared/components/drawer/CommentItem.tsx
- `ContactStep.tsx`: src/modules/business/components/edit/ContactStep.tsx, src/modules/classifieds/components/create/ContactStep.tsx, src/modules/classifieds/jobs/pages/steps/ContactStep.tsx
- `BottomNav.tsx`: src/app/components/BottomNav.tsx, src/core/navigation/BottomNav.tsx
- `MobilitySettingsPanel.tsx`: src/core/admin/components/MobilitySettingsPanel.tsx, src/modules/admin/components/MobilitySettingsPanel.tsx
- `StatCard.tsx`: src/core/admin/components/stats/StatCard.tsx, src/core/admin/drivers/components/cards/StatCard.tsx
- `StatusBadge.tsx`: src/core/admin/identity/components/badges/StatusBadge.tsx, src/modules/mobility/components/StatusBadge.tsx
- `AlertCard.tsx`: src/core/alerts/components/AlertCard.tsx, src/core/community/alerts/components/AlertCard.tsx
- `AnalyticsDashboard.tsx`: src/core/business/components/AnalyticsDashboard.tsx, src/modules/business/components/AnalyticsDashboard.tsx
- `CouponManager.tsx`: src/core/business/components/CouponManager.tsx, src/modules/business/components/CouponManager.tsx
- `EmpresaDashboardTab.tsx`: src/core/business/components/EmpresaDashboardTab.tsx, src/modules/business/components/EmpresaDashboardTab.tsx
- `SubscriptionPlans.tsx`: src/core/business/components/SubscriptionPlans.tsx, src/modules/business/components/SubscriptionPlans.tsx

### Components com aliases/reexports (top)

- `PostCard.tsx`: canonic `src/core/community/components/cards/PostCard.tsx`, aliases `src/core/community/components/PostCard.tsx`, `src/core/posts/components/PostCard.tsx`
- `CreatePostModal.tsx`: canonic `src/core/community/components/composer/CreatePostModal.tsx`; aliases em `src/modules/community-feed` e `src/core/community-feed` removidos.
- `UnifiedComposer.tsx`: canonic `src/core/community/components/composer/UnifiedComposer.tsx`; aliases em `src/modules/community-feed` e `src/core/community-feed` removidos.
- `AchadoPerdidoDetailPage.tsx`: canonic `src/core/community/pages/AchadoPerdidoDetailPage.tsx`, alias ativo `src/core/community-lost-found/pages/AchadoPerdidoDetailPage.tsx`; alias vazio em `src/modules/community-lost-found/pages/AchadoPerdidoDetailPage.tsx` removido em 2026-07-09.
- `AchadosPerdidosPage.tsx`: canonic `src/core/community/pages/AchadosPerdidosPage.tsx`, alias ativo `src/core/community-lost-found/pages/AchadosPerdidosPage.tsx`; alias vazio em `src/modules/community-lost-found/pages/AchadosPerdidosPage.tsx` removido em 2026-07-09.
- `ComunidadePage.tsx`: canonic `src/core/community/pages/ComunidadePage.tsx`; aliases em `src/modules/community-feed` e `src/core/community-feed` removidos.
- `GrupoDetailPage.tsx`: canonic `src/core/community/pages/GrupoDetailPage.tsx`, alias ativo `src/core/community-groups/pages/GrupoDetailPage.tsx`; alias vazio em `src/modules/community-groups/pages/GrupoDetailPage.tsx` removido em 2026-07-09.
- `GruposPage.tsx`: canonic `src/core/community/pages/GruposPage.tsx`, alias ativo `src/core/community-groups/pages/GruposPage.tsx`; alias vazio em `src/modules/community-groups/pages/GruposPage.tsx` removido em 2026-07-09.
- `NovaRecomendacaoPage.tsx`: canonic `src/core/community/pages/NovaRecomendacaoPage.tsx`, alias ativo `src/core/community-recommendations/pages/NovaRecomendacaoPage.tsx`; alias vazio em `src/modules/community-recommendations/pages/NovaRecomendacaoPage.tsx` removido em 2026-07-09.
- `NovoAchadoPerdidoPage.tsx`: canonic `src/core/community/pages/NovoAchadoPerdidoPage.tsx`, alias ativo `src/core/community-lost-found/pages/NovoAchadoPerdidoPage.tsx`; alias vazio em `src/modules/community-lost-found/pages/NovoAchadoPerdidoPage.tsx` removido em 2026-07-09.
- `NovoPostPage.tsx`: canonic `src/core/community/pages/NovoPostPage.tsx`; aliases em `src/modules/community-feed` e `src/core/community-feed` removidos.
- `RecomendacaoDetailPage.tsx`: canonic `src/core/community/pages/RecomendacaoDetailPage.tsx`, alias ativo `src/core/community-recommendations/pages/RecomendacaoDetailPage.tsx`; alias vazio em `src/modules/community-recommendations/pages/RecomendacaoDetailPage.tsx` removido em 2026-07-09.

### Imports profundos (top)

- `src/modules/business/gastronomy/niches/pizzaria/components/PizzaAdminPanel.tsx` -> `../../../utils/currency` (subidas: 3)
- `src/modules/business/gastronomy/niches/pizzaria/components/PizzaBuilder.tsx` -> `../../../utils/currency` (subidas: 3)
- `src/modules/business/gastronomy/niches/pizzaria/components/PizzaPredefinedBuilder.tsx` -> `../../../utils/currency` (subidas: 3)

### DB fora de service/repository (top)

- `src/core/infrastructure/edge-functions/edgeFunctionBroker.ts`
- `src/modules/ai/core/client/aiClient.ts`
