# Relatorio Mestre de Auditoria Estrutural

Data-base: 2026-04-10 (atualizado)
Escopo: codigo atual do worktree, sem abrir feature nova, com foco em organizacao, consolidacao, blindagem e reducao de caos.

## Resumo executivo
A auditoria encontrou um projeto funcional, porem com crescimento lateral acima do limite seguro em quatro eixos: identidade publica, agregacao administrativa, services paralelos e UI de base. O SSOT existe em varios pontos importantes, mas ainda convive com wrappers, rotas duplicadas, imports cruzados entre modulos e documentacao sobreposta.

A principal conclusao e objetiva: a fase correta agora nao e expandir feature. E congelar novas variacoes, consolidar as fontes canonicas e fazer o codigo voltar a respeitar fronteiras por dominio.

## Linha de base do inventario
| Item | Quantidade |
| --- | ---: |
| dominios auditados | 12 |
| services mapeados | 221 |
| paginas mapeadas | 118 |
| rotas mapeadas | 137 |
| tabelas referenciadas | 181 |
| RPCs referenciadas | 52 |
| hooks oficiais mapeados | 267 |
| hooks legados mapeados | 0 |
| arquivos legados detectados | 45 |
| acessos a banco fora de service | 3 |
| imports cruzados entre modulos | 0 |
| services duplicados/paralelos | 18 |
| tipos duplicados | 1 |
| violacoes atuais do gate arquitetural | 0 |

## Atualizacao de execucao - 2026-04-09
Fase executada: consolidacao de identidade publica, extracao inicial de regras de `profile`, saneamento do cluster administrativo mais acoplado, eliminacao completa de imports cruzados entre modulos e fechamento total do gate arquitetural.

