export type AuditCriticality = "low" | "medium" | "high" | "critical";

export interface DomainRegistryEntry {
  id:
    | "core-routing-location-public-identity"
    | "profile"
    | "admin"
    | "business"
    | "gastronomy"
    | "professionals-services"
    | "community-feed"
    | "community-alerts"
    | "community-issues"
    | "community-groups"
    | "community-events"
    | "community-recommendations"
    | "community-lost-found"
    | "map"
    | "classifieds"
    | "mobility"
    | "notifications";
  label: string;
  sourceRoots: string[];
  docsPaths: string[];
  ssotPaths: string[];
  routePrefixes: string[];
  adminRoutePrefixes: string[];
  criticality: AuditCriticality;
  canonicalServiceBasenames: string[];
  canonicalTypeBasenames: string[];
  adminSummary: string;
  docsSummary: string;
  ssotSummary: string;
}

export const DOMAIN_REGISTRY: DomainRegistryEntry[] = [
  {
    id: "core-routing-location-public-identity",
    label: "core/routing/location/public-identity",
    sourceRoots: [
      "src/core/routing",
      "src/core/location",
      "src/core/public-identity",
      "src/core/city",
      "src/core/territorial",
      "src/core/governance",
      "src/app/features/landing",
      "src/core/landing",
    ],
    docsPaths: [
      "docs/ARCHITECTURE.md",
      "docs/CANONICAL_MAP.md",
      "docs/GEOGRAPHIC_FOUNDATION.md",
      "docs/TERRITORIAL_FOUNDATION.md",
      "src/core/routing/README.md",
      "src/core/location/README.md",
      "src/core/location/docs/LOCATION_ARCHITECTURE.md",
      "src/core/location/docs/LOCATION_COORDINATES_SYSTEM.md",
      "src/core/public-identity/README.md",
    ],
    ssotPaths: [
      "src/core/routing/services/RoutingService.ts",
      "src/core/location/services/LocationService.ts",
      "src/core/location/LocationService.ts",
      "src/core/public-identity/services/PublicIdentityService.ts",
    ],
    routePrefixes: [
      "/brasil",
      "/br",
      "/:state",
      "/:state/:city",
      "/:state/:city/:groupSlugOrDistrict",
    ],
    adminRoutePrefixes: [
      "/admin/locations",
      "/admin/city-metadata",
      "/admin/territorial-groups",
      "/admin/territory-content",
      "/admin/territory-management",
    ],
    criticality: "critical",
    canonicalServiceBasenames: [
      "RoutingService.ts",
      "LocationService.ts",
      "PublicIdentityService.ts",
      "TerritorialManagementService.ts",
    ],
    canonicalTypeBasenames: ["types.ts", "index.ts"],
    adminSummary:
      "Parcial. Ha superfícies de locations e territorio no admin, mas a governanca de identidade publica e de roteamento ainda esta espalhada entre core e app/features/landing.",
    docsSummary:
      "Parcial. Location e public-identity possuem docs proprias, mas routing, landing e fundamentos geograficos ainda se sobrepoem e parte das referencias aponta para caminhos antigos.",
    ssotSummary:
      "SSOT fragmentado entre core/location, core/routing, core/public-identity e app/features/landing. O ownership conceitual esta em core, mas a leitura nacional/landing ainda depende de composicao em app.",
  },
  {
    id: "profile",
    label: "profile",
    sourceRoots: [
      "src/core/profiles",
      "src/modules/profile",
      "src/core/residence",
      "src/core/family",
    ],
    docsPaths: [
      "docs/audits/PROFILE_IDENTITY_GOVERNANCE.md",
      "src/core/profiles/docs/CONTRACT_AUDIT_USERID_PROFILEID.md",
      "src/core/profiles/README.md",
      "src/modules/profile/components/README.md",
    ],
    ssotPaths: [
      "src/core/profiles/services/ProfileService.ts",
      "src/core/profiles/services/multi-profile/profileService.ts",
      "src/core/family/services/FamilyService.ts",
    ],
    routePrefixes: [
      "/perfil",
      "/perfil/editar/:profileId",
      "/perfil/identidades",
      "/perfil/conta",
      "/perfil/familia",
      "/u/:username",
    ],
    adminRoutePrefixes: [
      "/admin/usuarios",
      "/admin/roles",
      "/admin/verificacoes",
      "/admin/assinaturas",
      "/admin/identidade",
    ],
    criticality: "critical",
    canonicalServiceBasenames: [
      "ProfileService.ts",
      "profileService.ts",
      "profileMembersService.ts",
      "FamilyService.ts",
    ],
    canonicalTypeBasenames: ["profile.ts", "profile-edit.ts", "types.ts"],
    adminSummary:
      "Boa. O dominio possui coverage administrativa formal em `/admin/identidade`, alem de usuarios, roles, verificacoes e assinaturas. Family ja entra por FamilyService e possui schema local formalizado; o backlog residual esta no rollout da migration, historico de permissoes e politica de override reputacional.",
    docsSummary:
      "Boa. Alem da auditoria userId-profileId, o dominio possui documento vivo de governanca de identidade cobrindo publico/privado, username, reputacao, plano, preferencias, residence, family e permissoes.",
    ssotSummary:
      "ProfileService segue como SSOT tecnico da identidade raiz. FamilyService passou a ser o contrato canonico da entidade derivada `family`, consumido pelo agregado admin sem acesso direto as tabelas e alinhado a migration local do dominio.",
  },
  {
    id: "admin",
    label: "admin",
    sourceRoots: ["src/core/admin", "src/modules/admin", "src/core/verification"],
    docsPaths: [
      "src/modules/admin/README.md",
      "src/modules/admin/docs/ADMIN_LOCATIONS_INTERFACE.md",
      "src/modules/admin/docs/SISTEMA_ESCALAVEL_ADMIN.md",
    ],
    ssotPaths: [
      "src/core/admin/services/AdminCrudService.ts",
      "src/core/admin/services/AdminRolesService.ts",
      "src/core/admin/services/AdminUserService.ts",
    ],
    routePrefixes: ["/admin"],
    adminRoutePrefixes: ["/admin"],
    criticality: "critical",
    canonicalServiceBasenames: [
      "AdminCrudService.ts",
      "AdminRolesService.ts",
      "AdminUserService.ts",
      "AdminBusinessService.ts",
      "AdminMobilityService.ts",
    ],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Ampla. O admin cobre varios dominios e ja opera sobre contratos centrais, mas ainda precisa fechar ownership formal das superficies, coverage faltante e padronizacao de shell/tabela.",
    docsSummary:
      "Parcial. Existem docs para locations e escalabilidade, mas falta mapa mestre da cobertura administrativa por dominio e do ownership de cada pagina/servico.",
    ssotSummary:
      "Core/admin e o agregador canonico atual. O problema remanescente deixou de ser import invertido e passou a ser consolidacao de ownership, cobertura e padrao visual das superficies administrativas.",
  },
  {
    id: "business",
    label: "business",
    sourceRoots: ["src/core/business", "src/modules/business", "src/app/features/dashboard"],
    docsPaths: ["src/core/business/README.md", "src/modules/business/README.md"],
    ssotPaths: [
      "src/core/business/services/BusinessService.ts",
      "src/core/business/services/BusinessUrlService.ts",
      "src/core/business/services/NetworkService.ts",
    ],
    routePrefixes: [
      "/empresas/:state/:city",
      "/empresas/:state/:city/:district",
      "/empresas/:state/:city/:district/:slug",
      "/create-business",
      "/edit-business/:profileId",
      "/dashboard/business/:profileId",
    ],
    adminRoutePrefixes: ["/admin/businesss"],
    criticality: "critical",
    canonicalServiceBasenames: ["BusinessService.ts", "BusinessUrlService.ts", "NetworkService.ts"],
    canonicalTypeBasenames: ["Business.ts"],
    adminSummary:
      "Boa cobertura administrativa para catalogo e reivindicacoes, mas ainda sem matriz formal do que e governado por admin vs dashboard do proprio negocio.",
    docsSummary:
      "Parcial e desatualizada. O README do modulo business fala em etapas futuras e ainda mistura integracao geografica com backlog ja executado.",
    ssotSummary:
      "BusinessService e o SSOT de dados, enquanto modules/business concentra UI. O problema atual nao e ausencia de SSOT, e excesso de hooks/view models e componentes legados em paralelo.",
  },
  {
    id: "gastronomy",
    label: "gastronomy",
    sourceRoots: ["src/modules/business/gastronomy"],
    docsPaths: ["src/modules/business/gastronomy/README.md"],
    ssotPaths: [
      "src/modules/business/gastronomy/services/GastronomyService.ts",
      "src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts",
      "src/modules/business/gastronomy/services/GastronomyProfileService.ts",
      "src/modules/business/gastronomy/services/MenuService.ts",
      "src/modules/business/gastronomy/services/GastronomyMapService.ts",
    ],
    routePrefixes: [
      "/gastronomia/:state/:city",
      "/gastronomia/:state/:city/:groupSlugOrDistrict",
      "/gastronomia/:state/:city/:district/:slug",
    ],
    adminRoutePrefixes: ["/admin/gastronomia"],
    criticality: "high",
    canonicalServiceBasenames: [
      "GastronomyService.ts",
      "GastronomyProfileService.ts",
      "MenuService.ts",
      "GastronomyMapService.ts",
    ],
    canonicalTypeBasenames: ["gastronomy.ts", "menu.ts"],
    adminSummary:
      "Parcial. Ha pagina administrativa para gastronomia, mas nao ha cobertura explicita para menu, catalogo, promocao de itens e integridade operacional do cardapio.",
    docsSummary:
      "Boa no modulo, mas restrita ao runtime publico e delivery. Faltam contratos administrativos e matriz de ownership entre business_data, gastronomy_profiles e menu_*.",
    ssotSummary:
      "Ownership consolidado no modulo business/gastronomy (inclusive contrato tecnico antes em core). O dominio depende de business_data como identidade principal e exige fronteira explicita com business para evitar duplicacao de regras.",
  },
  {
    id: "professionals-services",
    label: "professionals/services",
    sourceRoots: [
      "src/core/professional",
      "src/core/service-areas",
      "src/core/services",
      "src/core/vagas",
      "src/modules/professionals/services",
      "src/modules/professionals",
      "src/modules/classifieds/jobs",
    ],
    docsPaths: ["src/core/professional/README.md"],
    ssotPaths: [
      "src/core/professional/services/ProfessionalService.ts",
      "src/core/service-areas/services/ServiceAreasService.ts",
      "src/core/services/services/ServicesService.ts",
      "src/modules/classifieds/jobs/services/VagasService.ts",
      "src/modules/classifieds/jobs/services/AdminVagasService.ts",
    ],
    routePrefixes: [
      "/services/:id",
      "/services/:id/editar",
      "/services/cadastrar",
      "/servicos/:state/:city",
      "/profissionais/:uf/:cidade/:slug",
      "/vagas/:state/:city",
      "/vagas/publicar",
    ],
    adminRoutePrefixes: ["/admin/services", "/admin/vagas", "/admin/verificacoes"],
    criticality: "high",
    canonicalServiceBasenames: [
      "ProfessionalService.ts",
      "ServiceAreasService.ts",
      "ServicesService.ts",
      "VagasService.ts",
      "AdminVagasService.ts",
    ],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Parcial. Existem paginas de servicos, vagas e verificacoes, mas nao ha uma matriz unificada para profissional, area de atendimento, reputacao e disponibilidade.",
    docsSummary:
      "Fraca. Professional tem README em core, mas professionals/services ainda carece de documentacao viva sobre ownership, tipos oficiais e fronteiras com business/profile.",
    ssotSummary:
      "ProfessionalService, ServicesService e VagasService formam o eixo SSOT em core para professionals/services/vagas, com composicao oficial em modules/professionals/services e modules/classifieds/jobs.",
  },
  {
    id: "community-feed",
    label: "community-feed",
    sourceRoots: [
      "src/core/posts",
      "src/core/comments",
      "src/core/social",
      "src/core/favorites",
      "src/core/feed",
      "src/modules/community-feed",
    ],
    docsPaths: [
      "src/modules/community-feed/README.md",
      "docs/posts",
    ],
    ssotPaths: [
      "src/core/posts/services/PostService.ts",
      "src/core/comments/services/CommentService.ts",
    ],
    routePrefixes: [
      "/comunidade/:state/:city",
      "/novo-post",
    ],
    adminRoutePrefixes: ["/admin/moderacao", "/admin/moderacao-completa", "/admin/zeladoria"],
    criticality: "critical",
    canonicalServiceBasenames: ["CommunityService.ts", "PostService.ts", "CommentService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Parcial. Moderacao existe, mas a gestao administrativa do ciclo de posts, grupos, recomendacoes, eventos e achados/perdidos nao esta consolidada numa cobertura unica.",
    docsSummary:
      "Parcial. Ha README do modulo e pastas em docs/posts e docs/qa, mas falta documento mestre do dominio comunidade com SSOT, ownership e backlog de legado.",
    ssotSummary:
      "Feed transversal usa core/posts, core/comments, core/social e core/feed. O legado em core/community ainda precisa ser drenado para contratos de core, mas modules/community-feed e o ponto canonico de UI.",
  },
  {
    id: "community-alerts",
    label: "community-alerts",
    sourceRoots: [
      "src/core/alerts",
      "src/core/community/alerts",
      "src/modules/community-alerts",
    ],
    docsPaths: [],
    ssotPaths: [
      "src/core/alerts/services/AlertService.ts",
      "src/core/community/alerts/services/CommunityAlertService.ts",
    ],
    routePrefixes: ["/comunidade/:state/:city/alertas"],
    adminRoutePrefixes: ["/admin/community-alerts", "/admin/alertas"],
    criticality: "high",
    canonicalServiceBasenames: [
      "AlertService.ts",
      "CommunityAlertService.ts",
    ],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Boa cobertura administrativa para alertas e issues. O admin ja consome contratos centrais; a lacuna atual e documental e de ownership unificado do dominio.",
    docsSummary:
      "Fraca. Existe implementacao e SQL no modulo, mas nao ha documento canonico ativo consolidando alertas, issues e civic reports num dominio unico.",
    ssotSummary:
      "Alertas comunitarios ficam isolados em community-alerts e consomem core/community/alerts. O contrato territorial deve ser location_id; nomes de cidade/bairro sao apresentacao.",
  },
  {
    id: "community-issues",
    label: "community-issues",
    sourceRoots: [
      "src/core/community/issues",
      "src/modules/community-issues",
    ],
    docsPaths: ["src/modules/community-issues/README.md"],
    ssotPaths: [
      "src/core/community/issues/services/CommunityIssueService.ts",
    ],
    routePrefixes: ["/comunidade/:state/:city/problemas"],
    adminRoutePrefixes: ["/admin/community-issues"],
    criticality: "high",
    canonicalServiceBasenames: ["CommunityIssueService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Boa cobertura administrativa para issues. O modulo transversal agora e separado de alertas e feed.",
    docsSummary:
      "Inicial. README local documenta boundary e dependencia em location_id.",
    ssotSummary:
      "Issues comunitarias consomem core/community/issues e nao devem importar outros modulos.",
  },
  {
    id: "community-groups",
    label: "community-groups",
    sourceRoots: ["src/core/social", "src/modules/community-groups"],
    docsPaths: ["src/modules/community-groups/README.md"],
    ssotPaths: ["src/core/social/services/GroupService.ts"],
    routePrefixes: ["/grupos", "/grupos/:id"],
    adminRoutePrefixes: [],
    criticality: "medium",
    canonicalServiceBasenames: ["GroupService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary: "Pendente. Ainda nao ha superficie administrativa dedicada a grupos comunitarios.",
    docsSummary: "Inicial. Boundary separado do antigo agregador community.",
    ssotSummary: "Grupos devem depender de core/social e location_id quando territoriais.",
  },
  {
    id: "community-events",
    label: "community-events",
    sourceRoots: ["src/modules/community-events", "src/core/community/services"],
    docsPaths: ["src/modules/community-events/README.md"],
    ssotPaths: ["src/core/community/services/CommunityEventsRuntimeService.ts"],
    routePrefixes: ["/eventos/:state/:city", "/eventos/:id"],
    adminRoutePrefixes: ["/admin/eventos"],
    criticality: "medium",
    canonicalServiceBasenames: ["CommunityEventsRuntimeService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary: "Parcial. Admin eventos existe, mas o ownership precisa ser separado do feed.",
    docsSummary: "Inicial. Boundary transversal criado.",
    ssotSummary: "Eventos comunitarios devem consumir core e location_id, sem depender do agregador community.",
  },
  {
    id: "community-recommendations",
    label: "community-recommendations",
    sourceRoots: ["src/modules/community-recommendations", "src/core/community"],
    docsPaths: ["src/modules/community-recommendations/README.md", "docs/qa"],
    ssotPaths: ["src/core/community/services/CommunityQAService.ts"],
    routePrefixes: ["/recomendacoes", "/recomendacoes/nova", "/recomendacoes/:id"],
    adminRoutePrefixes: ["/admin/moderacao"],
    criticality: "medium",
    canonicalServiceBasenames: ["CommunityQAService.ts"],
    canonicalTypeBasenames: ["qa-types.ts"],
    adminSummary: "Parcial. Moderacao cobre parte do ciclo.",
    docsSummary: "Parcial. QA ja possui documentos, mas precisa remover prefixo conceitual community.",
    ssotSummary: "Recomendacoes dependem do contrato QA em core e location_id.",
  },
  {
    id: "community-lost-found",
    label: "community-lost-found",
    sourceRoots: ["src/modules/community-lost-found", "src/core/community/services"],
    docsPaths: ["src/modules/community-lost-found/README.md"],
    ssotPaths: ["src/core/community/services/LostFoundRuntimeService.ts"],
    routePrefixes: ["/achados-perdidos", "/achados-perdidos/novo", "/achados-perdidos/:id"],
    adminRoutePrefixes: [],
    criticality: "medium",
    canonicalServiceBasenames: ["LostFoundRuntimeService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary: "Pendente. Sem superficie administrativa dedicada.",
    docsSummary: "Inicial. Boundary separado do antigo agregador community.",
    ssotSummary: "Achados e perdidos deve depender de core e location_id.",
  },
  {
    id: "map",
    label: "map",
    sourceRoots: [
      "src/core/maps",
      "src/core/geocoding",
      "src/core/geospatial",
      "src/integrations/maps",
      "src/features/nearby",
      "src/pages/NearbyPage.tsx",
    ],
    docsPaths: [
      "src/core/maps/README.md",
      "src/core/geospatial/README.md",
      "src/core/geocoding/README.md",
      "docs/audits/MAP_GOVERNANCE.md",
    ],
    ssotPaths: [
      "src/core/maps/services/MapEntityProjectionService.ts",
      "src/core/geospatial/services/GeospatialService.ts",
      "src/core/geocoding/services/GeocodingService.ts",
    ],
    routePrefixes: ["/mapa", "/mapa/:state/:city", "/perto-de-mim"],
    adminRoutePrefixes: ["/admin/mapa", "/admin/locations", "/admin/pontos-turisticos"],
    criticality: "high",
    canonicalServiceBasenames: [
      "GeocodingService.ts",
      "GeospatialService.ts",
      "BoundaryService.ts",
      "NeighborhoodBoundaryService.ts",
    ],
    canonicalTypeBasenames: ["core.ts", "types.ts"],
    adminSummary:
      "Parcial. O dominio agora possui coverage operacional dedicada em `/admin/mapa`, alem de locations e pontos turisticos. Ainda faltam write-side de boundaries, reconciliacao geografica e convergencia final de Nearby.",
    docsSummary:
      "Boa. Maps ja tinha documentacao tecnica forte e agora ganhou documento vivo de governanca administrativa; o passivo principal restante esta em alinhar docs historicas com a implementacao real dos providers.",
    ssotSummary:
      "Maps agora tem SSOT explicito para runtime layers e coverage administrativa do produto, mas ainda convive com `NearbyPage` fora do ownership de `core/maps` e com composicao de alertas puxada direto do modulo.",
  },
  {
    id: "classifieds",
    label: "classifieds",
    sourceRoots: ["src/core/classifieds", "src/modules/classifieds"],
    docsPaths: ["src/modules/classifieds/data/README.md"],
    ssotPaths: [
      "src/modules/classifieds/services/ClassifiedService.ts",
      "src/core/classifieds/services/ClassifiedUrlService.ts",
    ],
    routePrefixes: [
      "/classificados/:state/:city",
      "/classificados/:state/:city/:district/:category/:subcategory",
      "/classificados/:id",
      "/classificados/novo",
      "/c/:publicId",
    ],
    adminRoutePrefixes: ["/admin/classificados", "/admin/classificados/denuncias"],
    criticality: "high",
    canonicalServiceBasenames: ["ClassifiedService.ts", "ClassifiedUrlService.ts"],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Boa cobertura para catalogo e denuncias, mas ainda sem matriz de gestao de categorias, subcategorias, vendedor e historico de URL em um so lugar.",
    docsSummary:
      "Fraca. A documentacao ativa do dominio praticamente inexiste fora do README de dados mock e de relatorios historicos arquivados.",
    ssotSummary:
      "ClassifiedService e ClassifiedUrlService formam o nucleo atual. O dominio ainda carrega paginas e hooks legados, inclusive rotas antigas convivendo com a URL canonica.",
  },
  {
    id: "mobility",
    label: "mobility",
    sourceRoots: ["src/modules/mobility", "src/core/tracking", "src/core/safety"],
    docsPaths: ["src/core/safety/README.md", "src/core/tracking/README.md"],
    ssotPaths: [
      "src/modules/mobility/services/MobilityService.ts",
      "src/core/mobility/services/MobilityService.ts",
      "src/modules/mobility/services/RideService.ts",
      "src/modules/mobility/services/DriverService.ts",
      "src/modules/mobility/services/MobilityAdminQueryService.ts",
      "src/core/mobility/services/DriverAvailabilityService.ts",
    ],
    routePrefixes: [
      "/mobilidade",
      "/mobilidade/passageiro",
      "/mobilidade/motorista",
      "/mobilidade/motorista/perfil",
      "/mobilidade/buscando/:rideId",
      "/track/:token",
    ],
    adminRoutePrefixes: [
      "/admin/motoristas",
      "/admin/reports-passageiros",
      "/admin/analytics-mobilidade",
      "/admin/realtime-dashboard",
      "/admin/pontos-embarque",
    ],
    criticality: "critical",
    canonicalServiceBasenames: [
      "MobilityService.ts",
      "RideService.ts",
      "DriverService.ts",
      "DriverAvailabilityService.ts",
      "ChatService.ts",
    ],
    canonicalTypeBasenames: ["types.ts"],
    adminSummary:
      "Boa cobertura operacional para motoristas, passageiros, analytics e pontos de embarque. Ainda faltam governanca explicita de dispatch, chat de corrida e verificacoes operacionais no indice mestre.",
    docsSummary:
      "Parcial e espalhada entre safety, tracking e historico de mobilidade em archive. Falta um documento vivo unico para SSOT operacional da mobilidade.",
    ssotSummary:
      "O modulo mobility concentra a operacao, mas ainda possui varios services paralelos e wrappers (`MobilityService`, `RideService`, `DriverService`, `ChatService`) mais tracking/safety em core.",
  },
  {
    id: "notifications",
    label: "notifications",
    sourceRoots: ["src/core/notifications", "src/modules/admin", "src/modules/profile"],
    docsPaths: ["src/core/notifications/README.md"],
    ssotPaths: ["src/core/notifications/services/NotificationService.ts"],
    routePrefixes: ["/mensagens"],
    adminRoutePrefixes: ["/admin/notifications"],
    criticality: "high",
    canonicalServiceBasenames: ["NotificationService.ts", "notification.service.ts"],
    canonicalTypeBasenames: ["notification.types.ts"],
    adminSummary:
      "Parcial. O sistema agora possui leitura administrativa oficial em `/admin/notifications`, mas ainda nao cobre templates, canais externos, auditoria de entrega nem politicas globais de notificacao.",
    docsSummary:
      "Boa no core, mas com referencias historicas fora de lugar e sem integracao com a documentacao global do projeto.",
    ssotSummary:
      "Core/notifications e o SSOT real. O agregado admin usa `AdminNotificationsService` como superficie de leitura administrativa sem reabrir services paralelos no dominio.",
  },
];

export const CRITICAL_SHARED_COMPONENTS = [
  "src/app/components/AppLayoutSidebar.tsx",
  "src/app/components/AppTopbar.tsx",
  "src/app/components/BottomNav.tsx",
  "src/app/components/ErrorBoundary.tsx",
  "src/shared/components/hero/CanonicalHero.tsx",
  "src/shared/components/loading/PageLoader.tsx",
  "src/shared/components/ui/card.tsx",
  "src/shared/components/ui/table.tsx",
  "src/shared/components/ui/dialog.tsx",
  "src/shared/components/ui/drawer.tsx",
  "src/shared/components/ui/sheet.tsx",
];

export const DOC_OBSERVATIONS = [
  "docs/README.md, docs/DOCUMENTATION_INDEX.md e docs/CANONICAL_MAP.md ainda se sobrepoem como porta de entrada e mapa canonico.",
  "docs/CURRENT_RULES.md referencia documentos que nao existem mais e ainda menciona caminhos antigos de arquitetura.",
  "Documentacao de dominio continua misturada entre docs/, src/*/README.md e src/*/docs/, sem indice unico por dominio.",
  "docs/archive/ e docs/historico/ ja absorveram o legado, mas faltava indexacao executiva para separar historico, auditoria, arquitetura e operacao.",
];

export const GOVERNANCE_ALLOWED_DB_PATH_MARKERS = [
  "/services/",
  "/repositories/",
  "/migrations/",
  "/scripts/",
  "supabase/functions/",
];

export const GOVERNANCE_SERVICE_FACADE_HINTS = [
  "compatibility facade",
  "legacy compatibility facade",
  "wrapper do módulo",
  "wrapper do modulo",
  "canonical implementation moved",
  "re-export público",
  "re-export publico",
];

