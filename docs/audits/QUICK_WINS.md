# Quick Wins

Atualizado em: 2026-04-10

## Executados em 2026-04-09 (fase anterior)
1. Namespace publico consolidado: `/u/:username` para perfil publico e `/p/:slug` para premium business.
2. `/p/:handle` removido do roteamento ativo.
3. `PublicProfilePage.tsx`, `PerfilPublicoPage.tsx` e `PerfilHubPageLegacy.tsx` retirados do fluxo ativo.
4. Regras inline de tipo/verificacao removidas de hooks/pages prioritarios de `profile`.
5. Imports cruzados remanescentes de `profile` eliminados com contratos via `core`.
6. Rota publica legada `/perfil/:userId` removida do roteamento.
7. Cluster de imports cruzados do `admin` removido com fachadas canonicas para `mobility`, `community-alerts`, `community-issues`, `gastronomy` e `notifications`.
8. `promotions` encapsulado em `core/promotions` para `business`, `classifieds`, `community` e `services`.
9. `mobility` migrado para `core/notifications` sem dependencias diretas de `modules/notifications`.
10. `community` e `dashboard` passaram a consumir `community-alerts`, `community-issues`, `verification` e `business` apenas via `core`.
11. `delivery` e `gastronomy` passaram a se integrar via `core/delivery` e `core/gastronomy`.
12. Categoria `cross-module-import` zerada no gate arquitetural.
13. `core/chat` legado sem consumidores foi removido.
14. `core/geospatial/services/GeocodingService.ts` foi removido e `core/maps/services/GeocodingService.ts` virou fachada pura.
15. `shared/types/core.ts`, `shared/types/profile.ts` e `shared/types/profile-edit.ts` foram removidos por duplicacao sem uso.
16. Gate arquitetural fechado em `0` violacoes.
17. `core/admin` deixou de depender diretamente de `modules/*`.
18. Matriz viva de coverage admin criada em `docs/audits/ADMIN_COVERAGE_MATRIX.md`.
19. Governanca viva de identidade de `profile` criada em `docs/audits/PROFILE_IDENTITY_GOVERNANCE.md`.
20. Coverage administrativa real de `notifications` aberta com `AdminNotificationsService` e `/admin/notifications`.
21. Contrato canonico de tipos de `notifications` consolidado em `core/notifications/types.ts`.
22. Escrita direta em `notifications` removida de `PostService`.
23. Gate estrutural passou a bloquear acessos diretos ao dominio de `notifications` fora dos services oficiais.
24. Coverage administrativa formal de identidade aberta em `/admin/identidade`.
25. `AdminProfileGovernanceService` consolidou leitura de identidade publica/privada, plano atual, roles, historico de username, preferencias basicas e vinculos principais.
26. Registry arquitetural de `profile` foi alinhado ao roteamento real, removendo rotas legadas ja fora do fluxo.
27. `activity.ts` duplicado foi eliminado do dominio `profile`, mantendo uma unica fonte oficial em `src/shared/types/activity.ts`.
28. Coverage administrativa operacional do mapa aberta com `AdminMapGovernanceService` e `/admin/mapa`.
29. `MAP_RUNTIME_LAYER_KEYS` passou a ser o SSOT das camadas runtime do mapa.
30. Logs de debug residuais foram removidos de `MapaPageV4`.
31. Base visual canonica do admin documentada em `docs/audits/ADMIN_UI_BASELINE.md`.
32. `AdminNotifications`, `AdminIdentidade`, `AdminMapa` e `AdminOperacoes` passaram a compartilhar `AdminPageHeader`, `AdminSectionCard`, `AdminStatsGrid`, `AdminDataState` e `AdminPagination`.
33. `ts-nocheck` foi removido dos componentes base `AdminStatsCard` e `modules/admin/components/index.ts`.
34. `AdminErrorState` passou a ser o contrato canonico de falha para as superficies administrativas prioritarias.
35. `AdminTable` passou a encapsular tabela responsiva e footer padrao nas filas principais do admin.
36. `AdminOperacoes` deixou de ter falha silenciosa no refresh principal e passou a expor erro estrutural de superficie e diagnostico.
37. `AdminProfileGovernanceService` passou a expor reputacao por origem e preferencias por escopo como contrato administrativo canonico de `profile`.
38. `/admin/identidade` deixou de depender de payload bruto de notificacoes e passou a renderizar coverage estruturada de reputacao e preferencias.
39. `AdminProfileGovernanceService` passou a expor residencia canonica primaria como entidade secundaria oficial de identidade.
40. `/admin/identidade` passou a renderizar snapshot de permissoes efetivas e compatibilidade administrativa de `family`, sem regra local no componente.
41. `ProfileService` passou a expor o snapshot privado canonico consumido por `/perfil`.
42. `usePerfilPageV3` deixou de montar manualmente profile, stats, roles, businesses, corrida ativa e verificacao.
43. O painel privado de notificacoes passou a refletir o estado persistido de `user_notification_settings`, sem defaults locais nem `reload` para cancelar.
44. `PerfilCentralPage.tsx`, `PerfilPageV3.tsx`, `GerenciarPerfisPage.tsx` e `GerenciarPerfisPageV2.tsx` foram removidos do inventario ativo.
45. `MultiProfileService` passou a expor o agregado canonico de edicao privada com `loadProfileEditor` e `saveProfileEditor`.
46. `useProfileEditor` passou a ser o hook oficial do editor privado e `PerfilEditarPage` deixou de carregar/salvar o fluxo via effects locais.
47. A alteracao de `username`/`handle` do perfil pessoal passou a persistir corretamente no fluxo privado oficial.
48. `PerfilEditarPage`, `usePerfilPageV3`, `useProfileCompleteness`, `src/modules/profile/types/index.ts` e `src/modules/profile/index.ts` deixaram de depender de `ts-nocheck`.
49. `src/modules/profile/types/index.ts` virou a fonte unica dos tipos locais do modulo e `profile.ts`/`profile-edit.ts` foram removidos.
50. `buildProfileEditUrl` passou a ser o builder canonico da URL privada de edicao de perfil.
51. `PerfilHubPage` deixou de renderizar editor paralelo e passou a encaminhar para `/perfil/editar/:profileId`.
52. O cluster morto `EditProfileModal`, `useEditProfile`, `useProfileEdit`, `EditProfileForm`, `ProfileMainContent`, `ProfileSidebar`, `ProfileSidebarMenu`, `AccountOverview` e `EditSection` foi removido.
53. Tipos orfaos de edicao antiga foram removidos do barrel local de `profile`.
54. `FamilyService` passou a ser o SSOT tecnico de `family`, cobrindo conexoes, localizacao, preferencias, geofences, alertas e summary administrativo.
55. `useFamily` deixou de usar `ts-nocheck` e passou a consumir `FamilyService` diretamente.
56. O facade legado `familyTracking` foi removido por nao haver consumidor ativo.
57. `AdminProfileGovernanceService` deixou de acessar `family_connections` diretamente e passou a consumir o summary de `FamilyService`.
58. O gate estrutural passou a bloquear acesso direto as tabelas de `family` fora de `FamilyService`.
59. O inventario arquitetural passou a reconhecer constantes `*_TABLES`, preservando rastreabilidade mesmo quando o codigo usa SSOT de nomes de tabela.
60. `FamiliaPage` deixou de usar `ts-nocheck`, `any`, status de motorista como proxy de presenca familiar e imports mortos.
61. Links quebrados para `/familia/alertas`, `/familia/zonas`, `/familia/configuracoes` e `/familia/child/*` foram removidos da superficie ativa.
62. `useAppUrls().family.home` foi corrigido para a rota real `/perfil/familia`.
63. A migration local `20260409000001_create_family_identity_ssot.sql` formalizou schema, triggers, RLS e ownership do dominio `family`.
64. As tabelas canonicas de familia foram prefixadas para evitar nomes globais ambiguos: `family_location_sharing_settings`, `family_geofences` e `family_location_alerts`.
65. O fluxo de convite/aceite de `FamilyService` foi alinhado ao schema: convite por email, pendencia por email ou `child_id`, aceite/rejeicao com consolidacao de `child_id`.

