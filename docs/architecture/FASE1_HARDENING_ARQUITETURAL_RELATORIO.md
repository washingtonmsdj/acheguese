# FASE 1 - Hardening Arquitetural (Gate-First)

Gerado em: 2026-05-19T00:56:36.354Z

## Problemas encontrados
- Dependencias ciclicas detectadas: 0
- Imports relativos profundos (>= 3 niveis): 0
- Arquivos com acesso DB fora de service/repository: 0
- Services com implementacao duplicada: 0
- Services com aliases/reexports publicos: 27
- Services homonimos em contextos distintos: 2
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
- `PostCard.tsx`: src/core/community/components/cards/PostCard.tsx, src/core/community/components/PostCard.tsx, src/core/posts/components/PostCard.tsx, src/modules/community/components/cards/PostCard.tsx, src/modules/community/components/PostCard.tsx
- `StatCard.tsx`: src/core/admin/components/stats/StatCard.tsx, src/core/admin/drivers/components/cards/StatCard.tsx, src/modules/admin/components/stats/StatCard.tsx, src/modules/admin/drivers/components/cards/StatCard.tsx
- `AlertCard.tsx`: src/core/alerts/components/AlertCard.tsx, src/core/community/alerts/components/AlertCard.tsx, src/modules/admin/components/alerts/AlertCard.tsx, src/modules/community/alerts/components/AlertCard.tsx
- `CommentItem.tsx`: src/core/community/components/CommentItem.tsx, src/core/community/components/comments/CommentItem.tsx, src/modules/community/components/CommentItem.tsx, src/shared/components/drawer/CommentItem.tsx
- `CreatePostModal.tsx`: src/core/community/components/composer/CreatePostModal.tsx, src/core/community-feed/components/composer/CreatePostModal.tsx, src/modules/community/components/composer/CreatePostModal.tsx, src/modules/community-feed/components/composer/CreatePostModal.tsx
- `UnifiedComposer.tsx`: src/core/community/components/composer/UnifiedComposer.tsx, src/core/community-feed/components/composer/UnifiedComposer.tsx, src/modules/community/components/composer/UnifiedComposer.tsx, src/modules/community-feed/components/composer/UnifiedComposer.tsx
- `PostActions.tsx`: src/core/community/components/post-card/PostActions.tsx, src/core/community/components/PostActions.tsx, src/core/community/components/UnifiedPostCard/PostActions.tsx, src/modules/community/components/UnifiedPostCard/PostActions.tsx
- `PostContent.tsx`: src/core/community/components/post-card/PostContent.tsx, src/core/community/components/PostContent.tsx, src/core/community/components/UnifiedPostCard/PostContent.tsx, src/modules/community/components/UnifiedPostCard/PostContent.tsx
- `ComunidadePage.tsx`: src/core/community/pages/ComunidadePage.tsx, src/core/community-feed/pages/ComunidadePage.tsx, src/modules/community/pages/ComunidadePage.tsx, src/modules/community-feed/pages/ComunidadePage.tsx
- `DashboardHeader.tsx`: src/app/features/dashboard/components/DashboardHeader.tsx, src/modules/communication-territorial/v2/agent-dashboard/sections/DashboardHeader.tsx, src/shared/components/dashboard/DashboardHeader.tsx
- `DashboardEmpresaPageV2.tsx`: src/app/features/dashboard/pages/DashboardEmpresaPageV2.tsx, src/core/business/services/DashboardEmpresaPageV2.tsx, src/modules/business/pages/DashboardEmpresaPageV2.tsx

### Imports profundos (top)

### DB fora de service/repository (top)

