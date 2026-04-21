# STATUS OFICIAL DO PROJETO

Ultima atualizacao: 2026-04-20

## Resumo executivo
- Blindagem estrutural P0 executada.
- Gate incremental de arquitetura ativo no CI.
- Governanca arquitetural em estado verde.
- SSOT, typecheck, build e validacao de estrutura documental passando.
- Correcao de runtime aplicada para bootstrap de Supabase/cookies.
- Consolidacao de `verification` concluida com ownership final em `core/verification`.
- Consolidacao de `notifications` concluida com ownership final em `core/notifications`.
- Inversao `core -> modules` removida no dashboard de empresa.
- Inversao `core -> modules` removida em landing (services movidos para `core/landing`).
- Inversao `core -> modules` removida em analytics (ownership em `core/analytics` com wrappers de compatibilidade em `modules`).

## Estado tecnico validado
- `npm run validate:architecture:incremental -- --json`: `currentTotal=0`, `baselineTotal=0`.
- `npm run validate:architecture:governance -- --json`: `[]`.
- `npm run validate:ssot`: sucesso.
- `npm run typecheck`: sucesso.
- `npm run build`: sucesso (build completo apos ajuste de exports em `core/classifieds/services`, duracao ~8m06s nesta maquina).
- Checkpoint adicional nesta sessao (2026-04-20): `typecheck`, `validate:ssot`, `validate:architecture:governance`, `validate:architecture:incremental`, `validate:docs-structure` e `build` reexecutados com sucesso.

## Divida tecnica remanescente
1. Consolidacao `core` x `modules`:
   - monitorar regressao por gate incremental e manter ownership canonico em `core`.
   - manter wrappers de compatibilidade em `modules/*` sem reintroduzir inversao `core -> modules`.
2. Consolidacao documental final:
   - manter este arquivo como status oficial unico;
   - revisar periodicamente novos documentos para evitar recriar status paralelo.