## Ganhos de curto prazo identificados em 2026-04-10

### Raiz do projeto (impacto imediato, sem risco)
1. Mover os >80 arquivos SQL avulsos da raiz para `docs/archive/sql-scripts/` ou `supabase/migrations/` conforme o tipo.
2. Mover os >60 scripts `.mjs`/`.ts` avulsos da raiz para `scripts/` ou arquivar.
3. Remover `src/app/pages/HomePageLegacy.tsx` e `src/app/pages/LoginPageLegacy.tsx` do inventario ativo.
4. Remover `ClassificadosPageLegado.tsx`, `NovoClassificadoPageLegado.tsx` e `TestUploadPage.tsx` de classificados.
5. Remover mocks de repositorios sem consumidores: `GovernanceRepositoryMock.ts`, `LandingFeaturedServiceMock.ts`, `LocationRepositoryMock.ts`, `TerritorialGroupRepositoryMock.ts`, `TerritorialHighlightRepositoryMock.ts`.
6. Remover mocks de geospatial: `GeospatialRepositoryMock.ts`, `MockRoutingProvider.ts`, `GeospatialServiceMock.ts`.

### Services duplicados (consolidacao direta)
7. Consolidar `LandingFeaturedService` (dois arquivos em `core/landing/`).
8. Consolidar `LandingService` (`.ts` e `.impl.ts` em `modules/landing/services/`).
9. Consolidar `LocationAdminService` (em `core/location/services/` e `modules/admin/services/`).
10. Consolidar `LocationService` (em `core/location/LocationService.ts` e `core/location/services/LocationService.ts`).
11. Consolidar `TerritorialGroupService` (em `core/location/services/` e `core/territorial/services/`).
12. Consolidar `TerritorialManagementService` (`.ts` e `.impl.ts` em `core/territorial/services/`).
13. Consolidar `ClassifiedService` (`.ts` e `.impl.ts` em `modules/classifieds/services/`).

### Acessos diretos ao banco fora de service (correcao pontual)
14. Mover acesso direto de `MetricsService` a `user_sessions` e `rides` para services de dominio.
15. Mover acesso direto de `modules/landing/services/LandingService.impl.ts` para `core/landing`.
16. Mover `NearbyPage` de `src/pages/` para `src/features/nearby/` ou `src/core/maps/pages/`.

### Front-end base (padronizacao incremental)
17. Aplicar `AdminPageHeader`, `AdminStatsGrid`, `AdminSectionCard`, `AdminDataState`, `AdminErrorState` e `AdminTable` nas pages admin ainda heterogeneas.
18. Padronizar hero/page header em `perto-de-mim`, `empresas` e `gastronomia` usando `CanonicalHero`.
19. Padronizar estados de loading/erro/vazio em `perto-de-mim`, `empresas` e `gastronomia`.