### Entregue nesta fase
- `/p/:slug` foi reservado para business premium em `BusinessPremiumRoute`, com compatibilidade legada de perfil redirecionando para `/u/:username`.
- `/p/:handle` saiu do roteamento ativo.
- `/perfil/:userId` foi removido do roteamento publico.
- `PublicProfilePage.tsx`, `PerfilPublicoPage.tsx` e `PerfilHubPageLegacy.tsx` foram removidos do fluxo ativo.
- Regras de tipo/verificacao de perfil foram extraidas de `PerfilEditarPage`, `PerfilHubPage`, `PerfilIdentidadesPage` e `usePerfilPageV3` para helpers de dominio.
- `MobilitySettingsPanel`, `ReputationRankings`, `AdminCommunityAlerts`, `AdminCommunityIssues`, `AdminGastronomia`, `AdminMotoristas`, `AdminOperacoes`, `AdminReivindicacoes` e `AdminReportsPassageiros` passaram a consumir contratos em `core`.
- Foram criadas fachadas canonicas em `core/community-alerts`, `core/community-issues`, `core/gastronomy` e `core/mobility/services`.
- `business`, `classifieds`, `community` e `services` deixaram de consumir `promotions` diretamente e passaram a usar `core/promotions`.
- `mobility` deixou de consumir `modules/notifications` diretamente e passou a usar `core/notifications`.
- `community` e `dashboard` passaram a compor `community-alerts`, `community-issues`, `verification` e `business` apenas via `core`.
- `delivery` e `gastronomy` passaram a se integrar via `core/delivery` e `core/gastronomy`, removendo o acoplamento bilateral entre modulos.
- `core/chat` legado sem consumidores foi removido.
- `core/geospatial/services/GeocodingService.ts` foi removido e `core/maps/services/GeocodingService.ts` virou fachada pura para adapter nomeado.
- `shared/types/core.ts`, `shared/types/profile.ts` e `shared/types/profile-edit.ts` foram removidos por duplicarem contratos sem consumidores.
- `core/admin` deixou de depender diretamente de `modules/*`; agora o agregado administrativo interno consome contratos centrais.
- A cobertura administrativa passou a ter matriz viva em `docs/audits/ADMIN_COVERAGE_MATRIX.md`.
- A identidade de `profile` passou a ter documento vivo consolidado em `docs/audits/PROFILE_IDENTITY_GOVERNANCE.md`.
- O dominio `notifications` ganhou coverage administrativa oficial com `AdminNotificationsService` e a superficie `/admin/notifications`.
- O contrato de tipos de `notifications` foi consolidado em `core/notifications/types.ts`, preservando compatibilidade com o wrapper do modulo.
- `PostService` deixou de escrever direto em `notifications` e passou a usar `notificationService`.
- O gate estrutural passou a bloquear acessos diretos ao dominio `notifications` fora de `NotificationService` e `AdminNotificationsService`.
- O dominio `profile` ganhou coverage administrativa formal de identidade em `/admin/identidade`.
- `AdminProfileGovernanceService` passou a expor reputacao por origem e preferencias por escopo como contrato administrativo canonico de `profile`.
- `AdminIdentidade` deixou de depender de payload bruto de notificacoes e passou a renderizar coverage estruturada de reputacao e preferencias.
- `AdminProfileGovernanceService` passou a expor residencia canonica primaria e snapshot de permissoes efetivas como parte do contrato administrativo de `profile`.
- `AdminIdentidade` passou a expor leitura administrativa de `family`, deixando explicita a lacuna quando o schema local nao modela o dominio.
- `FamilyService` passou a ser o SSOT tecnico de `family`, cobrindo conexoes, localizacao, preferencias de compartilhamento, geofences, alertas e summary administrativo.
- `AdminProfileGovernanceService` deixou de acessar `family_connections` diretamente e passou a consumir `FamilyService`.
- `useFamily` deixou de usar `ts-nocheck` e passou a depender diretamente do service canonico.
- `FamiliaPage` deixou de usar `ts-nocheck`, `any` e status de motorista como proxy para presenca familiar.
- Links quebrados para rotas de familia inexistentes foram removidos da superficie ativa, sem criar feature nova.
- `useAppUrls().family.home` foi corrigido para `/perfil/familia`, que e a rota real registrada.
- A migration local `20260409000001_create_family_identity_ssot.sql` formalizou schema, triggers, RLS e ownership do dominio `family`.
- As tabelas canonicas do dominio passaram a ser `family_connections`, `family_locations`, `family_location_sharing_settings`, `family_geofences` e `family_location_alerts`.
- `FamilyService` foi alinhado ao schema canonico: convites pendentes por email ou `child_id`, upserts por `user_id` e writes de geofence normalizados.
- O facade legado `familyTracking` foi removido por nao ter consumidor ativo.
- O gate estrutural passou a bloquear acesso direto as tabelas de `family` fora de `FamilyService`.
- O gerador de inventario passou a reconhecer constantes `*_TABLES`, preservando rastreabilidade quando nomes de tabela estao centralizados em SSOT.
- `AdminProfileGovernanceService` passou a concentrar leitura administrativa de perfil publico/privado, `username`, plano atual, roles, preferencias basicas e entidades vinculadas principais.
- `ProfileService` passou a expor um snapshot privado canonico do hub de perfil, consolidando `profile`, `stats`, roles, businesses, corrida ativa e status de verificacao em um unico agregado.
- `usePerfilPageV3` deixou de montar esse agregado privado manualmente e passou a depender do snapshot formal de dominio.
- O painel privado de notificacoes deixou de operar com defaults locais e passou a carregar/persistir o estado real de `user_notification_settings` via `NotificationService`.
- `MultiProfileService` passou a expor o agregado canonico de edicao privada via `loadProfileEditor` e `saveProfileEditor`, centralizando autorizacao, hydration e persistencia do editor.
- `useProfileEditor` virou o hook oficial de consumo do agregado privado de edicao.
- `PerfilEditarPage` deixou de carregar/permitir/salvar via orquestracao local e passou a depender do contrato formal de dominio.
- A persistencia de `username`/`handle` do perfil pessoal foi corrigida no fluxo privado; antes a alteracao podia ficar apenas em estado local sem chegar ao service oficial.
- `buildProfileEditUrl` passou a ser o builder canonico da URL privada de edicao de perfil.
- `PerfilHubPage` deixou de renderizar uma aba de edicao paralela e passou a encaminhar para o editor oficial `/perfil/editar/:profileId`.
- O cluster legado de edicao privada sem consumo ativo foi removido: `EditProfileModal`, `useEditProfile`, `useProfileEdit`, `EditProfileForm`, `ProfileMainContent`, `ProfileSidebar`, `ProfileSidebarMenu`, `AccountOverview` e `EditSection`.
- `src/modules/profile/types/index.ts` passou a ser a fonte unica dos tipos locais do modulo `profile`; `src/modules/profile/types/profile.ts` e `src/modules/profile/types/profile-edit.ts` foram removidos.
- Os tipos locais orfaos de edicao antiga foram removidos do barrel de `profile`, mantendo apenas contratos locais vivos.
- `PerfilCentralPage.tsx`, `PerfilPageV3.tsx`, `GerenciarPerfisPage.tsx` e `GerenciarPerfisPageV2.tsx` foram removidos por nao terem rota ativa nem consumo real.
- O registry arquitetural de `profile` foi alinhado ao roteamento real, removendo referencias a rotas publicas legadas ja eliminadas.
- O dominio `map` ganhou coverage administrativa operacional com `AdminMapGovernanceService` e a superficie `/admin/mapa`.
- `MAP_RUNTIME_LAYER_KEYS` passou a ser o SSOT das camadas runtime do mapa, removendo configuracao inline duplicada em `MapaPageV4`.
- `MapaPageV4` deixou de carregar logs de debug residuais em runtime.
- A base visual canonica do admin foi consolidada em `AdminPageHeader`, `AdminStatsGrid`, `AdminSectionCard`, `AdminDataState` e `AdminPagination`.
- `AdminNotifications`, `AdminIdentidade`, `AdminMapa` e `AdminOperacoes` passaram a consumir a mesma base visual e operacional.
- `AdminErrorState` e `AdminTable` passaram a ser os contratos canonicos de falha e tabela do admin.
- O contrato visual do admin passou a ter documento vivo em `docs/audits/ADMIN_UI_BASELINE.md`.
- O inventario arquitetural foi regenerado apos a consolidacao.

### Baseline atual
| Item | Quantidade |
| --- | ---: |
| violacoes atuais do gate arquitetural | 0 |
| cross-module-import | 0 |
| business-logic-in-ui | 0 |
| parallel-service | 0 |
| duplicate-type | 0 |

