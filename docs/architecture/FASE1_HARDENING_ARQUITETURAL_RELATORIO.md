# FASE 1 - Hardening Arquitetural (Gate-First)

Gerado em: 2026-05-19T06:22:27.150Z

## Problemas encontrados
- Dependencias ciclicas detectadas: 0
- Imports relativos profundos (>= 3 niveis): 0
- Arquivos com acesso DB fora de service/repository: 0
- Services com implementacao duplicada: 0
- Services com aliases/reexports publicos: 27
- Services homonimos em contextos distintos: 2
- Components com implementacao duplicada: 121
- Components com aliases/reexports publicos: 97
- Arquivos grandes (>= 900 linhas): 0
- Violacoes de layer (shared/core boundaries): 0

## Modulos mais criticos
- community
- mobility
- profile/professional
- admin
- landing/routing

## Arquivos mais problematicos

## Riscos arquiteturais

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
- Score Gate-First (ciclos/boundaries/DB/layers): **100/100**
- Score Debt Estrutural (inclui duplicacoes e arquivos gigantes): **100/100**
- Baseline de referencia: 70/100
- Meta desta fase: 85+/100

## Anexos tecnicos
### Duplicacao de services (top)

### Services com aliases/reexports (top)
- `AdminService.ts`: canonic `src/core/admin/services/AdminService.ts`, aliases `src/core/admin/AdminService.ts`, `src/modules/admin/services/AdminService.ts`
- `CommunityIssueService.ts`: canonic `src/core/community/issues/services/CommunityIssueService.ts`, aliases `src/core/community-issues/services/CommunityIssueService.ts`, `src/modules/community/issues/services/CommunityIssueService.ts`
- `LandingFeaturedService.ts`: canonic `src/core/landing/services/LandingFeaturedService.ts`, aliases `src/app/features/landing/services/LandingFeaturedService.ts`
- `AdminVagasService.ts`: canonic `src/core/admin/services/AdminVagasService.ts`, aliases `src/modules/classifieds/jobs/services/AdminVagasService.ts`
- `MobilityAdminQueryService.ts`: canonic `src/core/admin/services/MobilityAdminQueryService.ts`, aliases `src/modules/mobility/services/MobilityAdminQueryService.ts`
- `AnalyticsService.ts`: canonic `src/core/analytics/AnalyticsService.ts`, aliases `src/core/analytics/services/AnalyticsService.ts`
- `AlertModerationService.ts`: canonic `src/core/community/alerts/services/AlertModerationService.ts`, aliases `src/modules/community/alerts/services/AlertModerationService.ts`
- `AlertNotificationService.ts`: canonic `src/core/community/alerts/services/AlertNotificationService.ts`, aliases `src/modules/community/alerts/services/AlertNotificationService.ts`
- `CommunityAlertService.ts`: canonic `src/core/community/alerts/services/CommunityAlertService.ts`, aliases `src/modules/community/alerts/services/CommunityAlertService.ts`
- `CommunityEventsRuntimeService.ts`: canonic `src/core/community/services/CommunityEventsRuntimeService.ts`, aliases `src/core/community-events/services/CommunityEventsRuntimeService.ts`
- `CommunityLocationService.ts`: canonic `src/core/community/services/CommunityLocationService.ts`, aliases `src/modules/community/services/CommunityLocationService.ts`
- `CommunityRolloutService.ts`: canonic `src/core/community/services/CommunityRolloutService.ts`, aliases `src/modules/community/services/CommunityRolloutService.ts`

### Services homonimos por contexto (top)
- `SubscriptionService.ts`: `src/core/billing/services/SubscriptionService.ts`, `src/core/billing/SubscriptionService.ts`, `src/core/subscription/services/SubscriptionService.ts`
- `SessionService.ts`: `src/core/auth/services/SessionService.ts`, `src/core/session/services/SessionService.ts`

