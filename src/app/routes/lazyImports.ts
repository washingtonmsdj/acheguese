/**
 * Lazy imports organizados por dominio.
 * Centraliza imports das paginas pertencentes ao AppLayoutRoutes.
 * Rotas publicas sem layout pertencem diretamente a AppRoutes e nao devem
 * ser redeclaradas neste barrel.
 */

import { lazy } from "react";
import { createLaunchPausedRoute } from "./launchPausedComponent";

// ============================================================
// ROTEAMENTO TERRITORIAL
// ============================================================
export const CommunityTerritorialShell = lazy(() =>
  import("@/core/routing/components/CommunityTerritorialShell").then((m) => ({
    default: m.CommunityTerritorialShell,
  })),
);
export const CommunityPersistentPortalLayout = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.CommunityPersistentPortalLayout,
  })),
);
export const CommunityAliasRoute = lazy(() =>
  import("@/core/routing/components/CommunityAliasRoute").then((m) => ({
    default: m.CommunityAliasRoute,
  })),
);
export const CommunityEntityAliasRoute = lazy(() =>
  import("@/core/routing/components/CommunityEntityAliasRoute").then((m) => ({
    default: m.CommunityEntityAliasRoute,
  })),
);
export const TerritorialCommunityPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialCommunityPage,
  })),
);
export const TerritorialCommunityEntryPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialCommunityEntryPage,
  })),
);
export const TerritorialCommunityIssuesPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialCommunityIssuesPage,
  })),
);
export const TerritorialCommunityCommunicationPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialCommunityCommunicationPage,
  })),
);
export const TerritorialBusinessPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialBusinessPage,
  })),
);
export const TerritorialServicesPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialServicesPage,
  })),
);
export const TerritorialClassificadosPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialClassificadosPage,
  })),
);
export const TerritorialEventosPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialEventosPage,
  })),
);
export const TerritorialGastronomyPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialGastronomyPage,
  })),
);
export const TerritorialEducationPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialEducationPage,
  })),
);
export const TerritorialMobilidadePage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialMobilidadePage,
  })),
);
export const TerritorialVagasPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialVagasPage,
  })),
);
export const TerritorialCategoryBusinessPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialCategoryBusinessPage,
  })),
);
export const TerritorialMapPage = lazy(() =>
  import("@/app/routes/territorial/TerritorialModulePages").then((m) => ({
    default: m.TerritorialMapPage,
  })),
);

// ============================================================
// PAGINAS PUBLICAS PERTENCENTES AO APP LAYOUT
// ============================================================
export const EmpresasLandingPage = lazy(
  () => import("@/app/pages/EmpresasLandingPage"),
);
export const BuscaPage = lazy(() => import("@/app/pages/BuscaPage"));
export const BuscarPage = lazy(() => import("@/app/pages/BuscarPage"));
export const NearbyPage = lazy(() => import("@/core/nearby/pages/NearbyPage"));
export { default as LaunchPausedPage } from "@/app/pages/LaunchPausedPage";
export const NotFound = lazy(() => import("@/app/pages/NotFound"));
export const VirtualTryOnPage = lazy(
  () => import("@/app/pages/VirtualTryOnPage"),
);
export const CommunityInterestPage = lazy(() =>
  import("@/core/routing/components/CommunityInterestPage").then((m) => ({
    default: m.CommunityInterestPage,
  })),
);
export const StateLandingPage = lazy(() =>
  import("@/core/routing/components/StateLandingPage").then((m) => ({
    default: m.StateLandingPage,
  })),
);
export const CountryLandingPage = lazy(() =>
  import("@/core/routing/components/CountryLandingPage").then((m) => ({
    default: m.CountryLandingPage,
  })),
);
export const BrasilShowcasePage = lazy(() =>
  import("@/core/routing/components/BrasilShowcasePage").then((m) => ({
    default: m.BrasilShowcasePage,
  })),
);

// ============================================================
// PERFIL E CONFIGURACOES
// ============================================================
export const ContaPage = lazy(
  () => import("@/modules/profile/pages/ContaHubPage"),
);
export const ContaEditarPerfilPage = lazy(
  () => import("@/modules/profile/pages/ContaEditarPerfilPage"),
);
export const ContaSegurancaPage = lazy(
  () => import("@/modules/profile/pages/ContaSegurancaPage"),
);
export const ContaPreferenciasPage = lazy(
  () => import("@/modules/profile/pages/ContaPreferenciasPage"),
);
export const ContaEnderecosPage = lazy(
  () => import("@/modules/profile/pages/ContaEnderecosPage"),
);
export const ContaEditarPage = lazy(
  () => import("@/modules/profile/pages/ContaEditarPage"),
);