### Efeito objetivo
- Reducao liquida de 58 violacoes no gate estrutural.
- Eliminacao completa da categoria `business-logic-in-ui` do baseline atual.
- Namespace publico consolidado em dois papeis claros: `/u/:username` para identidade publica e `/p/:slug` para premium business.
- Remocao completa da rota publica legada `/perfil/:userId`.
- Eliminacao completa dos imports cruzados remanescentes do dominio `profile`.
- Eliminacao completa do cluster de imports cruzados do `admin` para `mobility`, `community-alerts`, `community-issues`, `gastronomy` e `notifications`.
- Eliminacao completa da categoria `cross-module-import` do gate arquitetural.
- Eliminacao completa das categorias `parallel-service` e `duplicate-type` do gate arquitetural.
- Eliminacao do acoplamento interno de `core/admin` com implementacoes em `modules/*`.
- Abertura de coverage administrativa explicita para o produto mapa sem criar service paralelo fora de `core/admin`.
- Quatro superficies prioritarias do admin agora compartilham shell, filtros, loading, erro, tabela e paginacao.
- O admin de `profile` agora cobre residence canonica primaria e snapshot de permissoes efetivas sem sair do agregado oficial.
- O agregado admin de `profile` agora cobre `family` via `FamilyService`, sem leitura direta de tabela no admin.
- `family` deixou de ter facade legado ativo; o contrato publico do dominio ficou concentrado em `FamilyService`, tipos canonicos e hooks tipados.
- A superficie ativa de familia deixou de navegar para rotas inexistentes, reduzindo fluxo quebrado sem abrir novas telas.
- O inventario agora enxerga tabelas declaradas em constantes `*_TABLES`, evitando que SSOT de nomes reduza auditabilidade.
- O hub privado de `profile` passou a consumir um agregado canonico em service e deixou de depender de composicao ad hoc em hook.
- O editor privado de `profile` passou a consumir um agregado canonico em service e deixou de depender de effects e persistencia fragmentada na page.
- O hub privado deixou de manter editor paralelo; a edicao privada agora tem uma unica entrada operacional.
- Os tipos locais do modulo `profile` foram reduzidos a um unico barrel canonico.
- As superficies privadas legadas de perfil sairam do inventario ativo, reduzindo o dominio para um unico hub privado oficial em `/perfil`.

### Proximo cluster dominante
- O gate estrutural esta verde; o proximo trabalho deixa de ser saneamento reativo e passa a ser consolidacao administrativa, documental e visual.
- `admin` agora tem baseline visual canonica nas superficies prioritarias, mas ainda precisa expandir o contrato para pages restantes, bulk actions e refinamento responsivo.
- `notifications` agora tem coverage administrativa fechada em `/admin/notifications`, incluindo templates, canais e auditoria de entrega.
- `map` agora tem coverage administrativa operacional com write-side de boundaries/reconciliacao de coordenadas em `/admin/mapa`; backlog residual focado em convergencia final de Nearby e governanca de geometrias.
- `profile` agora cobre reputacao por origem, residence canonica primaria, `family` via service canonico, schema local formalizado de `family`, snapshot de permissoes efetivas e snapshot privado canonico do hub, mas ainda deve rollout da migration de `family`, historico administrativo de permissoes e convergencia final da edicao privada.
- `classifieds` agora tem coverage administrativa fechada em `/admin/classificados`, cobrindo catalogo, categorias, vendedores, URL history e politicas administrativas; backlog residual focado em automacoes de enforcement e trilha de sancoes.

## Veredito geral
- Manter: os SSOTs reais ja existentes em `core/profiles`, `core/business`, `core/maps/geocoding`, `core/admin`, `modules/gastronomy`, `modules/mobility` e `core/notifications`.
- Consolidar: rotas publicas, wrappers, hooks de pagina, tabelas administrativas, contratos de docs por dominio e base visual.
- Migrar: imports cruzados, services espelho, tipos duplicados e composicoes UI que ainda carregam regra de negocio.
- Remover: hubs legados, mocks ociosos, paginas legadas de classificados, duplicacoes de geocoding e arvores documentais sem vigencia.
- Documentar: dominio de profile, community-alerts, coverage administrativa por dominio e padroes visuais base.

