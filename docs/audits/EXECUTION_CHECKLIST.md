# Checklist de Execucao por Prioridade

Atualizado em: 2026-04-21

## P0 - Bloquear nova desorganizacao
- [x] Rodar `npm run audit:architecture` e anexar o inventario atual ao fluxo de consolidacao.
- [x] Rodar `npm run validate:architecture:governance` em toda validacao estrutural.
- [x] Proibir novas rotas publicas de identidade fora do namespace canonico `/u/:username` e `/p/:slug`.
- [ ] Proibir novo service paralelo sem ADR curta ou decisao equivalente.
- [ ] Proibir novo acesso direto ao Supabase fora de service/repository.
- [ ] Remover arquivos SQL avulsos da raiz do projeto (>80 arquivos identificados).
- [ ] Remover scripts `.mjs`/`.ts` avulsos da raiz do projeto (>60 arquivos identificados).

## P1 - Identidade e profile
- [x] Escolher namespace publico oficial para profile, business e identidade premium.
- [x] Consolidar `PublicProfilePage`, `ProfilePublicRoute` e `PerfilPublicoPage`.
- [x] Reservar `/p/:slug` para premium business e redirecionar legado publico para `/u/:username`.
- [x] Remover `/perfil/:userId` do roteamento publico e deixar apenas `/u/:username` como identidade canonica.
- [x] Extrair negocio de `usePerfilPageV3` para camada formal de dominio.
- [ ] Extrair negocio residual de `PerfilHubPage` (tipagem e ts-nocheck remanescentes).
- [x] Extrair negocio de `PerfilEditarPage`.
- [x] Consolidar `activity.ts` em fonte unica oficial.
- [x] Unificar tipos `profile.ts`, `profile-edit.ts` e `activity.ts`.
- [x] Remover `PerfilHubPageLegacy.tsx`.
- [x] Remover `PerfilCentralPage.tsx`, `PerfilPageV3.tsx` e `GerenciarPerfisPage*.tsx` do fluxo ativo.
- [x] Remover edicao privada paralela do hub e manter `/perfil/editar/:profileId` como entrada unica.
- [x] Remover primitives legadas sem consumo real: `useEditProfile`, `useProfileEdit`, `EditProfileModal` e shell antigo de edicao.
- [x] Consolidar `family` em `core/family/services/FamilyService.ts` como contrato tecnico de entidade derivada de identidade.
- [x] Remover facade legado `familyTracking` sem consumidor ativo.
- [x] Tipar `FamiliaPage` sem `ts-nocheck` e remover navegacoes para rotas de familia inexistentes.
- [x] Remover imports cruzados remanescentes do dominio `profile`.
- [x] Documentar publico vs privado, username/slug, reputacao, plano, preferencias e permissoes.
- [x] Formalizar schema/migration local de `family` com RLS, indices, nomes canonicos e ownership.
- [ ] Aplicar/validar a migration de `family` no ambiente linked.
- [ ] Tipar `PerfilHubPage` e componentes ativos remanescentes sem `ts-nocheck`, em fases controladas.

## P2 - Services e fronteiras
- [x] Consolidar `GeocodingService` em uma implementacao canonica.
- [ ] Consolidar `ChatService`, `MobilityService`, `RideService` e `DriverService` (wrappers impl/public ainda existem).
- [ ] Remover wrappers redundantes de `LocationService`, `LandingService`, `BusinessService` e `ClassifiedService`.
- [x] Migrar o cluster de imports cruzados do `admin` para fachadas em `core`.
- [x] Migrar imports de `core/admin` que hoje dependem de `modules/*`.
- [x] Migrar imports cruzados em community, business, gastronomy, classifieds, services e mobility.
- [x] Zerar `cross-module-import` no gate arquitetural.
- [x] Remover tipos duplicados sem consumidores em `shared/types`.
- [x] Fechar `parallel-service` no gate arquitetural.
- [ ] Consolidar `LandingFeaturedService` (existe em `core/landing/` e `core/landing/services/`).
- [ ] Consolidar `LandingService` (existe como `.ts` e `.impl.ts` em `modules/landing/services/`).
- [ ] Consolidar `LocationAdminService` (existe em `core/location/services/` e `modules/admin/services/`).
- [ ] Consolidar `LocationService` (existe em `core/location/LocationService.ts` e `core/location/services/LocationService.ts`).
- [ ] Consolidar `TerritorialGroupService` (existe em `core/location/services/` e `core/territorial/services/`).
- [ ] Consolidar `TerritorialManagementService` (existe como `.ts` e `.impl.ts` em `core/territorial/services/`).
- [ ] Consolidar `ClassifiedService` (existe como `.ts` e `.impl.ts` em `modules/classifieds/services/`).
- [ ] Migrar `modules/landing/services/LandingService` para `core/landing` e remover dependencia de `core/routing` em `modules/landing`.
- [ ] Migrar `MetricsService` para nao acessar `user_sessions` e `rides` diretamente (delegar para services de dominio).

