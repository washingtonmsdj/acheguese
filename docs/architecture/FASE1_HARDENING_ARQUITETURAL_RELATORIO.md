# FASE 1 - Hardening Arquitetural (Gate-First)

Gerado em: 2026-05-18T21:35:21.863Z

## Problemas encontrados
- Dependencias ciclicas detectadas: 0
- Imports relativos profundos (>= 3 niveis): 0
- Arquivos com acesso DB fora de service/repository: 0
- Services com nome duplicado: 32
- Arquivos grandes (>= 900 linhas): 13
- Violacoes de layer (shared/core boundaries): 0

## Modulos mais criticos
- community
- mobility
- profile/professional
- admin
- landing/routing

## Arquivos mais problematicos
- `src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx` (1061 linhas)
- `src/core/profiles/services/profile.queries.ts` (1036 linhas)
- `src/modules/mobility/core/RideOperationalService.ts` (952 linhas)
- `src/core/maps/components/v3/MapLibreAdapter.tsx` (946 linhas)
- `src/core/business/services/business.queries.ts` (931 linhas)
- `src/app/pages/ClassificadoChatLandingPage.tsx` (929 linhas)
- `src/features/events/pages/EventsListPage.tsx` (924 linhas)
- `src/modules/classifieds/pages/ClassificadoDetailPage.tsx` (924 linhas)
- `src/modules/professionals/services/pages/EditarServicoPage.tsx` (923 linhas)
- `src/features/events/pages/EventsOrganizerDashboard.tsx` (919 linhas)
- `src/core/admin/components/TrustEventsQueue.tsx` (905 linhas)
- `src/core/routing/components/BrasilShowcasePage.tsx` (900 linhas)

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
- Score Debt Estrutural (inclui duplicacoes e arquivos gigantes): **76/100**
- Baseline de referencia: 70/100
- Meta desta fase: 85+/100

## Anexos tecnicos
### Duplicacao de services (top)
- `AdminService.ts`: src/core/admin/AdminService.ts, src/core/admin/services/AdminService.ts, src/modules/admin/services/AdminService.ts
- `SubscriptionService.ts`: src/core/billing/services/SubscriptionService.ts, src/core/billing/SubscriptionService.ts, src/core/subscription/services/SubscriptionService.ts
- `CommunityIssueService.ts`: src/core/community/issues/services/CommunityIssueService.ts, src/core/community-issues/services/CommunityIssueService.ts, src/modules/community/issues/services/CommunityIssueService.ts
- `LandingFeaturedService.ts`: src/app/features/landing/services/LandingFeaturedService.ts, src/core/landing/services/LandingFeaturedService.ts
- `LandingService.ts`: src/app/features/landing/services/LandingService.ts, src/core/landing/services/LandingService.ts
- `AdminVagasService.ts`: src/core/admin/services/AdminVagasService.ts, src/modules/classifieds/jobs/services/AdminVagasService.ts
- `MobilityAdminQueryService.ts`: src/core/admin/services/MobilityAdminQueryService.ts, src/modules/mobility/services/MobilityAdminQueryService.ts
- `AnalyticsService.ts`: src/core/analytics/AnalyticsService.ts, src/core/analytics/services/AnalyticsService.ts
- `SessionService.ts`: src/core/auth/services/SessionService.ts, src/core/session/services/SessionService.ts
- `BusinessService.ts`: src/core/business/services/BusinessService.ts, src/modules/business/services/BusinessService.ts
- `AlertModerationService.ts`: src/core/community/alerts/services/AlertModerationService.ts, src/modules/community/alerts/services/AlertModerationService.ts
- `AlertNotificationService.ts`: src/core/community/alerts/services/AlertNotificationService.ts, src/modules/community/alerts/services/AlertNotificationService.ts

### Duplicacao de components (top)
- `PostActions.tsx`: src/core/community/components/post-card/PostActions.tsx, src/core/community/components/PostActions.tsx, src/core/community/components/UnifiedPostCard/PostActions.tsx, src/modules/community/components/post-card/PostActions.tsx, src/modules/community/components/PostActions.tsx, src/modules/community/components/UnifiedPostCard/PostActions.tsx
- `PostContent.tsx`: src/core/community/components/post-card/PostContent.tsx, src/core/community/components/PostContent.tsx, src/core/community/components/UnifiedPostCard/PostContent.tsx, src/modules/community/components/post-card/PostContent.tsx, src/modules/community/components/PostContent.tsx, src/modules/community/components/UnifiedPostCard/PostContent.tsx
- `PostHeader.tsx`: src/core/community/components/post-card/PostHeader.tsx, src/core/community/components/PostHeader.tsx, src/core/community/components/UnifiedPostCard/PostHeader.tsx, src/modules/community/components/post-card/PostHeader.tsx, src/modules/community/components/PostHeader.tsx, src/modules/community/components/UnifiedPostCard/PostHeader.tsx
- `ErrorBoundary.tsx`: src/app/components/ErrorBoundary.tsx, src/modules/mobility/components/ErrorBoundary.tsx, src/shared/components/ErrorBoundary.tsx, src/shared/components/errors/ErrorBoundary.tsx, src/shared/components/ui/ErrorBoundary.tsx
- `PostCard.tsx`: src/core/community/components/cards/PostCard.tsx, src/core/community/components/PostCard.tsx, src/core/posts/components/PostCard.tsx, src/modules/community/components/cards/PostCard.tsx, src/modules/community/components/PostCard.tsx
- `CommentItem.tsx`: src/core/community/components/CommentItem.tsx, src/core/community/components/comments/CommentItem.tsx, src/modules/community/components/CommentItem.tsx, src/modules/community/components/comments/CommentItem.tsx, src/shared/components/drawer/CommentItem.tsx
- `StatCard.tsx`: src/core/admin/components/stats/StatCard.tsx, src/core/admin/drivers/components/cards/StatCard.tsx, src/modules/admin/components/stats/StatCard.tsx, src/modules/admin/drivers/components/cards/StatCard.tsx
- `AlertCard.tsx`: src/core/alerts/components/AlertCard.tsx, src/core/community/alerts/components/AlertCard.tsx, src/modules/admin/components/alerts/AlertCard.tsx, src/modules/community/alerts/components/AlertCard.tsx
- `CommentForm.tsx`: src/core/community/components/CommentForm.tsx, src/core/community/components/comments/CommentForm.tsx, src/modules/community/components/CommentForm.tsx, src/modules/community/components/comments/CommentForm.tsx
- `CommentsList.tsx`: src/core/community/components/comments/CommentsList.tsx, src/core/community/components/detail-modal/CommentsList.tsx, src/modules/community/components/comments/CommentsList.tsx, src/modules/community/components/detail-modal/CommentsList.tsx
- `CreatePostModal.tsx`: src/core/community/components/composer/CreatePostModal.tsx, src/core/community-feed/components/composer/CreatePostModal.tsx, src/modules/community/components/composer/CreatePostModal.tsx, src/modules/community-feed/components/composer/CreatePostModal.tsx
- `UnifiedComposer.tsx`: src/core/community/components/composer/UnifiedComposer.tsx, src/core/community-feed/components/composer/UnifiedComposer.tsx, src/modules/community/components/composer/UnifiedComposer.tsx, src/modules/community-feed/components/composer/UnifiedComposer.tsx

### Imports profundos (top)

### DB fora de service/repository (top)