## Achados transversais prioritarios
1. Identidade publica deixou de ser fragmentada, mas agora precisa blindagem permanente para impedir reabertura de rotas legadas fora de `/u/:username` e `/p/:slug`.
2. O dominio `profile` saiu do passivo de regra de negocio em UI no gate atual, ganhou snapshots privados canonicos para hub e editor, corrigiu a persistencia de `username`/`handle` no fluxo privado, perdeu superficies privadas mortas, encerrou a edicao paralela dentro do hub, consolidou `family` em `FamilyService` e formalizou o schema local do dominio; o principal alvo restante passou a ser rollout da migration de `family`, historico administrativo de permissoes e tipagem do hub remanescente.
3. `core/admin` ja foi saneado por dentro e ganhou baseline visual com shell, filtros, loading, erro e tabela nas superficies prioritarias, mas ainda precisa fechar ownership formal das pages restantes e levar diagnosticos soltos para contratos centrais.
4. O gate estrutural zerou services paralelos, mas ainda existem wrappers historicos a consolidar em dominios como mobility, location, landing, business e classifieds.
5. A documentacao ativa estava parcialmente organizada, mas ainda havia sobreposicao entre `docs/README.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/CANONICAL_MAP.md` e um pacote historico fora de `docs/historico/`.
6. O front-end base ainda esta mais maduro em `perto-de-mim`, `empresas` e `gastronomia` do que em `map` e `profile`. `admin` melhorou nas superficies prioritarias, mas o restante da aplicacao ainda carrega experiencia visual inconsistente.
7. `notifications` passou a ter cobertura administrativa fechada em `/admin/notifications`, com segunda camada (templates, canais e auditoria de entrega) consolidada em 2026-04-21.
8. `profile` passou a ter coverage administrativa formal em `/admin/identidade`, incluindo reputacao por origem, residence canonica primaria, `family` via service canonico e snapshot de permissoes; o backlog residual agora esta no rollout da migration de `family` e no historico administrativo de permissoes.
9. `classifieds` passou a ter coverage administrativa formal em `/admin/classificados`, incluindo taxonomia, vendedor, historico de URL e metricas de politica SSOT; o backlog residual esta em enforcement administrativo.

## Inventario geral do projeto
O inventario completo e regeneravel e esta em [PROJECT_INVENTORY.md](./PROJECT_INVENTORY.md). Ele mapeia:
- modulos e capacidades ativas
- paginas e rotas
- services por dominio
- tabelas e RPCs por dominio
- hooks oficiais e arquivos legados
- componentes compartilhados criticos
- observacoes documentais e duplicacoes

## Auditoria por dominio

### core/routing/location/public-identity
- Fonte SSOT atual: `RoutingService`, `LocationService`, `PublicIdentityService` e contratos de localizacao em `src/core/location/docs/`.
- Problemas de organizacao: landing nacional e roteamento publico ainda dependem de `modules/landing`; rotas publicas de identidade disputam namespace com business premium.
- Arquivos legados: mocks em `src/core/governance/repositories/GovernanceRepositoryMock.ts`, `src/core/landing/LandingFeaturedServiceMock.ts`, `src/core/location/repositories/LocationRepositoryMock.ts`, `src/core/location/repositories/TerritorialGroupRepositoryMock.ts`, `src/core/territorial/highlights/TerritorialHighlightRepositoryMock.ts`.
- Acesso direto ao banco fora do service: `src/core/territorial/highlights/TerritorialHighlightRepositorySupabase.ts`.
- Importacoes incorretas entre modulos: `src/core/landing/useNationalFeatured.ts`, `src/core/routing/components/BrasilShowcasePage.tsx`, `CountryLandingPage.tsx` e `StateLandingPage.tsx` importam `@/modules/landing/services/LandingService`.
- Duplicacoes de tipos, regras ou services: `LandingFeaturedService`, `LandingService`, `LocationAdminService`, `LocationService`, `TerritorialGroupService`, `TerritorialManagementService`.
- Status do admin: parcial; locations e territorio existem no admin, mas identidade publica, landing e roteamento ainda nao tem governanca unica.
- Status da documentacao: parcial; location esta melhor documentado que routing e public-identity.
- Criticidade: critical.
- Classificacao: manter `core/location` e `core/routing`; consolidar identidade publica e landing; migrar namespace de rotas; remover mocks redundantes; documentar contrato unico de roteamento publico.

### profile
- Fonte SSOT atual: `src/core/profiles/services/ProfileService.ts`, `src/core/profiles/services/multi-profile/profileService.ts`, `src/core/family/services/FamilyService.ts` e `src/core/admin/services/AdminProfileGovernanceService.ts` para coverage administrativa.
- Problemas de organizacao: hub, editor privados e familia ja dependem de contratos canonicos ativos; `family` tem service canonico, hook tipado, page sem links quebrados e schema local formalizado, mas ainda precisa rollout/validacao em ambiente e melhoria gradual da tipagem residual do hub.
- Arquivos legados: mocks em `src/core/profiles/__mocks__/`; as superficies privadas antigas sem rota foram removidas desta fase.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: nao ha imports cruzados remanescentes no gate atual; o passivo saiu do roteamento e foi substituido por contratos via `core`.
- Duplicacoes de tipos, regras ou services: `profile.ts`, `profile-edit.ts`, tipos orfaos de edicao antiga e o facade `familyTracking` foram consolidados/removidos; o residual estrutural agora esta na tipagem e padronizacao visual das superficies ainda ativas.
- Status do admin: bom; `/admin/identidade` cobre identidade publica x privada, username, plano, roles, entidades principais, reputacao por origem, residence canonica primaria, `family` via `FamilyService`, schema local formalizado e snapshot de permissoes efetivas.
- Status da documentacao: bom; `docs/audits/PROFILE_IDENTITY_GOVERNANCE.md` virou contrato vivo do dominio.
- Criticidade: critical.
- Classificacao: manter `ProfileService` e o agregado canonico de edicao; consolidar entidades secundarias; tipar e padronizar superficies restantes; remover mocks sem uso; documentar backlog residual de identidade.