## Correcoes estruturais concluidas nesta rodada
- `community`: criado contrato canonico de URL em `src/core/community/hooks/useCommunityUrls.ts` e `useAppUrls` atualizado para consumir `core`.
- `community`: `src/core/community/index.ts` deixou de reexportar `modules/community` inteiro e passou para API explicita.
- `gastronomy`: `DashboardEmpresaPageV2` deixou de importar `modules/gastronomy/*` e passou a consumir wrappers canonicos em `src/core/gastronomy/hooks|components|pages`.
- `gastronomy`: constants de culinaria (`CUISINE_TYPES`, `CuisineType`) migradas para ownership canonico em `src/core/gastronomy/constants/cuisine.ts` com compatibilidade via reexport em `modules`.
- `gastronomy`: `src/core/gastronomy/index.ts` passou a usar tipos e constantes locais de `core`.
- `mobility`: `TrackingService` e `ProfileService` passaram a consumir `@/core/mobility/services`; `EmpresaDashboardTab` e `RankingPage` migraram para `@/core/mobility/components`.
- `maps`: `MapaPageV4` deixou de importar `@/modules/community-alerts` e passou para `@/core/community-alerts`.
- `mobility` contracts complementados com novos exports canonicos (`DriverAvailabilityService` e `mobilityService`) em `src/core/mobility/services/index.ts`.
- `mobility`: `mobility.queries.ts` e `mobility.mutations.ts` migrados para ownership canonico em `src/core/mobility/services/`.
- `mobility`: constantes centrais migradas para ownership canonico em `src/core/mobility/constants/index.ts`.
- `mobility`: wrappers de compatibilidade mantidos em `src/modules/mobility/services/mobility.queries.ts`, `src/modules/mobility/services/mobility.mutations.ts` e `src/modules/mobility/constants/index.ts`.
- `mobility`: servicos `MobilityAdminQueryService`, `MobilityRolloutService`, `MobilityLocationService`, `MobilityAuditService`, `DriverModerationEventsService`, `RideReportsService` e `DriverAvailabilityService` migrados para `src/core/mobility/services/`.
- `mobility`: `src/core/mobility/services/index.ts` deixou de importar os servicos acima de `@/modules/mobility/services/*`.
- `mobility`: wrappers de compatibilidade mantidos em `src/modules/mobility/services/*` para os servicos migrados.
- governanca: `scripts/lib/architecture-registry.ts` atualizado para incluir `src/core/mobility/services/DriverAvailabilityService.ts` como caminho SSOT oficial.
- governanca: `scripts/lib/architecture-registry.ts` atualizado para incluir `src/core/mobility/services/MobilityService.ts` como caminho SSOT oficial.
- `community`: `useCommunityUrls` migrou para implementacao real em `src/core/community/hooks/useCommunityUrls.ts`; modulo legado ficou como reexport.
- `gastronomy`: `useGastronomyStatus` migrou para implementacao real em `src/core/gastronomy/hooks/useGastronomyStatus.ts`; modulo legado ficou como reexport.
- `mobility`: `useMobilityUrls` e `useDriverProfileIdentity` migraram para implementacao real em `src/core/mobility/hooks/*`; modulo legado ficou como reexport.
- `mobility`: `MobilityService.ts` e `MobilityService.impl.ts` migrados para implementacao real em `src/core/mobility/services/`.
- `mobility`: motor operacional migrado para implementacao real em `src/core/mobility/core/` (`RideOperationalService`, `RideDispatchService`, `RideStateMachine`).
- `mobility`: tipos operacionais consolidados em `src/core/mobility/types/*`.
- `mobility`: `useDelivery`, `useRideRealtime`, `RequestMotoboyButton`, `CreateDeliveryModal`, `NeighborRankingPanel` e `utils/failedDelivery` migrados para implementacao real em `core`.
- `mobility`: arquivos equivalentes em `src/modules/mobility/*` convertidos para wrappers de compatibilidade (reexport para `core`) nos itens migrados.
- `gastronomy`: `GastronomyCTA`, `GastronomyVerticalCTA`, `GastronomySetupPage`, `useGastronomySetup`, `gastronomy-runtime.queries` e `types/gastronomy.ts` migrados para implementacao real em `src/core/gastronomy/*`.
- `gastronomy`: arquivos equivalentes em `src/modules/gastronomy/*` convertidos para wrappers de compatibilidade (reexport para `core`) nos itens migrados.
- governanca: `scripts/lib/architecture-registry.ts` atualizado para reconhecer `src/core/gastronomy` como container oficial dos tipos canonicos de gastronomia.
- `community`: `PostCard`, `PostCardSkeleton`, `CommunityProfileCard`, `Leaderboard`, `BadgeDisplay` e `UserLevelBadge` migrados para implementacao real em `src/core/community/components/*`.
- `community`: suporte dos componentes migrado para `src/core/community/components/{PostHeader,PostBadge,PostContent,PostTags,PostMetrics,ImageGallery}.tsx`, `src/core/community/components/styles/communityDesignSystem.ts` e `src/core/community/hooks/posts/usePostInteractions.ts`.
- `community`: arquivos equivalentes em `src/modules/community/components/*` convertidos para wrappers de compatibilidade (reexport para `core`) nos componentes migrados.
- `community-alerts`/`community-issues`: ownership migrado para `src/core/community-alerts/*` e `src/core/community-issues/*`.
- `community-alerts`/`community-issues`: `src/modules/community-alerts/index.ts` e `src/modules/community-issues/index.ts` convertidos para wrappers (`export * from "@/core/..."`).
- `community-alerts`/`community-issues`: `CommunityAlertService` e `CommunityIssueService` em `modules/*` convertidos para wrappers de compatibilidade.
- governanca: `scripts/lib/architecture-registry.ts` atualizado para reconhecer SSOT do dominio em `src/core/community-alerts/services/CommunityAlertService.ts` e `src/core/community-issues/services/CommunityIssueService.ts`.
- `community`: `EventosPage` migrada para implementacao real em `src/core/community/pages/EventosPage.tsx`; `src/modules/community/pages/EventosPage.tsx` convertido para wrapper de compatibilidade.
- `community`: `ComunidadePage` migrada para implementacao real em `src/core/community/pages/ComunidadePage.tsx`; `src/modules/community/pages/ComunidadePage.tsx` convertido para wrapper de compatibilidade.
- `community`: dependencias de pagina (hooks/pages/components) espelhadas em `src/core/community/*` com normalizacao de imports para `core`.
- `community`: corrigidos ciclos de reexport auto-referente gerados na migracao (ex.: `useCommunityUrls`, `PostCardSkeleton`, `BadgeDisplay`, `Leaderboard`, `UserLevelBadge`, `PostCard`, `CommunityProfileCard`, `useEventos`, `EventosPage`).
- `community`: `CommunityLocationService` e `CommunityRolloutService` promovidos para `src/core/community/services/*` e exportados no barrel canonico.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/community/pages/EventosPage`.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/community/pages/ComunidadePage`.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/mobility/pages/MobilidadeLandingPage`.
- `services`: slice territorial migrado para `core` com ownership em `src/core/services/*` (`ServicosLandingPage`, `useServiceUrls`, `useServicos`, `useTopRatedProfessionals`, `professionalCategories`, `professionalViewModels`, `ServicesService`).
- `services`: arquivos equivalentes em `src/modules/services/*` convertidos para wrappers de compatibilidade.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/services/pages/ServicosLandingPage`.
- `routing`: `useAppUrls` passou a consumir `@/core/services/hooks/useServiceUrls`.
- `governanca`: `scripts/lib/architecture-registry.ts` atualizado para SSOT de `ServicesService` em `src/core/services/services/ServicesService.ts`.
- `classifieds`: slice territorial migrado para `core` com ownership em `src/core/classifieds/*` (pages, hooks, sections, components, constants, utils e services).
- `classifieds`: arquivos equivalentes em `src/modules/classifieds/*` convertidos para wrappers de compatibilidade.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/classifieds/pages/ClassificadosPage`.
- `routing`: `useAppUrls` passou a consumir `@/core/classifieds/hooks/useClassifiedUrls`.
- `governanca`: `scripts/lib/architecture-registry.ts` atualizado para SSOT de `ClassifiedUrlService` em `src/core/classifieds/services/ClassifiedUrlService.ts`.
- `vagas`: slice territorial migrado para `core` com ownership em `src/core/vagas/*` (pages, hooks, sections, components, services, types e barrel).
- `vagas`: arquivos equivalentes em `src/modules/vagas/*` convertidos para wrappers de compatibilidade.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/vagas/pages/VagasPublicPage`.
- `app/routes`: `lazyImports.ts` passou a lazy-importar `PublicarVagaPage`, `VagaDetailPage` e `VagaDetailPublicPage` de `@/core/vagas/pages/*`.
- `admin`: `AdminVagasRuntimeService` passou a apontar para `@/core/vagas/services/AdminVagasService`.
- `governanca`: `scripts/lib/architecture-registry.ts` atualizado para incluir `src/core/vagas` e SSOTs `VagasService`/`AdminVagasService`.
- `business`: slice territorial migrado para `core` com ownership de `CategoryBusinessPage`, `useBusinessList`, `useBusinessUrls`, `useUserPosition`, `useBusinessDistance` e `categoryFilters` em `src/core/business/*`.
- `business`: arquivos equivalentes em `src/modules/business/{pages,hooks,config}` convertidos para wrappers de compatibilidade nos itens migrados.
- `routing`: `TerritorialModulePages` passou a lazy-importar `@/core/business/pages/CategoryBusinessPage`.
- `community/gastronomy/mobility`: `rg -n "@/modules/(community|gastronomy|mobility)" src/core` retornando `0` (sem acoplamento remanescente em `core` nesses dominios).
- `classifieds`: `ClassificadoDetailPage` promovida para `src/core/classifieds/pages/ClassificadoDetailPage.tsx` e rota canônica passou a consumir `@/core/classifieds/pages/ClassificadoDetailPage`.
- `classifieds`: hooks `useClassificadoDetail` e `useSellerAds` promovidos para `src/core/classifieds/hooks/*`; equivalentes em `src/modules/classifieds/hooks/*` convertidos para wrappers.
- `classifieds`: `core/admin`, `core/landing`, `core/profiles`, `core/messaging` e `core/routing` deixaram de importar `@/modules/classifieds/*` e passaram a consumir `@/core/classifieds/*`.
- `promotions`: contrato canônico em `src/core/promotions/*` promovido (hooks/components/services/types/repositories); `src/modules/promotions/*` convertido para wrappers de compatibilidade nos entrypoints públicos.
- `profile`: `ProfilePublicPage` promovida para `src/core/profile/pages/ProfilePublicPage.tsx` com utilitário `profileDomainRules` em `src/core/profile/utils/`; `ProfilePublicRoute` atualizado para consumir `core`.
- `admin`: componentes compartilhados de admin promovidos para `src/core/admin/components/*` (incluindo cadeia de reputação) e `core/admin/components/index.ts` convertido para barrel local sem dependência de `modules`.
- `admin-identidade`/`admin-motoristas`: implementação promovida para `src/core/admin-identidade/*` e `src/core/admin-motoristas/*`; pages em `src/core/admin/pages/*` apontando para `core` e páginas equivalentes em `modules/*` convertidas para wrappers.
- `auth`: `ResetPasswordPage` deixou de acessar `supabase.auth` direto; fluxo de `PASSWORD_RECOVERY` encapsulado em `AuthService.onPasswordRecovery`.
- `core`: `rg -n "@/modules/" src/core --glob "*.ts" --glob "*.tsx"` retornando `0` (sem acoplamento runtime `core -> modules`).
- `docs`: consolidacao de pre-launch aplicada; 99 markdowns movidos para `docs/historico/pre-launch/2026-04-20/` e `docs/pre-launch` reduzido a ponte historica (`README.md` + `INDEX.md`).
- `docs`: governanca canonica alinhada (`CURRENT_RULES`, `INDEX_CANONICO`, `CANONICAL_MAP`) para refletir ownership atual em `core/*` e deixar explicito que documentos historicos nao substituem status oficial.
- Imports de Supabase normalizados para `@/integrations/supabase/supabase`.
- Warning de build sobre reexport `client.ts` eliminado.
- `core/verification` deixou de depender de `modules/verification` (inversao de dependencia removida).
- `VerificationBanner` consolidado em `src/core/verification/components/VerificationBanner.tsx`.
- `AdminVerificationsPage`, `useVerifications` e `VerificationCard` migrados para `src/core/verification/*`.
- Facade legada `src/modules/verification/*` removida do repositorio.
- `BottomNav` migrou para hook canonico em `src/core/notifications/useUnifiedNotifications.ts`.
- `UnifiedNotificationBellV2` migrou para `src/core/notifications/components/UnifiedNotificationBellV2.tsx`.
- `AppTopbar` passou a importar o sino de notificacoes de `@/core/notifications`.
- Facade legada `src/modules/notifications/*` removida do repositorio.
- `notifications/admin`: cobertura fechada para canais, templates e auditoria de entrega:
  - `src/core/admin/services/AdminNotificationsService.ts` expandido com `getChannelStats`, `getTemplateStats`, `getEmailDeliveryAudit`.
  - `src/modules/admin/pages/AdminNotifications.tsx` passou a exibir governanca operacional de canais (push/e-mail), top templates e tabela de auditoria de `email_logs`.
  - `ResetPasswordPage` manteve boundary de UI sem Supabase direto via `AuthService.applyRecoverySession`.
  - migration SSOT adicionada em `supabase/migrations/20260421093000_admin_notifications_governance_rpc.sql` com RPCs administrativos para `notification_preferences`, `push_subscriptions` e `email_logs`.
- `DashboardEmpresaPageV2` deixou de importar `modules/dashboard/*` e passou a depender de `core/business` + `shared`.
- `useDashboardAccess` e `useDashboardTabs` migrados para `src/core/business/hooks/` com wrappers de compatibilidade no modulo.
- Servicos de landing migrados para `src/core/landing/services/` e consumidores de `core` atualizados.
- `AnalyticsPage`, `useAnalyticsAccess` e `dashboards.config` migrados para ownership canonico em `src/core/analytics/*`.
- `GeneralAnalyticsPage` atualizado para lazy import de `@/core/analytics/pages/AnalyticsPage`.
- Gate incremental endurecido para bloquear regressao de imports legados `@/modules/analytics`, `@/modules/notifications` e `@/modules/verification` em todo `src/`.
- Erro de runtime `Cannot access 'logger' before initialization` resolvido em `cookieStorage`.
- Warning de CSP em dev passou a depender de `VITE_SECURITY_DEBUG=true`.
- Bloqueio de `rg` no ambiente Windows corrigido (ripgrep MSVC + override de perfil PowerShell).

## Evidencias e documentos de referencia
- Auditoria estrutural: [AUDITORIA_ESTRUTURAL_MODULOS.md](./AUDITORIA_ESTRUTURAL_MODULOS.md)
- Indice canonico: [INDEX_CANONICO.md](./INDEX_CANONICO.md)
- Mapa canonico de ownership: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