## P3 - Admin coverage
- [x] Criar matriz viva de cobertura administrativa por dominio.
- [x] Abrir coverage admin para notifications.
- [x] Abrir coverage admin para governanca do mapa.
- [x] Abrir coverage admin formal para identidade, plano atual e preferencias basicas de profile.
- [x] Abrir coverage admin para reputacao por origem e preferencias por escopo de profile.
- [x] Abrir coverage admin para residencia canonica primaria e snapshot de permissoes efetivas de profile.
- [x] Fechar ownership entre admin central e dashboards de business/mobility.
- [x] Hardenizar service, hook e leitura administrativa de `family` na coverage de `profile`.
- [x] Formalizar schema/migration e RLS de `family` no contrato local de banco.
- [ ] Aplicar/validar a migration e o RLS de `family` no ambiente linked.
- [ ] Consolidar demais entidades derivadas residuais na coverage de `profile`.
- [ ] Registrar historico administrativo formal de permissoes efetivas por profile.
- [x] Consolidar/remover `useEditProfile`, `useProfileEdit` e `EditProfileModal` no fluxo oficial de edicao privada.
- [ ] Expandir `AdminTable` para bulk actions, sorting e toolbar padrao.
- [ ] Expandir baseline visual do admin para as pages restantes ainda heterogeneas.
- [ ] Definir matriz formal de uso entre `Dialog`, `Drawer` e `Sheet` no admin.
- [ ] Abrir coverage admin para community/posts (grupos, recomendacoes, eventos, achados/perdidos).
- [ ] Abrir coverage admin para professionals/services (areas de atendimento, disponibilidade, reputacao).
- [x] Fechar coverage admin de gastronomy (menu, integridade operacional, ownership de promocao).
- [x] Fechar coverage admin de classifieds (categorias, vendedor, URL history, politicas administrativas).
- [x] Fechar coverage admin de notifications (templates, canais externos, auditoria de entrega).
- [x] Fechar coverage admin de map (write-side de boundaries, reconciliacao geografica).

## P4 - Front-end base
- [x] Consolidar base visual do admin com `AdminPageHeader`, `AdminStatsGrid`, `AdminSectionCard`, `AdminDataState` e `AdminPagination`.
- [x] Migrar `AdminNotifications`, `AdminIdentidade`, `AdminMapa` e `AdminOperacoes` para a base comum.
- [x] Definir `AdminErrorState` como estado canonico de falha no admin prioritario.
- [x] Fechar `AdminTable` como wrapper canonico de tabela no admin prioritario.
- [ ] Definir shell base de page header e hero para o front-end publico.
- [ ] Definir contrato comum de filtros para listagens publicas.
- [ ] Definir contrato comum de cards de listagem.
- [ ] Padronizar loading, erro e vazio nas listagens publicas.
- [ ] Padronizar tabela administrativa para as pages restantes.
- [ ] Definir regra de uso para dialog, drawer e sheet no front-end publico.
- [ ] Ajustar responsividade de mapa, perfil e admin.
- [ ] Padronizar hero/page header em: perto-de-mim, empresas, gastronomia, mapa, perfil.
- [ ] Padronizar filtros em: perto-de-mim, empresas, gastronomia.
- [ ] Padronizar cards em: perto-de-mim, empresas, gastronomia.
- [ ] Padronizar estados de loading/erro/vazio em: perto-de-mim, empresas, gastronomia, mapa, perfil.

## P5 - Remocao de legado e documentacao
- [ ] Remover pasta `src/modules/business/components/legacy/` por partes controladas.
- [ ] Remover paginas legadas de classificados: `ClassificadosPageLegado.tsx`, `NovoClassificadoPageLegado.tsx`, `TestUploadPage.tsx`.
- [ ] Remover mocks de runtime: `src/modules/business/gastronomy/dev/devMockRuntime.ts`.
- [ ] Remover mocks de jobs/vagas: `src/modules/jobs/data/mock-jobs.ts`, `src/modules/vagas/data/mock-vagas.ts`.
- [ ] Revisar mocks historicos e manter apenas fixtures necessarias para testes ativos.
- [ ] Criar documento canonico para community-alerts.
- [ ] Criar documento canonico para classifieds.
- [ ] Criar documento canonico para mobility.
- [ ] Criar documento canonico para professionals/services.
- [ ] Manter `docs/INDEX_CANONICO.md` e `docs/CANONICAL_MAP.md` como portas oficiais.
- [ ] Remover arquivos SQL avulsos da raiz ou consolidar em `supabase/migrations/`.
- [ ] Remover scripts avulsos da raiz (mover para `scripts/` ou arquivar).
- [ ] Remover `src/app/pages/HomePageLegacy.tsx` do inventario ativo.
- [ ] Remover `src/app/pages/LoginPageLegacy.tsx` do inventario ativo.
- [ ] Remover `src/app/pages/HomePageV2.tsx` se nao houver rota ativa apontando para ela.
- [ ] Remover mocks de repositorios sem consumidores: `GovernanceRepositoryMock.ts`, `LandingFeaturedServiceMock.ts`, `LocationRepositoryMock.ts`, `TerritorialGroupRepositoryMock.ts`, `TerritorialHighlightRepositoryMock.ts`.
- [ ] Remover mocks de geospatial: `GeospatialRepositoryMock.ts`, `MockRoutingProvider.ts`, `GeospatialServiceMock.ts`.
- [ ] Mover `src/pages/NearbyPage.tsx` para `src/features/nearby/` ou `src/core/maps/pages/` para fechar ownership.