// ============================================================
// BILLING E ASSINATURAS
// ============================================================
export const PricingPage = lazy(() => import("@/app/pages/PricingPage"));
export const CheckoutSuccessPage = lazy(
  () => import("@/app/pages/CheckoutSuccessPage"),
);
export const CheckoutCancelPage = lazy(
  () => import("@/app/pages/CheckoutCancelPage"),
);
export const SubscriptionManagementPage = lazy(
  () => import("@/app/pages/SubscriptionManagementPage"),
);

// ============================================================
// NOTIFICACOES
// ============================================================
export const NotificationsPage = lazy(
  () => import("@/app/pages/NotificationsPage"),
);
export const NotificationPreferencesPage = lazy(
  () => import("@/app/pages/NotificationPreferencesPage"),
);
export const EmailLogsPage = lazy(() => import("@/app/pages/EmailLogsPage"));
export const ProfileSettingsPage = lazy(
  () => import("@/app/pages/ProfileSettingsPage"),
);
export const ProfilePublicRoute = lazy(
  () => import("@/core/routing/components/ProfilePublicRoute"),
);

// ============================================================
// EMPRESAS E NEGOCIOS
// ============================================================
export const CriarEmpresaPage = lazy(
  () => import("@/modules/business/pages/CriarEmpresaPage"),
);
export const EmpresasCadastroLandingPage = lazy(
  () => import("@/modules/business/pages/EmpresasCadastroLandingPage"),
);
export const EditarEmpresaPage = lazy(
  () => import("@/modules/business/pages/EditarEmpresaPage"),
);
export const DashboardEmpresaPage = lazy(
  () => import("@/app/pages/DashboardEmpresaPage"),
);
export const BusinessDashboardShellPage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessDashboardShellPage"),
);
export const BusinessOverviewPage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessOverviewPage"),
);
export const BusinessDetailsPage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessDetailsPage"),
);
export const BusinessPlansPage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessPlansPage"),
);
export const BusinessPremiumSitePage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessPremiumSitePage"),
);
export const BusinessAnalyticsPage = createLaunchPausedRoute("Analytics");
export const BusinessSettingsPage = lazy(
  () => import("@/modules/business/dashboard/pages/BusinessSettingsPage"),
);
export const EmpresaDetailLandingPage = lazy(
  () => import("@/app/pages/EmpresaDetailLandingPage"),
);
export const BusinessCanonicalRoute = lazy(
  () => import("@/core/routing/components/BusinessCanonicalRoute"),
);
export const BusinessRouteResolver = lazy(
  () => import("@/core/routing/components/BusinessRouteResolver"),
);

// ============================================================
// GASTRONOMIA
// ============================================================
export const GastronomyLandingPage = lazy(
  () => import("@/modules/business/gastronomy/pages/GastronomyLandingPage"),
);
export const GastronomyDetailPage = lazy(
  () => import("@/modules/business/gastronomy/pages/GastronomyDetailPage"),
);
export const GastronomyPremiumDetailPage = lazy(
  () =>
    import("@/modules/business/gastronomy/pages/GastronomyPremiumDetailPage"),
);
export const GastronomyCheckoutPage = lazy(
  () => import("@/modules/business/gastronomy/pages/GastronomyCheckoutPage"),
);
export const MyFavoritesPage = lazy(
  () => import("@/modules/business/gastronomy/pages/MyFavoritesPage"),
);
export const GastronomySetupPage = createLaunchPausedRoute(
  "Gastronomia operacional",
);
export const GastronomyDashboardPage = createLaunchPausedRoute(
  "Gastronomia operacional",
);
export const MenuManagementPage = createLaunchPausedRoute(
  "Gastronomia operacional",
);
export const BusinessHoursPage = createLaunchPausedRoute(
  "Gastronomia operacional",
);
export const DeliveryAreaPage = createLaunchPausedRoute(
  "Gastronomia operacional",
);
export const OrdersPage = lazy(
  () => import("@/modules/business/gastronomy/pages/OrdersPage"),
);
export const OrderDetailsPage = lazy(
  () => import("@/modules/business/gastronomy/pages/OrderDetailsPage"),
);
export const DeliveryManagementPage = createLaunchPausedRoute("Entregas");
export const AnalyticsPage = createLaunchPausedRoute("Analytics");
export const GastronomyPromotionsPage = createLaunchPausedRoute("Promocoes");