### admin
- Fonte SSOT atual: `core/admin` com `AdminCrudService`, `AdminRolesService`, `AdminUserService` e services especializados.
- Problemas de organizacao: o agregado admin ja tem baseline visual nas superficies prioritarias, mas ainda precisa expandir `AdminTable`, `AdminErrorState` e `AdminPageHeader` para pages restantes e fechar ownership com dashboards especificos.
- Arquivos legados: nao ha legado explicito forte, mas ha pages heterogeneas fora do baseline canonico.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: nao ha imports cruzados remanescentes do admin no gate atual; o acoplamento estrutural foi migrado para contratos em `core`.
- Duplicacoes de tipos, regras ou services: o passivo dominante deixou de ser dependencia cruzada e passou a ser dispersao de superficies e wrappers historicos (`AdminService`, `LocationAdminService`, `VerificationService`).
- Status do admin: amplo e mais coerente; notifications, identity e map agora possuem coverage formal, mas business e mobility ainda precisam ownership final entre admin central e dashboards proprios.
- Status da documentacao: bom; `docs/audits/ADMIN_COVERAGE_MATRIX.md` e `docs/audits/ADMIN_UI_BASELINE.md` viraram as fontes vivas do agregado.
- Criticidade: critical.
- Classificacao: manter `core/admin`; consolidar pages restantes no baseline canonico; migrar ownership residual de dashboards; remover wrappers redundantes; documentar o agregado como produto interno.

### business
- Fonte SSOT atual: `core/business/services/BusinessService.ts`, `BusinessUrlService.ts` e `NetworkService.ts`.
- Problemas de organizacao: UI do dominio ainda carrega muitos hooks e componentes em paralelo, inclusive pasta `legacy/` extensa.
- Arquivos legados: toda a arvore `src/modules/business/components/legacy/`.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: `BusinessGrid.tsx`, `useBusinessAd.ts` e `DashboardEmpresaPageV2.tsx` dependem de promotions e dashboard de forma cruzada.
- Duplicacoes de tipos, regras ou services: `BusinessService.ts` em core e modulo; `dashboard.ts` duplicado entre dashboard e shared.
- Status do admin: bom para catalogo e reivindicacoes, mas ainda sem matriz do que e admin central vs dashboard do proprio negocio.
- Status da documentacao: parcial e desatualizada.
- Criticidade: critical.
- Classificacao: manter service e URL service de core; consolidar UI do modulo; migrar dashboard para consumir contratos oficiais; remover legado visual; documentar fronteira business x dashboard.

### gastronomy
- Fonte SSOT atual: `GastronomyQueryService`, `GastronomyService`, `MenuQueryService` e `MenuService`.
- Problemas de organizacao: dominio e bem focado, mas depende de `business_data` como identidade principal e mistura contrato publico com acoplamento ao delivery.
- Arquivos legados: `__mocks__` e `dev/devMockRuntime.ts`.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: `useGastronomyCheckout.ts` importa delivery e `types/gastronomy.ts` importa business types.
- Duplicacoes de tipos, regras ou services: nao ha duplicacao principal, mas ha contrato fraco entre business e gastronomy.
- Status do admin: parcial; existe pagina administrativa, mas nao ha matriz de cobertura para menu, catalogo, promocao e integridade operacional.
- Status da documentacao: boa no modulo, porem incompleta para ownership administrativo.
- Criticidade: high.
- Classificacao: manter services atuais; consolidar contrato com business; migrar integracao com delivery para adapter formal; remover mocks de runtime quando o catalogo real estiver estavel; documentar ownership de `menu_*`.

### professionals/services
- Fonte SSOT atual: `ProfessionalService`, `ServiceAreasService` e `ServicesService`.
- Problemas de organizacao: o dominio aparece repartido entre professional, services, professionals, jobs e vagas, sem documento unico nem matriz de ownership.
- Arquivos legados: `src/modules/jobs/data/mock-jobs.ts` e `src/modules/vagas/data/mock-vagas.ts`.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: `ServicesList.tsx` e `useServicesAd.ts` dependem de promotions.
- Duplicacoes de tipos, regras ou services: nao ha duplicacao dominante, mas existe concorrencia conceitual entre services do modulo e services de core.
- Status do admin: parcial; existem pages para servicos e vagas, mas nao ha gestao unificada de areas de atendimento, reputacao e disponibilidade.
- Status da documentacao: fraco.
- Criticidade: high.
- Classificacao: manter `ProfessionalService`; consolidar os subdominios sob contrato unico; migrar composicoes promocionais para adapter compartilhado; remover mocks quando houver fixtures oficiais; documentar fronteiras profile x business x professionals.

### community/posts
- Fonte SSOT atual: `CommunityService`, `PostService`, `CommentService` e supporting core services.
- Problemas de organizacao: comunidade agrega posts, grupos, eventos, achados/perdidos, recomendacoes e integra alertas/issues, o que ampliou demais a superficie do modulo.
- Arquivos legados: mocks em `src/core/posts/__mocks__/`.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: `UnifiedComposer.tsx`, `useSponsoredAds.ts`, `AlertasPage.tsx`, `ComunidadePage.tsx` e `RecomendacaoDetailPage.tsx` dependem de community-alerts, community-issues, promotions, verification e business.
- Duplicacoes de tipos, regras ou services: `CivicReportService.ts` esta duplicado entre `core/civic` e `core/community`.
- Status do admin: parcial; moderacao existe, mas a cobertura de grupos, recomendacoes, eventos e achados/perdidos nao esta consolidada numa unica matriz.
- Status da documentacao: parcial.
- Criticidade: critical.
- Classificacao: manter services de core; consolidar subdominios internos; migrar integracoes cruzadas para adapters; remover service civic duplicado; documentar comunidade como dominio composto.

