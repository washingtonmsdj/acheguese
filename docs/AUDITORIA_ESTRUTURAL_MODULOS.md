# Auditoria Estrutural Modular - Acheguese

> Data: 2026-04-20
> Tipo: Auditoria arquitetural ponta a ponta (camadas, SSOT, boundaries, exports, legado)
> Metodo: Varredura real de codigo, imports e validadores de arquitetura

---

## 1. Estado atual consolidado

### 1.1 Consolidacoes concluidas em core
- `notifications`: ownership final em `src/core/notifications`.
- `verification`: ownership final em `src/core/verification`.
- `analytics`: ownership final em `src/core/analytics` (facades legadas removidas/neutralizadas).
- `landing` e `dashboard`: inversoes `core -> modules` removidas.

### 1.2 Facades legadas removidas
- `src/modules/notifications/*` removido do repositorio.
- `src/modules/verification/*` removido do repositorio.

### 1.3 Gate incremental de arquitetura (CI)
Regras ativas:
- cross-import entre modulos (`@/modules/X` -> `@/modules/Y`)
- acesso direto a Supabase em `.tsx`
- modulo sem barrel `index.ts`
- bloqueio de regressao para imports legados:
  - `@/modules/analytics`
  - `@/modules/notifications`
  - `@/modules/verification`

Baseline incremental: `docs/audits/architecture-boundaries-incremental-baseline.json` com 0 violacoes.

---

## 2. Execucao por fases

### P0 - Blindagem estrutural imediata (concluido)
- barrels faltantes criados
- pastas legadas (`src/pages`, `src/components`, `src/features`) removidas apos migracao

### P1 - Refactor de boundaries (concluido)
- cross-imports entre dominios removidos via contratos em `core/*`

### P2 - Supabase fora de UI (concluido)
- acessos diretos em `.tsx` migrados para services canonicos

### P2.1 - Governanca arquitetural (concluido)
- `validate:architecture:governance` zerado