// ============================================================
// EDUCATION
// ============================================================
export const EducationExplorerPage = createLaunchPausedRoute("Educacao");
export const EducationDetailPage = createLaunchPausedRoute("Educacao");

// ============================================================
// SERVICOS E PROFISSIONAIS
// ============================================================
export const ServicosLandingPage = lazy(
  () => import("@/modules/professionals/services/pages/ServicosLandingPage"),
);
export const ProfissionalPublicPage = lazy(
  () => import("@/modules/professionals/pages/ProfissionalPublicPage"),
);
export const ProfessionalLeadTrackingPage = lazy(
  () => import("@/modules/professionals/pages/ProfessionalLeadTrackingPage"),
);
export const CadastrarServicoPage = lazy(
  () => import("@/modules/professionals/services/pages/CadastrarServicoPage"),
);
export const EditarServicoPage = lazy(
  () => import("@/modules/professionals/services/pages/EditarServicoPage"),
);

// ============================================================
// CLASSIFICADOS
// ============================================================
export const ClassificadoDetailPage = lazy(
  () => import("@/modules/classifieds/pages/ClassificadoDetailPage"),
);
export const ClassificadosPage = lazy(
  () => import("@/modules/classifieds/pages/ClassificadosPage"),
);
export const NovoClassificadoPage = lazy(
  () => import("@/modules/classifieds/pages/NovoClassificadoPage"),
);
export const EditarClassificadoPage = lazy(
  () => import("@/modules/classifieds/pages/EditarClassificadoPage"),
);
export const VendedorPerfilPage = lazy(
  () => import("@/modules/classifieds/pages/VendedorPerfilPage"),
);
export const ClassifiedCanonicalRoute = lazy(
  () => import("@/app/routes/classifieds/ClassifiedCanonicalRoute"),
);
export const ClassifiedShortRoute = lazy(
  () => import("@/app/routes/classifieds/ClassifiedShortRoute"),
);

// ============================================================
// VAGAS/EMPREGOS
// ============================================================
export const PublicarVagaPage = lazy(
  () => import("@/modules/classifieds/jobs/pages/PublicarVagaPage"),
);
export const VagasPublicPage = lazy(
  () => import("@/modules/classifieds/jobs/pages/VagasPublicPage"),
);
export const VagaDetailPublicPage = lazy(
  () => import("@/modules/classifieds/jobs/pages/VagaDetailPublicPage"),
);
export const WorkOpportunitiesPage = lazy(
  () => import("@/modules/work-opportunities/pages/WorkOpportunitiesPage"),
);
export const WorkOpportunityDetailPage = lazy(
  () => import("@/modules/work-opportunities/pages/WorkOpportunityDetailPage"),
);

// ============================================================
// COMUNIDADE (GRUPOS, EVENTOS, POSTS)
// ============================================================
export const GruposPage = lazy(
  () => import("@/core/community-groups/pages/GruposPage"),
);
export const ComunidadePage = lazy(
  () => import("@/core/community-feed/pages/ComunidadePage"),
);
export const GrupoDetailPage = lazy(
  () => import("@/core/community-groups/pages/GrupoDetailPage"),
);
export const EventosPage = createLaunchPausedRoute("Eventos");
export const EventoDetailPage = createLaunchPausedRoute("Eventos");
export const EventsListPage = createLaunchPausedRoute("Eventos");
export const EventDetailPage = createLaunchPausedRoute("Eventos");
export const EventsFavoritesPage = createLaunchPausedRoute("Eventos");
export const EventsCalendarPage = createLaunchPausedRoute("Eventos");
export const EventsMapPage = createLaunchPausedRoute("Eventos");
export const EventsOrganizerDashboard = createLaunchPausedRoute("Eventos");
export const EventsOrganizerForm = createLaunchPausedRoute("Eventos");
export const EventsOrganizerAnalyticsPage = createLaunchPausedRoute("Eventos");
export const EventsErrorBoundary = createLaunchPausedRoute("Eventos");
export const RecomendacoesPage = lazy(
  () => import("@/core/community-recommendations/pages/RecomendacoesPage"),
);
export const NovaRecomendacaoPage = lazy(
  () => import("@/core/community-recommendations/pages/NovaRecomendacaoPage"),
);
export const RecomendacaoDetailPage = lazy(
  () => import("@/core/community-recommendations/pages/RecomendacaoDetailPage"),
);
export const AchadosPerdidosPage =
  createLaunchPausedRoute("Achados e perdidos");