### community-alerts
- Fonte SSOT atual: `AlertService`, `CommunityAlertService` e `CommunityIssueService`.
- Problemas de organizacao: o dominio ainda vive entre `core/alerts`, `core/civic`, `modules/community-alerts` e `modules/community-issues`.
- Arquivos legados: nao detectados, mas falta documento canonico unico.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: nao ha no inventario do proprio dominio, mas o admin depende dele de forma invertida.
- Duplicacoes de tipos, regras ou services: `CivicReportService.ts` duplicado.
- Status do admin: bom para alertas/issues, mas ainda acoplado ao modulo ao inves de contratos estaveis.
- Status da documentacao: fraco; nao existe documento vivo unico do dominio.
- Criticidade: high.
- Classificacao: manter services centrais; consolidar alertas, issues e civic reports; migrar contratos usados pelo admin para core; remover duplicacao de civic report; documentar o dominio.

### map
- Fonte SSOT atual: `MapEntityProjectionService`, `LocationGeocodingService`, `MapProvider` e `runtimeConfig` de `core/maps`.
- Problemas de organizacao: o dominio tecnico e forte, mas `NearbyPage` ainda vive fora do ownership direto de `core/maps`; a composicao de alertas do `MapaPageV4` ainda depende de service em modulo.
- Arquivos legados: `GeospatialRepositoryMock.ts`, `MockRoutingProvider.ts`, `GeospatialServiceMock.ts` e a superficie `src/pages/NearbyPage.tsx` como ownership residual.
- Acesso direto ao banco fora do service: `src/integrations/maps/providers/NominatimGeocodingProvider.ts`.
- Importacoes incorretas entre modulos: nao ha entre modulos, mas `MapaPageV4` ainda compoe alertas via `modules/community-alerts/services/CommunityAlertService`.
- Duplicacoes de tipos, regras ou services: o passivo maior deixou de ser duplicacao real e passou a ser drift entre runtime do mapa e a superficie `NearbyPage`.
- Status do admin: parcial; agora ha coverage dedicada em `/admin/mapa`, incluindo write-side de boundaries e reconciliacao geografica, com backlog residual em governanca de geometrias e convergencia de Nearby.
- Status da documentacao: boa e mais coesa; o dominio agora possui documento vivo em `docs/audits/MAP_GOVERNANCE.md`, mas ainda precisa alinhar docs historicas de providers com a implementacao real.
- Criticidade: high.
- Classificacao: manter `core/maps`, `core/location` e `core/admin/services/AdminMapGovernanceService.ts`; consolidar surfaces publicas e boundaries; migrar `NearbyPage` para ownership coerente; remover mocks e referencias documentais obsoletas; documentar governance do produto mapa.

### classifieds
- Fonte SSOT atual: `ClassifiedService` e `ClassifiedUrlService`.
- Problemas de organizacao: ainda coexistem rotas legadas, paginas legadas e README focado em mocks ao inves do dominio.
- Arquivos legados: `mock-classifieds.ts`, `ClassificadosPageLegado.tsx`, `NovoClassificadoPageLegado.tsx`.
- Acesso direto ao banco fora do service: nao detectado fora do service.
- Importacoes incorretas entre modulos: `ClassificadoGrid.tsx` e `useClassifiedsAd.ts` dependem de promotions.
- Duplicacoes de tipos, regras ou services: wrapper `ClassifiedService.ts` x `ClassifiedService.impl.ts`.
- Status do admin: bom para catalogo e denuncias, mas sem matriz de categorias, vendedor e historico de URL em um so lugar.
- Status da documentacao: fraco.
- Criticidade: high.
- Classificacao: manter services atuais; consolidar URL canonica e grid; migrar promocoes para adapter compartilhado; remover paginas legadas; documentar o dominio de classificados.

### mobility
- Fonte SSOT atual: `MobilityService`, `RideService`, `DriverService` e `MobilityAdminQueryService`.
- Problemas de organizacao: o dominio e critico, mas convive com wrappers, service impl/public pairs, chat paralelo e integracao direta com notifications.
- Arquivos legados: nao ha legado claro de page, mas ha services espelho demais.
- Acesso direto ao banco fora do service: `src/core/safety/providers/EmailNotificationProvider.ts`.
- Importacoes incorretas entre modulos: `DriverNotifications.tsx`, `DriverRealtimeStatus.tsx`, `MotoristaPage.tsx` e `MotoristaPageV2.tsx` dependem de notifications.
- Duplicacoes de tipos, regras ou services: `ChatService`, `DriverService`, `MobilityService`, `RideService`.
- Status do admin: bom para operacao, analytics e pontos de embarque, mas ainda sem governance clara para dispatch, chat e verificacoes operacionais.
- Status da documentacao: parcial e espalhada entre safety, tracking e historico.
- Criticidade: critical.
- Classificacao: manter services de operacao; consolidar wrappers e chat; migrar notificacoes para contratos de core; remover services espelho; documentar o SSOT operacional de mobilidade.