### P3 - Consolidacao `core x modules` (concluido)
- `verification` consolidado e facade removida
- `notifications` consolidado e facade removida
- `analytics` consolidado em `core`
- `landing`/`dashboard` sem inversao para `modules`
- `community`, `gastronomy` e `mobility` com contratos canonicos reforcados em `core/*` para consumo cross-domain:
  - `useAppUrls` agora depende de `@/core/community/hooks/useCommunityUrls` e `@/core/mobility/hooks/useMobilityUrls`
  - `TrackingService` e `ProfileService` passaram a consumir `@/core/mobility/services`
  - `DashboardEmpresaPageV2` passou a consumir wrappers canonicos de gastronomia em `@/core/gastronomy/*`
  - `EmpresaDashboardTab`, `RankingPage` e `MapaPageV4` removidos de imports diretos `@/modules/*` nestes domnios
  - `core/community/index.ts` deixou de usar `export *` de `modules/community` e passou a expor API explicita
  - `CUISINE_TYPES`/`CuisineType` movidos para ownership canonico em `core/gastronomy/constants/cuisine.ts`
  - `core/gastronomy/index.ts` passou a consumir tipos e constantes locais (`core/*`) em vez de `modules/gastronomy/*`
  - `mobility` iniciou consolidacao canônica em `core`:
    - `src/core/mobility/services/mobility.queries.ts` e `mobility.mutations.ts` passaram a ser fonte real de consultas/mutacoes
    - `src/core/mobility/constants/index.ts` passou a ser fonte canônica de constantes de mobilidade
    - `modules/mobility/services/mobility.queries.ts`, `modules/mobility/services/mobility.mutations.ts` e `modules/mobility/constants/index.ts` ficaram como wrappers de compatibilidade (reexport)
    - servicos canonicos migrados para `src/core/mobility/services`:
      - `MobilityAdminQueryService.ts`
      - `MobilityRolloutService.ts`
      - `MobilityLocationService.ts`
      - `MobilityAuditService.ts`
      - `DriverModerationEventsService.ts`
      - `RideReportsService.ts`
      - `DriverAvailabilityService.ts`
    - `src/core/mobility/services/index.ts` deixou de importar esses servicos via `@/modules/mobility/services/*`
    - `scripts/lib/architecture-registry.ts` atualizado para reconhecer `src/core/mobility/services/DriverAvailabilityService.ts` como caminho SSOT oficial
    - wrappers de compatibilidade mantidos em `src/modules/mobility/services/*` para os servicos acima
  - `community/gastronomy/mobility` com hooks canonicos migrados para implementacao real em `core`:
    - `src/core/community/hooks/useCommunityUrls.ts`
    - `src/core/gastronomy/hooks/useGastronomyStatus.ts`
    - `src/core/mobility/hooks/useMobilityUrls.ts`
    - `src/core/mobility/hooks/useDriverProfileIdentity.ts`
  - `modules/*` correspondentes desses hooks ficaram como wrappers de compatibilidade (reexport para `core`)
  - `mobility` motor operacional migrado para ownership real em `core`:
    - `src/core/mobility/services/MobilityService.ts`
    - `src/core/mobility/services/MobilityService.impl.ts`
    - `src/core/mobility/core/RideOperationalService.ts`
    - `src/core/mobility/core/RideDispatchService.ts`
    - `src/core/mobility/core/RideStateMachine.ts`
    - suporte canônico copiado para `src/core/mobility/services/*` (helpers, ride/chat/driver services, validators, adapters e authorization/resolver)
    - tipos canônicos de mobilidade consolidados em `src/core/mobility/types/*`
  - `mobility` UX/hook operacional migrados para implementacao real em `core`:
    - `src/core/mobility/hooks/useDelivery.ts`
    - `src/core/mobility/hooks/useRideRealtime.ts`
    - `src/core/mobility/components/RequestMotoboyButton.tsx`
    - `src/core/mobility/components/CreateDeliveryModal.tsx`
    - `src/core/mobility/components/NeighborRankingPanel.tsx`
    - `src/core/mobility/utils/failedDelivery.ts`
  - `modules/mobility/*` equivalentes ficaram como wrappers de compatibilidade para os itens acima
  - `gastronomy` com UI/setup migrados para implementacao real em `core`:
    - `src/core/gastronomy/components/GastronomyCTA.tsx`
    - `src/core/gastronomy/components/GastronomyVerticalCTA.tsx`
    - `src/core/gastronomy/pages/GastronomySetupPage.tsx`
    - `src/core/gastronomy/hooks/useGastronomySetup.ts`
    - `src/core/gastronomy/services/gastronomy-runtime.queries.ts`
    - `src/core/gastronomy/types/gastronomy.ts`
  - `modules/gastronomy` equivalente desses artefatos ficou em compatibilidade via reexport para `core`
  - governanca atualizada para reconhecer `src/core/gastronomy` como container oficial de tipos canonicos de gastronomia
  - `community` com componentes canonicos migrados para implementacao real em `core`:
    - `src/core/community/components/cards/PostCard.tsx`
    - `src/core/community/components/PostCardSkeleton.tsx`
    - `src/core/community/components/CommunityProfileCard.tsx`
    - `src/core/community/components/Leaderboard.tsx`
    - `src/core/community/components/BadgeDisplay.tsx`
    - `src/core/community/components/UserLevelBadge.tsx`
    - suporte movido para `src/core/community/components/{PostHeader,PostBadge,PostContent,PostTags,PostMetrics,ImageGallery}.tsx`, `src/core/community/components/styles/communityDesignSystem.ts` e `src/core/community/hooks/posts/usePostInteractions.ts`
  - `modules/community/components/*` equivalente dos 6 componentes acima convertido para wrappers de compatibilidade (reexport para `core`)
  - `community-alerts` e `community-issues` consolidados com ownership em `core`:
    - implementacao de modulo copiada para `src/core/community-alerts/*` e `src/core/community-issues/*`
    - `src/modules/community-alerts/index.ts` e `src/modules/community-issues/index.ts` convertidos para wrappers (`export * from "@/core/..."`)
    - `CommunityAlertService` e `CommunityIssueService` em `modules/*` convertidos para wrappers de compatibilidade
  - registry de governanca atualizado no dominio `community-alerts` para SSOT em `src/core/community-alerts/services/CommunityAlertService.ts` e `src/core/community-issues/services/CommunityIssueService.ts`
  - `community` (slice territorial): `src/core/community/pages/EventosPage.tsx` e `src/core/community/pages/ComunidadePage.tsx` promovidas como implementacao real; pages equivalentes em `modules/community/pages/*` convertidas para wrapper
  - `community`: pacote funcional de pagina (hooks/pages/components) espelhado em `src/core/community/*` com imports normalizados para `core`
  - `community`: ciclos de reexport auto-referente corrigidos em arquivos migrados (`useCommunityUrls`, `useEventos`, `EventosPage`, `PostCardSkeleton`, `BadgeDisplay`, `CommunityProfileCard`, `Leaderboard`, `UserLevelBadge`, `PostCard`)
  - `community`: `CommunityLocationService` e `CommunityRolloutService` promovidos para `src/core/community/services/*` e exportados no barrel de `core`
  - `core/routing/components/TerritorialModulePages.tsx` atualizado para lazy import de `@/core/community/pages/EventosPage`, `@/core/community/pages/ComunidadePage` e `@/core/mobility/pages/MobilidadeLandingPage`
  - `services` (slice territorial): ownership promovido para `src/core/services/*` com:
    - `pages/ServicosLandingPage.tsx`
    - `hooks/useServiceUrls.ts`
    - `hooks/useServicos.ts`
    - `hooks/useTopRatedProfessionals.ts`
    - `domain/professionalCategories.ts`
    - `domain/professionalViewModels.ts`
    - `services/ServicesService.ts`
  - `modules/services/*` equivalente desses artefatos convertido para wrappers de compatibilidade (reexport para `core`)
  - `core/routing/hooks/useAppUrls.ts` atualizado para consumir `@/core/services/hooks/useServiceUrls`
  - `core/routing/components/TerritorialModulePages.tsx` atualizado para lazy import de `@/core/services/pages/ServicosLandingPage`
  - governanca atualizada para reconhecer `src/core/services/services/ServicesService.ts` como SSOT no dominio `professionals/services`
  - `classifieds` (slice territorial): ownership promovido para `src/core/classifieds/*` (pages/hooks/sections/components/constants/data/utils/services), com `src/modules/classifieds/*` convertido para wrappers de compatibilidade
  - `core/routing/components/TerritorialModulePages.tsx` atualizado para lazy import de `@/core/classifieds/pages/ClassificadosPage`
  - `core/routing/hooks/useAppUrls.ts` atualizado para consumir `@/core/classifieds/hooks/useClassifiedUrls`
  - governanca atualizada para reconhecer `src/core/classifieds/services/ClassifiedUrlService.ts` como SSOT no dominio `classifieds`
  - `vagas` (slice territorial): ownership promovido para `src/core/vagas/*` (pages/hooks/sections/components/services/types/barrels), com `src/modules/vagas/*` convertido para wrappers de compatibilidade
  - `core/routing/components/TerritorialModulePages.tsx` atualizado para lazy import de `@/core/vagas/pages/VagasPublicPage`
  - `src/app/routes/lazyImports.ts` atualizado para consumir `PublicarVagaPage`, `VagaDetailPage` e `VagaDetailPublicPage` de `@/core/vagas/pages/*`
  - `src/core/admin/services/AdminVagasRuntimeService.ts` atualizado para apontar para `@/core/vagas/services/AdminVagasService`
  - governanca atualizada no dominio `professionals/services` para incluir `src/core/vagas` e SSOTs de `VagasService` e `AdminVagasService`
  - `business` (slice territorial): ownership promovido para `src/core/business/*` em:
    - `pages/CategoryBusinessPage.tsx`
    - `hooks/useBusinessList.ts`
    - `hooks/useBusinessUrls.ts`
    - `hooks/useUserPosition.ts`
    - `hooks/useBusinessDistance.ts`
    - `config/categoryFilters.ts`
  - `modules/business` equivalente dos artefatos acima convertido para wrappers de compatibilidade (reexport para `core`)
  - `core/routing/components/TerritorialModulePages.tsx` atualizado para lazy import de `@/core/business/pages/CategoryBusinessPage`
  - `classifieds` (detalhe/canonical): `ClassificadoDetailPage` promovida para `src/core/classifieds/pages/ClassificadoDetailPage.tsx`, `ClassifiedCanonicalRoute` atualizado para `@/core/classifieds/pages/ClassificadoDetailPage`, e hooks `useClassificadoDetail`/`useSellerAds` promovidos para `src/core/classifieds/hooks/*` com wrappers em `modules`
  - acoplamento `core -> modules` eliminado para `community/gastronomy/mobility` (`rg -n "@/modules/(community|gastronomy|mobility)" src/core` retorna `0`)
  - `promotions`: ownership promovido para `src/core/promotions/*` (hooks/components/services/types/repositories) com wrappers públicos em `modules/promotions`
  - `profile`: `ProfilePublicPage` e `profileDomainRules` promovidos para `src/core/profile/*`; `ProfilePublicRoute` atualizado para `core`
  - `admin`: componentes compartilhados promovidos para `src/core/admin/components/*` (incluindo `Reputation*`, `TrendIndicator` e `UserReputationManager`)
  - `admin-identidade` e `admin-motoristas`: implementação promovida para `src/core/admin-identidade/*` e `src/core/admin-motoristas/*`; wrappers de compatibilidade mantidos em `modules`
  - `auth UI boundary`: `ResetPasswordPage` sem `supabase.auth` direto, usando `AuthService.onPasswordRecovery`
  - `notifications/admin`: cobertura administrativa fechada para canais/templates/auditoria:
    - `src/core/admin/services/AdminNotificationsService.ts` expandido com metodos de governanca (`getChannelStats`, `getTemplateStats`, `getEmailDeliveryAudit`) sem query direta em page.
    - `src/modules/admin/pages/AdminNotifications.tsx` atualizado para exibir leitura de canais push/e-mail, ranking de templates e auditoria de entrega de `email_logs`.
    - migration SSOT adicionada em `supabase/migrations/20260421093000_admin_notifications_governance_rpc.sql` com RPCs administrativos seguros:
      - `admin_notifications_get_settings_stats`
      - `admin_notifications_get_settings_user_ids`
      - `admin_notifications_get_user_settings`
      - `admin_notifications_get_channel_stats`
      - `admin_notifications_get_template_stats`
      - `admin_notifications_get_delivery_audit`