export const NovoAchadoPerdidoPage =
  createLaunchPausedRoute("Achados e perdidos");
export const AchadoPerdidoDetailPage =
  createLaunchPausedRoute("Achados e perdidos");
export const ProblemasPage = createLaunchPausedRoute("Problemas");
export const NovoPostPage = lazy(
  () => import("@/core/community-feed/pages/NovoPostPage"),
);

// Comunicacao Territorial
export const CommunicationLandingPage = createLaunchPausedRoute("Comunicacao");
export const CommunicationRequestPage = createLaunchPausedRoute("Comunicacao");
export const CommunicationCityPage = createLaunchPausedRoute("Comunicacao");
export const CommunicationChannelPage = createLaunchPausedRoute("Comunicacao");
export const CommunicationCompanyDetailsPage =
  createLaunchPausedRoute("Comunicacao");
export const CommunicationAgentPage = createLaunchPausedRoute("Comunicacao");
export const CommunicationAgentDashboard =
  createLaunchPausedRoute("Comunicacao");

// ============================================================
// MOBILIDADE (CORRIDAS, MOTORISTAS, MOTOBOY)
// ============================================================
export const MobilidadePage = createLaunchPausedRoute("Mobilidade");
export const PassageiroPage = createLaunchPausedRoute("Mobilidade");
export const BuscandoMotoristaPage = createLaunchPausedRoute("Mobilidade");
export const MotoristaPage = createLaunchPausedRoute("Mobilidade");
export const MotoboyPage = createLaunchPausedRoute("Mobilidade");
export const CriarMotoristaPage = createLaunchPausedRoute("Mobilidade");
export const DriverProfilePage = createLaunchPausedRoute("Mobilidade");
export const HistoricoPage = createLaunchPausedRoute("Mobilidade");
export const TrackRidePage = createLaunchPausedRoute("Mobilidade");
export const EmergencyContactsPage = createLaunchPausedRoute("Mobilidade");

// ============================================================
// PONTOS TURISTICOS (GUIDE)
// ============================================================
export const GuideTouristPointsPage = lazy(
  () => import("@/modules/guide/pages/TouristPointsPage"),
);
export const GuideTouristPointDetailPage = lazy(
  () => import("@/modules/guide/pages/TouristPointDetailPage"),
);
export const TouristPointRouteResolver = lazy(() =>
  import("@/modules/guide/components/TouristPointRouteResolver").then((m) => ({
    default: m.TouristPointRouteResolver,
  })),
);
// ============================================================
// CUPONS E PROMOCOES
// ============================================================
export const CuponsPage = createLaunchPausedRoute("Cupons");
export const CupomDetailPage = createLaunchPausedRoute("Cupons");

// ============================================================
// GAMIFICACAO E RANKING
// ============================================================
export const GamificacaoPage = createLaunchPausedRoute("Gamificacao");
export const RankingPage = createLaunchPausedRoute("Ranking");

// ============================================================
// MENSAGENS E CHAT
// Horizontal Inbox composes lifecycle-enabled domain providers.
// ============================================================
export const MensagensPage = lazy(
  () => import("@/modules/messaging/pages/MensagensPage"),
);

// ============================================================
// MAPAS E GEOLOCALIZACAO
// ============================================================
export const MapaPage = lazy(() => import("@/core/maps/pages/MapaPageV4"));

// ============================================================
// ANALYTICS
// ============================================================
export const GeneralAnalyticsPage = createLaunchPausedRoute("Analytics");

// ============================================================
// LEGAL E CONFIGURACOES
// ============================================================
export const TermosPage = lazy(() => import("@/app/pages/TermosPage"));
export const PrivacidadePage = lazy(
  () => import("@/app/pages/PrivacidadePage"),
);
export const OfflineSettingsPage = lazy(
  () => import("@/app/pages/OfflineSettingsPage"),
);

// ============================================================
// LGPD / PRIVACIDADE
// ============================================================
export const PrivacySettingsPage = lazy(
  () => import("@/app/pages/PrivacySettingsPage"),
);
export const DPOContactPage = lazy(() => import("@/app/pages/DPOContactPage"));