### notifications
- Fonte SSOT atual: `src/core/notifications/services/NotificationService.ts`.
- Problemas de organizacao: facade legada em `modules/notifications` foi removida; coverage administrativa foi fechada para templates/canais/auditoria, restando governanca de politicas globais e reprocessamento administrativo.
- Arquivos legados: mocks em `src/core/notifications/__mocks__/`.
- Acesso direto ao banco fora do service: `PostService` foi corrigido nesta fase; o gate agora bloqueia regressao no dominio.
- Importacoes incorretas entre modulos: o problema principal esta no consumo por mobility e admin, nao dentro do dominio.
- Duplicacoes de tipos, regras ou services: sem wrapper ativo em `modules/notifications`; tipos canonicos consolidados em `core/notifications/types.ts`.
- Status do admin: bom; `/admin/notifications` cobre leitura global, settings, templates, canais e auditoria de entrega.
- Status da documentacao: ownership documentado em `src/core/notifications/README.md` e refletido no mapa canonico.
- Criticidade: high.
- Classificacao: manter `NotificationService`; manter consumo em `core`; remover mocks quando possivel; documentar politicas globais e fluxo de reprocessamento administrativo.

## Organizacao documental executada
- `docs/README.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/CANONICAL_MAP.md`, `docs/CURRENT_RULES.md` e `docs/MAINTENANCE.md` foram reescritos para refletir a estrutura atual.
- `docs/architecture-fix/` foi movido para `docs/historico/architecture-fix/` e deixou de competir com documentacao ativa.
- `docs/DOCUMENT_REPLACEMENTS.md` passou a registrar documentos substituidos e a fonte oficial atual.
- `docs/audits/` passou a concentrar inventario, relatorio mestre, checklist, quick wins e backlog pos-prontidao.

## Blindagem arquitetural implementada
- Script de inventario: `npm run audit:architecture`
- Gate estrutural: `npm run validate:architecture:governance`
- Gate no `prebuild`: `validate:architecture:governance` agora roda junto com lint e validacoes existentes.

### O gate bloqueia
- acesso direto ao Supabase fora dos services oficiais
- acesso direto as tabelas de `notifications` e `family` fora dos services canonicos
- imports cruzados entre modulos
- criacao de services paralelos para o mesmo dominio
- tipos canonicos duplicados
- regra de negocio em hooks ou paginas

### Estado atual do gate
O gate esta verde no baseline atual. Ele deixou de ser cerca reativa e passou a funcionar como blindagem permanente contra regressao estrutural.

## Auditoria do front-end base

### Hero e page header
- Bom nivel em `perto-de-mim`, `empresas` e `gastronomia`, todos usando `CanonicalHero`.
- `admin` passou a ter convergencia nas superficies prioritarias com `AdminPageHeader`, mas `profile` e `map` publico ainda seguem com headers locais e pouco contrato comum.
- Prioridade: expandir a mesma disciplina de shell para `profile`, `map` publico e restante do admin.

### Filtros
- Existem filtros ricos em Nearby, Empresas, Gastronomy e Classificados, mas sem contrato comum de composicao no front-end publico.
- No admin prioritario houve convergencia para `AdminFiltersBar`, reduzindo duplicacao de comportamento e nomenclatura nessas superficies.
- Prioridade: extrair `PageFilters` para o front-end publico e manter o admin preso ao contrato atual.

### Cards
- Business, gastronomy, classifieds e nearby possuem familias de card paralelas.
- O dominio business ainda carrega uma pasta `legacy/` inteira de cards e sidebars.
- Prioridade: unificar anatomy de card e estados de loading/empty para negocios, gastronomia e classificados.

### Estados de loading, erro e vazio
- Ainda predominam spinners e mensagens inline por pagina fora do admin prioritario.
- No admin, `AdminDataState` e `AdminErrorState` passaram a cobrir loading, vazio e erro nas superficies canonicas prioritarias.
- Prioridade: definir `PageLoadingState`, `PageErrorState` e `PageEmptyState` para superficies publicas e expandir o mesmo nivel de consistencia para o restante do admin.

### Grids e listagens
- Nearby, Empresas, Gastronomy, Classificados e Community usam grids com logica e breakpoints proprios.
- O problema nao e so visual; tambem ha divergencia de semanticas, placeholders e fallback.
- Prioridade: contrato comum de listagem com responsividade previsivel.

### Tabelas administrativas
- O projeto ja possui `src/shared/components/ui/table.tsx`, e as superficies administrativas prioritarias agora compartilham shell, filtros, estados, tabela e paginacao via `AdminTable`.
- Prioridade: expandir `AdminTable` para toolbar, bulk actions, sorting e presets de coluna sem reabrir heterogeneidade.

### Drawers e modais
- `dialog`, `drawer` e `sheet` coexistem sem regra unica de quando usar cada um.
- Prioridade: matriz de uso por contexto e wrappers de dominio para formularios e acoes administrativas.

### Responsividade
- Landings publicas estao melhores; `profile` e `map` ainda carregam composicoes mais frageis em mobile. O admin prioritario melhorou, mas tabelas e filtros ainda precisam refinamento responsivo final.
- Prioridade visual imediata: perto-de-mim, empresas, gastronomia, mapa, perfil e admin.