### P3.1 - Runtime/seguranca (concluido)
- ciclo de bootstrap (`cookieStorage`/`logger`) resolvido
- warnings de CSP em dev condicionados por flag de debug

### P4 - Higiene documental (concluida no escopo atual)
- docs da raiz movidos para historico
- indice canonico e status oficial atualizados
- estrutura documental validada por script
- `docs/pre-launch` consolidado: 99 arquivos movidos para `docs/historico/pre-launch/2026-04-20/`
- `docs/pre-launch` mantido apenas com `README.md` e `INDEX.md` como ponte historica
- governanca canonica refinada em `CURRENT_RULES.md`, `INDEX_CANONICO.md` e `CANONICAL_MAP.md` para deixar claro o peso de documentos historicos e os caminhos SSOT atualizados em `core`

---

## 3. Evidencias tecnicas (estado verde)
- `npm run validate:architecture:incremental -- --json` -> `currentTotal=0`, `baselineTotal=0`
- `npm run validate:architecture:governance -- --json` -> `[]`
- `npm run validate:ssot` -> sucesso
- `npm run typecheck` -> sucesso
- `npm run build` -> sucesso (apos ajuste de exports em `src/core/classifieds/services/index.ts`)
- `npm run validate:docs-structure` -> sucesso
- `rg -n "@/modules/" src/core --glob "*.ts" --glob "*.tsx"` -> sem ocorrencias
- Checkpoint adicional 2026-04-20 (sessao atual): todos os gates reexecutados com sucesso, incluindo `build` e incremental `currentTotal=0`.

---

## 4. Itens remanescentes (nao bloqueantes)
1. Revisao fina dos relatorios de auditoria antigos para manter referencias desatualizadas apenas em contexto historico explicito.
2. Consolidacao editorial dos documentos de pre-launch para reduzir duplicacao de status.

---

## 5. Referencias canonicas
- `docs/STATUS.md`
- `docs/INDEX_CANONICO.md`
- `docs/CANONICAL_MAP.md`
- `scripts/validate-architecture-boundaries-incremental.mjs`