### Duplicacao de components (top)
- `ErrorBoundary.tsx`: src/app/components/ErrorBoundary.tsx, src/modules/mobility/components/ErrorBoundary.tsx, src/shared/components/ErrorBoundary.tsx, src/shared/components/errors/ErrorBoundary.tsx, src/shared/components/ui/ErrorBoundary.tsx
- `AlertCard.tsx`: src/core/alerts/components/AlertCard.tsx, src/core/community/alerts/components/AlertCard.tsx, src/modules/admin/components/alerts/AlertCard.tsx, src/modules/community/alerts/components/AlertCard.tsx
- `PostActions.tsx`: src/core/community/components/post-card/PostActions.tsx, src/core/community/components/PostActions.tsx, src/core/community/components/UnifiedPostCard/PostActions.tsx, src/modules/community/components/UnifiedPostCard/PostActions.tsx
- `PostContent.tsx`: src/core/community/components/post-card/PostContent.tsx, src/core/community/components/PostContent.tsx, src/core/community/components/UnifiedPostCard/PostContent.tsx, src/modules/community/components/UnifiedPostCard/PostContent.tsx
- `StatCard.tsx`: src/core/admin/components/stats/StatCard.tsx, src/core/admin/drivers/components/cards/StatCard.tsx, src/modules/admin/components/stats/StatCard.tsx
- `CommentItem.tsx`: src/core/community/components/CommentItem.tsx, src/core/community/components/comments/CommentItem.tsx, src/shared/components/drawer/CommentItem.tsx
- `StepIndicator.tsx`: src/core/community/components/composer/create-post/StepIndicator.tsx, src/modules/business/components/create/StepIndicator.tsx, src/modules/community/components/composer/create-post/StepIndicator.tsx
- `CategoryFilters.tsx`: src/core/community/components/feed/CategoryFilters.tsx, src/modules/community/components/feed/CategoryFilters.tsx, src/shared/components/recomendacoes/CategoryFilters.tsx
- `PostHeader.tsx`: src/core/community/components/post-card/PostHeader.tsx, src/core/community/components/PostHeader.tsx, src/core/community/components/UnifiedPostCard/PostHeader.tsx
- `ContactStep.tsx`: src/modules/business/components/edit/ContactStep.tsx, src/modules/classifieds/components/create/ContactStep.tsx, src/modules/classifieds/jobs/pages/steps/ContactStep.tsx
- `BusinessCard.tsx`: src/app/features/business-landing/components/cards/BusinessCard.tsx, src/modules/business/components/BusinessCard.tsx
- `DashboardHeader.tsx`: src/modules/communication-territorial/v2/agent-dashboard/sections/DashboardHeader.tsx, src/shared/components/dashboard/DashboardHeader.tsx

### Components com aliases/reexports (top)
- `DashboardEmpresaPageV2.tsx`: canonic `src/core/business/services/DashboardEmpresaPageV2.tsx`, aliases `src/app/features/dashboard/pages/DashboardEmpresaPageV2.tsx`, `src/modules/business/pages/DashboardEmpresaPageV2.tsx`
- `BadgeDisplay.tsx`: canonic `src/core/community/components/BadgeDisplay.tsx`, aliases `src/core/gamification/components/BadgeDisplay.tsx`, `src/modules/community/components/BadgeDisplay.tsx`
- `CommunityProfileCard.tsx`: canonic `src/core/community/components/CommunityProfileCard.tsx`, aliases `src/core/gamification/components/CommunityProfileCard.tsx`, `src/modules/community/components/CommunityProfileCard.tsx`
- `Leaderboard.tsx`: canonic `src/core/community/components/Leaderboard.tsx`, aliases `src/core/gamification/components/Leaderboard.tsx`, `src/modules/community/components/Leaderboard.tsx`
- `PostCardSkeleton.tsx`: canonic `src/core/community/components/PostCardSkeleton.tsx`, aliases `src/core/posts/components/PostCardSkeleton.tsx`, `src/modules/community/components/PostCardSkeleton.tsx`
- `UserLevelBadge.tsx`: canonic `src/core/community/components/UserLevelBadge.tsx`, aliases `src/core/gamification/components/UserLevelBadge.tsx`, `src/modules/community/components/UserLevelBadge.tsx`
- `AchadoPerdidoDetailPage.tsx`: canonic `src/core/community/pages/AchadoPerdidoDetailPage.tsx`, aliases `src/core/community-lost-found/pages/AchadoPerdidoDetailPage.tsx`, `src/modules/community-lost-found/pages/AchadoPerdidoDetailPage.tsx`
- `AchadosPerdidosPage.tsx`: canonic `src/core/community/pages/AchadosPerdidosPage.tsx`, aliases `src/core/community-lost-found/pages/AchadosPerdidosPage.tsx`, `src/modules/community-lost-found/pages/AchadosPerdidosPage.tsx`
- `ComunidadePage.tsx`: canonic `src/core/community/pages/ComunidadePage.tsx`, aliases `src/core/community-feed/pages/ComunidadePage.tsx`, `src/modules/community-feed/pages/ComunidadePage.tsx`
- `ExamplePostPage.tsx`: canonic `src/core/community/pages/ExamplePostPage.tsx`, aliases `src/core/community-feed/pages/ExamplePostPage.tsx`, `src/modules/community-feed/pages/ExamplePostPage.tsx`
- `GrupoDetailPage.tsx`: canonic `src/core/community/pages/GrupoDetailPage.tsx`, aliases `src/core/community-groups/pages/GrupoDetailPage.tsx`, `src/modules/community-groups/pages/GrupoDetailPage.tsx`
- `GruposPage.tsx`: canonic `src/core/community/pages/GruposPage.tsx`, aliases `src/core/community-groups/pages/GruposPage.tsx`, `src/modules/community-groups/pages/GruposPage.tsx`

### Imports profundos (top)

### DB fora de service/repository (top)