## Auditoria do admin
| Dominio | Existe no sistema | Existe no admin | Falta gestao | Criticidade |
| --- | --- | --- | --- | --- |
| core/routing/location/public-identity | sim | parcial | identidade publica, landing nacional, roteamento e governanca de namespace | critical |
| profile | sim | sim | rollout da migration de `family`, historico administrativo de permissoes e politica de override reputacional | critical |
| admin | sim | sim | ownership de pages, adapters formais, auto-governanca de cobertura | critical |
| business | sim | sim | matriz entre catalogo, claims, network e dashboard do negocio | critical |
| gastronomy | sim | parcial | menu, promocao de item, integridade operacional e ownership de catalogo | high |
| professionals/services | sim | parcial | areas de atendimento, reputacao, disponibilidade e relacao com perfil | high |
| community/posts | sim | parcial | grupos, recomendacoes, eventos e achados/perdidos em uma unica governanca | critical |
| community-alerts | sim | sim | consolidacao de alertas, issues e civic reports | high |
| map | sim | sim | convergencia final de Nearby e governanca administrativa de geometrias (`location_boundaries`/`neighborhood_boundaries`) | high |
| classifieds | sim | sim | categorias, vendedor, URL history e politicas administrativas | high |
| mobility | sim | sim | dispatch, chat de corrida e verificacoes operacionais | critical |
| notifications | sim | sim | politicas globais de notificacao e reprocessamento administrativo | high |

## Auditoria do perfil como centro de identidade
- Dados publicos vs privados: o contrato documental agora existe em `docs/audits/PROFILE_IDENTITY_GOVERNANCE.md`, tem reflexo administrativo em `/admin/identidade` e passou a ter snapshot privado canonico em `ProfileService`; o ponto restante de mistura estrutural ficou concentrado em `PerfilEditarPage`.
- Username e slug: o conflito publico foi resolvido. O sistema usa `/u/:username` para perfil publico e `/p/:slug` para business premium; o backlog agora e garantir que nenhuma rota legada retorne.
- Reputacao: `ProfileService` continua como fonte agregada e `AdminProfileGovernanceService` agora decompone a leitura por origem; o backlog restante esta em politica administrativa de override e ajuste excepcional.
- Plano: `ProfileService` trata `user_subscriptions`, enquanto o admin tem `AdminSubscriptionsService`. Falta um contrato explicito entre plano do usuario, plano do perfil e cobertura administrativa.
- Preferencias: o admin agora separa preferencias por escopo entre perfil publico, vinculos, visibilidade de reputacao e notificacoes; ainda falta historico administrativo e ownership de persistencia por escopo.
- Entidades do usuario: business, professional, driver, family e members existem; residence canonica ja entrou na coverage administrativa, `family` agora possui `FamilyService`, hook tipado e migration local formalizada; o backlog remanescente esta na aplicacao/validacao dessa migration nos ambientes.
- Permissoes: `ProfileService` concentra permissao base e o admin agora le snapshot efetivo via `AuthorizationEngine`, mas ainda falta historico administrativo formal dessas mudancas.
- Consistencia do `ProfileService`: o service e o nucleo correto, mas esta sobrecarregado com compatibilidade, leitura direta de tabelas e contratos antigos; precisa ser mantido como centro e cercado por view-models limpos.
- Rotas publicas e privadas: privadas estao em `/perfil`, `/perfil/editar/:profileId`, `/perfil/identidades`, `/perfil/conta` e afins; publicas ficaram restritas a `/u/:username` e `/p/:slug`, removendo o principal conflito de identidade do ecossistema.

## Plano de execucao em fases
### Fase 0 - Congelamento e cerca arquitetural
- ativar `audit:architecture` e `validate:architecture:governance` como rotina diaria
- tratar o gate vermelho como backlog oficial, nao como ruido
- proibir novas rotas publicas de identidade ate fechar namespace canonico

### Fase 1 - Identidade, rotas e profile
- escolher um namespace publico por entidade
- convergir `PublicProfilePage`, `ProfilePublicRoute` e `PerfilPublicoPage`
- retirar regra de negocio de `usePerfilPageV3`, `PerfilHubPage` e `PerfilEditarPage`
- unificar tipos de profile em uma fonte oficial

### Fase 2 - Consolidacao de services e fronteiras
- eliminar services paralelos de geocoding, mobility/chat e wrappers antigos
- substituir imports cruzados entre modulos por contracts/adapters
- consolidar admin para depender apenas de contratos em core

### Fase 3 - Cobertura administrativa
- fechar lacunas de map e profile
- aplicar e validar a migration/RLS de `family` mantendo `FamilyService` como unico ponto de acesso
- formalizar ownership de cada pagina admin e qual service canonico ela consome
- criar matriz viva de cobertura administrativa por dominio

### Fase 4 - Front-end base
- padronizar hero/page header
- padronizar filtros, cards e estados de loading/erro/vazio
- criar contrato base para listagens e tabelas admin
- ajustar mobile das superficies prioritarias

### Fase 5 - Documentacao final de dominio
- criar SSOT documental para profile, community-alerts, mobility e classifieds
- manter `docs/audits/PROJECT_INVENTORY.md` como base regeneravel
- revisar `DOCUMENTATION_INDEX` e `CANONICAL_MAP` a cada consolidacao estrutural







