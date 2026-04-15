import { lazy, Suspense, type ReactNode } from "react";

// ============================================================
// 🚀 CRITICAL IMPORTS - Necessários para FCP
// ============================================================
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SEO } from "@/app/components/SEO";
import { WebVitalsReporter } from "@/app/components/WebVitalsReporter";
import { queryClient } from "@/shared/utils/queryClient";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
import { LAUNCH_URLS } from "@/config/territory";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { AccessibilityProvider } from "@/shared/components/accessibility/AccessibilityProvider";
import { SkipToContent } from "@/shared/components/accessibility/SkipToContent";
import { TerritoryModeInitializer } from "@/core/location/components/TerritoryModeInitializer";
import {
  OfflineBanner,
  OfflineIndicator,
} from "@/shared/components/offline/OfflineIndicator";
import "@/styles/accessibility.css";

// ============================================================
// ⏱️ LAZY PROVIDERS - Carregados após FCP
// ============================================================
const AppLayoutSidebar = lazy(() => import("@/app/components/AppLayoutSidebar").then(m => ({ default: m.AppLayoutSidebar })));

// ============================================================
// 🚀 CRITICAL COMPONENTS - Principais de roteamento (eager)
// ============================================================
import { TerritorialLayout } from "@/core/routing/components/TerritorialLayout";
import { TerritorialIndexPage } from "@/core/routing/components/TerritorialIndexPage";
import { StateLandingPage } from "@/core/routing/components/StateLandingPage";
import { CountryLandingPage } from "@/core/routing/components/CountryLandingPage";
import { BrasilShowcasePage } from "@/core/routing/components/BrasilShowcasePage";
import {
  TerritorialCommunityPage,
  TerritorialBusinessPage,
  TerritorialServicesPage,
  TerritorialClassificadosPage,
  TerritorialEventosPage,
  TerritorialVagasPage,
  TerritorialCategoryBusinessPage,
  TerritorialMapPage,
} from "@/core/routing/components/TerritorialModulePages";

// Critical pages - loaded immediately
import LoginPage from "./app/pages/LoginPage";

// Non-critical public pages - lazy loaded
const HomePage = lazy(() => import("./app/pages/HomePage"));
const HomePageV2 = lazy(() => import("./app/pages/HomePageV2"));
const MainLandingPage = lazy(() => import("./app/pages/MainLandingPage"));
const EmpresasLandingPage = lazy(() => import("./app/pages/EmpresasLandingPage"));

const ServicosLandingPage = lazy(() => import("./modules/services/pages/ServicosLandingPage"));
const PontosTuristicosPage = lazy(() => import("./app/pages/PontosTuristicosPage"));
const PontoTuristicoDetailPage = lazy(() => import("./app/pages/PontoTuristicoDetailPage"));
const PublicarVagaPage = lazy(() => import("./modules/vagas/pages/PublicarVagaPage"));
const VagaDetailPage = lazy(() => import("./modules/vagas/pages/VagaDetailPage"));
const EmpresaDetailLandingPage = lazy(() => import("./app/pages/EmpresaDetailLandingPage"));
const ClassificadoDetailLandingPage = lazy(() => import("./app/pages/ClassificadoDetailLandingPage"));
const ClassificadoChatLandingPage = lazy(() => import("./app/pages/ClassificadoChatLandingPage"));
const SimpleLoginPage = lazy(() => import("./app/pages/SimpleLoginPage"));
const CadastroPage = lazy(() => import("./modules/onboarding/pages/CadastroPage"));
const CadastroConfirmacaoPage = lazy(() => import("./modules/onboarding/pages/CadastroConfirmacaoPage"));
const SplashPage = lazy(() => import("./app/pages/SplashPage"));
const AboutPage = lazy(() => import("./app/pages/AboutPage"));
const ContactPage = lazy(() => import("./app/pages/ContactPage"));

// Lazy loaded pages
const GruposPage = lazy(() => import("./modules/community/pages/GruposPage"));
const GrupoDetailPage = lazy(() => import("./modules/community/pages/GrupoDetailPage"));
const BusinessCanonicalRoute = lazy(() => import("@/core/routing/components/BusinessCanonicalRoute"));
const BusinessRouteResolver = lazy(() => import("@/core/routing/components/BusinessRouteResolver"));
const BusinessPremiumRoute = lazy(() => import("@/core/routing/components/BusinessPremiumRoute"));
const ProfilePublicRoute = lazy(() => import("@/core/routing/components/ProfilePublicRoute"));
const ProfissionalDetailPage = lazy(() => import("./modules/services/pages/ProfissionalDetailPage"));
const ProfissionalPublicPage = lazy(() => import("./modules/professionals/pages/ProfissionalPublicPage"));
const CadastrarServicoPage = lazy(() => import("./modules/services/pages/CadastrarServicoPage"));
const EditarServicoPage = lazy(() => import("./modules/services/pages/EditarServicoPage"));
const ClassificadoDetailPage = lazy(() => import("./modules/classifieds/pages/ClassificadoDetailPage"));
const NovoClassificadoPage = lazy(() => import("./modules/classifieds/pages/NovoClassificadoPage"));
const EditarClassificadoPage = lazy(() => import("./modules/classifieds/pages/EditarClassificadoPage"));
const VendedorPerfilPage = lazy(() => import("./modules/classifieds/pages/VendedorPerfilPage"));
const ClassifiedCanonicalRoute = lazy(() => import("@/core/routing/components/ClassifiedCanonicalRoute"));
const ClassifiedShortRoute = lazy(() => import("@/core/routing/components/ClassifiedShortRoute"));
const EventosPage = lazy(() => import("./modules/community/pages/EventosPage"));
const EventoDetailPage = lazy(() => import("./modules/community/pages/EventoDetailPage"));
const GastronomyLandingPage = lazy(() => import("./modules/gastronomy/pages/GastronomyLandingPage"));
const GastronomyDetailPage = lazy(() => import("./modules/gastronomy/pages/GastronomyDetailPage"));
const MyFavoritesPage = lazy(() => import("./modules/gastronomy/pages/MyFavoritesPage"));
const CuponsPage = lazy(() => import("./modules/business/pages/CuponsPage"));
const CupomDetailPage = lazy(() => import("./modules/business/pages/CupomDetailPage"));
const PerfilPage = lazy(() => import("@/modules/profile/pages/PerfilHubPage"));
const PerfilEditarPage = lazy(() => import("@/modules/profile/pages/PerfilEditarPage"));
const PerfilIdentidadesPage = lazy(() => import("@/modules/profile/pages/PerfilIdentidadesPage"));
const PerfilContaPage = lazy(() => import("@/modules/profile/pages/PerfilContaPage"));
const FamiliaPage = lazy(() => import("./modules/profile/pages/FamiliaPage"));
const CriarEmpresaPage = lazy(() => import("./modules/business/pages/CriarEmpresaPageV2"));
const EditarEmpresaPage = lazy(() => import("./modules/business/pages/EditarEmpresaPage"));
const DashboardEmpresaPage = lazy(() => import("./modules/dashboard/pages/DashboardEmpresaPageV2"));
const GastronomySetupPage = lazy(() => import("./modules/gastronomy/pages/GastronomySetupPage"));
const GastronomyBillingPage = lazy(() => import("./modules/gastronomy/pages/GastronomyBillingPage"));
const GastronomyDashboardPage = lazy(() => import("./modules/gastronomy/pages/GastronomyDashboardPage"));
const GastronomyPlansPage = lazy(() => import("./modules/gastronomy/pages/GastronomyPlansPage"));
const MenuManagementPage = lazy(() => import("./modules/gastronomy/pages/MenuManagementPage"));
const BusinessHoursPage = lazy(() => import("./modules/gastronomy/pages/BusinessHoursPage"));

// Dev/Admin pages
const MotoboyValidationPage = lazy(() => import("./pages/dev/MotoboyValidationPage").then(m => ({ default: m.MotoboyValidationPage })));
const DeliveryAreaPage = lazy(() => import("./modules/gastronomy/pages/DeliveryAreaPage"));
const OrdersPage = lazy(() => import("./modules/gastronomy/pages/OrdersPage"));
const OperationalDashboardPage = lazy(() => import("./modules/gastronomy/pages/OperationalDashboardPage"));
const DeliveryManagementPage = lazy(() => import("./modules/gastronomy/pages/DeliveryManagementPage"));
const AnalyticsPage = lazy(() => import("./modules/gastronomy/pages/AnalyticsPage"));
const AdminDashboardPage = lazy(() => import("./modules/admin/pages/AdminDashboardPage"));
const AdminBusinessesPage = lazy(() => import("./modules/admin/pages/AdminBusinessesPage"));
const AdminPlansPage = lazy(() => import("./modules/admin/pages/AdminPlansPage"));
const OnboardingPage = lazy(() => import("./app/pages/OnboardingPage"));
const RankingPage = lazy(() => import("./core/gamification/pages/RankingPage"));
const BuscaPage = lazy(() => import("./app/pages/BuscaPage"));
const LocationsAdminPage = lazy(() => import("./modules/admin/pages/LocationsAdminPage"));
const EmpresaCatalogoPublicoPage = lazy(() => import("./modules/business/pages/EmpresaCatalogoPublicoPage"));
const MapaPage = lazy(() => import("./core/maps/pages/MapaPageV4"));
const NotFound = lazy(() => import("./app/pages/NotFound"));
const MensagensPage = lazy(() => import("./core/messaging/pages/MensagensPage"));
const ChatPage = lazy(() => import("./core/messaging/pages/ChatPage"));
const ResetPasswordPage = lazy(() => import("./app/pages/ResetPasswordPage"));
const RecomendacoesPage = lazy(() => import("./modules/community/pages/RecomendacoesPage"));
const NovaRecomendacaoPage = lazy(() => import("./modules/community/pages/NovaRecomendacaoPage"));
const RecomendacaoDetailPage = lazy(() => import("./modules/community/pages/RecomendacaoDetailPage"));
const AchadosPerdidosPage = lazy(() => import("./modules/community/pages/AchadosPerdidosPage"));
const NovoAchadoPerdidoPage = lazy(() => import("./modules/community/pages/NovoAchadoPerdidoPage"));
const AchadoPerdidoDetailPage = lazy(() => import("./modules/community/pages/AchadoPerdidoDetailPage"));
const ExamplePostPage = lazy(() => import("./modules/community/pages/ExamplePostPage"));
const AdminLayout = lazy(() => import("./modules/admin/pages/AdminLayout"));
const AdminDashboard = lazy(() => import("./modules/admin/pages/AdminDashboard"));
const AdminBanners = lazy(() => import("./modules/admin/pages/BannersPage"));
const AdminEmpresas = lazy(() => import("./modules/admin/pages/AdminEmpresas"));
const AdminGastronomia = lazy(() => import("./modules/admin/pages/AdminGastronomia"));
const AdminServicos = lazy(() => import("./modules/admin/pages/AdminServicos"));
const AdminClassificados = lazy(() => import("./modules/admin/pages/AdminClassificados"));
const AdminClassificadosDenuncias = lazy(() => import("./modules/admin/pages/AdminClassificadosDenuncias"));
const AdminVagas = lazy(() => import("./modules/admin/pages/AdminVagas"));
const AdminMensagens = lazy(() => import("./modules/admin/pages/AdminMensagens"));
const AdminEventos = lazy(() => import("./modules/admin/pages/AdminEventos"));
const AdminUsuarios = lazy(() => import("./modules/admin/pages/AdminUsuarios"));
const AdminMotoristas = lazy(() => import("./modules/admin/pages/AdminMotoristas"));
const AdminReportsPassageiros = lazy(() => import("./modules/admin/pages/AdminReportsPassageiros"));
const AdminPontosEmbarque = lazy(() => import("./modules/admin/pages/AdminPontosEmbarque"));
const AdminVerificacoes = lazy(() => import("./modules/verification/pages/AdminVerificationsPage"));
const AdminZeladoria = lazy(() => import("./modules/admin/pages/AdminZeladoria"));
const AdminAnalyticsMobilidade = lazy(() => import("./modules/admin/pages/AdminAnalyticsMobilidade"));
const AdminRealtimeDashboard = lazy(() => import("./modules/admin/pages/AdminRealtimeDashboard"));
const AdminModeracaoCompleta = lazy(() => import("./modules/admin/pages/AdminModeracaoCompleta"));
const AdminModeracao = lazy(() => import("./modules/admin/pages/AdminModeracao"));
const AdminAlertas = lazy(() => import("./modules/admin/pages/AdminAlertas"));
const AdminAnalytics = lazy(() => import("./modules/admin/pages/AdminAnalytics"));
const AdminGamificacao = lazy(() => import("./modules/admin/pages/AdminGamificacao"));
const AdminCupons = lazy(() => import("./modules/admin/pages/AdminCupons"));
const AdminRoles = lazy(() => import("./modules/admin/pages/AdminRoles"));
const AdminPricing = lazy(() => import("./modules/admin/pages/AdminPricing"));
const AdminPromocoes = lazy(() => import("./modules/admin/pages/AdminPromocoes"));
const AdminAssinaturas = lazy(() => import("./modules/admin/pages/AdminAssinaturas"));
const AdminCommunityAlerts = lazy(() => import("./modules/admin/pages/AdminCommunityAlerts"));
const AdminCommunityIssues = lazy(() => import("./modules/admin/pages/AdminCommunityIssues"));
const AdminNotifications = lazy(() => import("./modules/admin/pages/AdminNotifications"));
const AdminIdentidade = lazy(() => import("./modules/admin/pages/AdminIdentidade"));
const AdminMapa = lazy(() => import("./modules/admin/pages/AdminMapa"));
const AdminConfiguracoes = lazy(() => import("./modules/admin/pages/AdminConfiguracoes"));
const AdminOperacoes = lazy(() => import("./modules/admin/pages/AdminOperacoes"));
const AdminReivindicacoes = lazy(() => import("./modules/admin/pages/AdminReivindicacoes"));
const AdminSSOT = lazy(() => import("./modules/admin/pages/AdminSSOT"));
const GuideTouristPointsPage = lazy(() => import("./modules/guide/pages/TouristPointsPage"));
const GuideTouristPointDetailPage = lazy(() => import("./modules/guide/pages/TouristPointDetailPage"));
const TouristPointRouteResolver = lazy(() => import("./modules/guide/components/TouristPointRouteResolver").then(m => ({ default: m.TouristPointRouteResolver })));
const AdminGuideTouristPointsPage = lazy(() => import("./modules/guide/pages/AdminTouristPointsPage"));
const AdminGuideTouristPointFormPage = lazy(() => import("./modules/guide/pages/AdminTouristPointFormPage"));
const AdminHighlights = lazy(() => import("./modules/admin/pages/AdminHighlights"));
const AdminTerritoryContent = lazy(() => import("./modules/admin/pages/AdminTerritoryContent"));
const AdminTerritorialGroups = lazy(() => import("./modules/admin/pages/AdminTerritorialGroups"));
const AdminCityMetadata = lazy(() => import("./modules/admin/pages/AdminCityMetadata"));
const AdminTerritoryManagement = lazy(() => import("./modules/admin/pages/AdminTerritoryManagement"));
const RegrasPage = lazy(() => import("./app/pages/RegrasPage"));
const TermosPage = lazy(() => import("./app/pages/TermosPage"));
const PrivacidadePage = lazy(() => import("./app/pages/PrivacidadePage"));
const OfflineSettingsPage = lazy(() => import("./app/pages/OfflineSettingsPage"));
const MobilidadePage = lazy(() => import("./modules/mobility/pages/MobilidadeLandingPage"));
const ConfiguracoesPage = lazy(() => import("./modules/profile/pages/ConfiguracoesPage"));
const ProfileSettingsPage = lazy(() => import("./app/pages/ProfileSettingsPage"));
const GamificacaoPage = lazy(() => import("./core/gamification/pages/GamificacaoPage"));
const PassageiroPage = lazy(() => import("./modules/mobility/pages/PassageiroPage"));
const BuscandoMotoristaPage = lazy(() => import("./modules/mobility/pages/BuscandoMotoristaPage"));
const MotoristaPage = lazy(() => import("./modules/mobility/pages/MotoristaPage"));
const MotoristaPageV2 = lazy(() => import("./modules/mobility/pages/MotoristaPageV2"));
const MotoboyPage = lazy(() => import("./modules/mobility/pages/MotoboyPage"));
const CriarMotoristaPage = lazy(() => import("./modules/mobility/pages/CriarMotoristaPage"));
const DriverProfilePage = lazy(() => import("./modules/mobility/pages/DriverProfilePage"));
const HistoricoPage = lazy(() => import("./modules/mobility/pages/HistoricoPage"));
const TrackRidePage = lazy(() => import("./modules/mobility/pages/TrackRidePage"));
const EmergencyContactsPage = lazy(() => import("./modules/mobility/pages/EmergencyContactsPage"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const GeneralAnalyticsPage = lazy(() => import("./modules/analytics/pages/AnalyticsPage"));
const QrResolverPage = lazy(() => import("./core/qr/pages/QrResolverPage").then(m => ({ default: m.QrResolverPage })));

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <SEO />
      <WebVitalsReporter />
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <TooltipProvider>
            <SessionProvider>
              <MultiProfileProvider>
                <SkipToContent />
                <Toaster />
                <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <TerritoryModeInitializer />
                  <OfflineIndicator />
                  <OfflineBanner />
                  <ModuleContextSync />
                  <Suspense fallback={<FullScreenLoader />}>
                    <Routes>
                      {/* QR Code Resolver - DEVE VIR ANTES DE OUTRAS ROTAS */}
                      <Route path="/q/:token" element={<QrResolverPage />} />
                      
                      <Route path="/splash" element={<SplashPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/cadastro" element={<CadastroPage />} />
                      <Route path="/cadastro/confirmacao" element={<CadastroConfirmacaoPage />} />
                      <Route path="/login-simple" element={<SimpleLoginPage />} />
                      <Route path="/sobre" element={<AboutPage />} />
                      <Route path="/contato" element={<ContactPage />} />
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/businesss/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />

                      <Route element={<AppLayoutSidebar />}>
                        {/* Página inicial */}
                        <Route path="/" element={<MainLandingPage />} />
                        <Route path="/home-v2" element={<HomePageV2 />} />
                        <Route path="/home-v1" element={<HomePage />} />
                        
                        {/* Rotas públicas de landing pages */}
                        <Route path="/empresas-landing" element={<EmpresasLandingPage />} />
                        <Route path="/servicos-landing" element={<ServicosLandingPage />} />
                        <Route path="/empresa/:id" element={<EmpresaDetailLandingPage />} />
                        <Route path="/classificado/:id" element={<ClassificadoDetailLandingPage />} />
                        <Route path="/classificado/:id/chat" element={<ClassificadoChatLandingPage />} />
                        <Route path="/vagas/detalhe/:id" element={<VagaDetailPage />} />
                        
                        {/* Rotas globais */}
                        <Route path="/u/:username" element={<ProfilePublicRoute />} />
                        <Route path="/p/:slug" element={<BusinessPremiumRoute />} />
                        <Route path="/c/:publicId" element={<ClassifiedShortRoute />} />
                        <Route path="/vagas/publicar" element={<PublicarVagaPage />} />
                        <Route path="/services/cadastrar" element={<CadastrarServicoPage />} />
                        <Route path="/services/:id/editar" element={<EditarServicoPage />} />
                        <Route path="/services/:id" element={<ProfissionalDetailPage />} />
                        <Route path="/classificados/novo" element={<NovoClassificadoPage />} />
                        <Route path="/classificados/editar/:id" element={<EditarClassificadoPage />} />
                        <Route path="/classificados/vendedor/:sellerId" element={<VendedorPerfilPage />} />
                        <Route path="/classificados/:id" element={<ClassificadoDetailPage />} />
                        
                        {/* Dev/Admin Routes */}
                        {import.meta.env.DEV && (
                          <Route path="/dev/mobility/motoboy-validation" element={<MotoboyValidationPage />} />
                        )}
                        
                        <Route path="/eventos/:id" element={<EventoDetailPage />} />
                        <Route path="/cupons" element={<CuponsPage />} />
                        <Route path="/cupons/:id" element={<CupomDetailPage />} />
                        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                        <Route path="/perfil/configuracoes" element={<ProfileSettingsPage />} />
                        <Route path="/gamificacao" element={<GamificacaoPage />} />
                        <Route path="/create-business" element={<Navigate to="/empresas/criar-empresa" replace />} />
                        <Route path="/empresas/criar-empresa" element={<CriarEmpresaPage />} />
                        <Route path="/edit-business/:profileId" element={<EditarEmpresaPage />} />
                        <Route path="/dashboard/business/:profileId" element={<DashboardEmpresaPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy" element={<Navigate to="dashboard" replace />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/setup" element={<GastronomySetupPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/billing" element={<GastronomyBillingPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/dashboard" element={<GastronomyDashboardPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/operational" element={<OperationalDashboardPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/plans" element={<GastronomyPlansPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/menu" element={<MenuManagementPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/hours" element={<BusinessHoursPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/delivery-area" element={<DeliveryAreaPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/delivery" element={<Navigate to="../deliveries" replace />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/orders" element={<OrdersPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/deliveries" element={<DeliveryManagementPage />} />
                        <Route path="/dashboard/business/:businessId/gastronomy/analytics" element={<AnalyticsPage />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
                        <Route path="/admin/plans" element={<AdminPlansPage />} />
                        <Route path="/mensagens" element={<MensagensPage />} />
                        <Route path="/chat/:conversationId" element={<ChatPage />} />
                        <Route path="/mapa" element={<MapaPage />} />
                        <Route path="/perto-de-mim" element={<NearbyPage />} />
                        <Route path="/analytics" element={<GeneralAnalyticsPage />} />
                        <Route path="/recomendacoes" element={<RecomendacoesPage />} />
                        <Route path="/recomendacoes/nova" element={<NovaRecomendacaoPage />} />
                        <Route path="/recomendacoes/:id" element={<RecomendacaoDetailPage />} />
                        <Route path="/achados-perdidos" element={<AchadosPerdidosPage />} />
                        <Route path="/achados-perdidos/novo" element={<NovoAchadoPerdidoPage />} />
                        <Route path="/achados-perdidos/:id" element={<AchadoPerdidoDetailPage />} />
                        <Route path="/ranking" element={<RankingPage />} />
                        <Route path="/track/:token" element={<TrackRidePage />} />
                        <Route path="/grupos" element={<GruposPage />} />
                        <Route path="/grupos/:id" element={<GrupoDetailPage />} />
                        <Route path="/comunidade/grupo/:id" element={<GrupoDetailPage />} />
                        <Route path="/exemplo-post" element={<ExamplePostPage />} />
                        <Route path="/busca" element={<BuscaPage />} />
                        <Route path="/regras" element={<RegrasPage />} />
                        <Route path="/termos" element={<TermosPage />} />
                        <Route path="/privacidade" element={<PrivacidadePage />} />
                        <Route path="/offline-settings" element={<OfflineSettingsPage />} />
                        <Route path="/motorista-legacy" element={<MotoristaPage />} />
                        <Route path="/create-driver" element={<CriarMotoristaPage />} />

                        {/* Rotas legadas sem território */}
                        <Route path="/comunidade" element={<Navigate to={LAUNCH_URLS.community} replace />} />
                        <Route path="/comunidade/alertas" element={<Navigate to={LAUNCH_URLS.community} replace />} />
                        <Route path="/comunidade/problemas" element={<Navigate to={LAUNCH_URLS.community} replace />} />
                        <Route path="/alertas" element={<Navigate to={LAUNCH_URLS.community} replace />} />
                        <Route path="/businesss" element={<Navigate to={LAUNCH_URLS.business} replace />} />
                        <Route path="/services" element={<Navigate to={LAUNCH_URLS.services} replace />} />
                        <Route path="/classificados" element={<Navigate to={LAUNCH_URLS.classifieds} replace />} />
                        <Route path="/mobilidade/passageiro" element={<PassageiroPage />} />
                        <Route path="/mobilidade/buscando/:rideId" element={<BuscandoMotoristaPage />} />
                        <Route path="/mobilidade/motorista" element={<MotoristaPageV2 />} />
                        <Route path="/mobilidade/motoboy" element={<MotoboyPage />} />
                        <Route path="/mobilidade/motorista/perfil" element={<DriverProfilePage />} />
                        <Route path="/mobilidade/historico" element={<HistoricoPage />} />
                        <Route path="/mobilidade/contatos-emergencia" element={<EmergencyContactsPage />} />
                        <Route path="/mobilidade" element={<MobilidadePage />} />

                        {/* Rotas canônicas específicas — DEVEM VIR ANTES DAS TERRITORIAIS GENÉRICAS */}
                        
                        {/* Rota pública de profissional: /profissionais/:uf/:cidade/:slug */}
                        <Route path="/profissionais/:uf/:cidade/:slug" element={<ProfissionalPublicPage />} />

                        {/* Módulo Pontos Turísticos — vertical tourism */}
                        {/* Mesmo padrão dos outros módulos territoriais */}
                        
                        {/* Rota de fallback por ID (UUID): /pontos-turisticos/:id */}
                        <Route path="/pontos-turisticos/:id" element={<GuideTouristPointDetailPage />} />
                        
                        {/* Detalhe com distrito (4 segmentos): /pontos-turisticos/:state/:city/:district/:slug */}
                        <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug" element={<TerritorialLayout />}>
                          <Route index element={<GuideTouristPointDetailPage />} />
                        </Route>
                        
                        {/* Rota ambígua (3 segmentos): pode ser listagem com district OU detalhe com slug */}
                        <Route path="/pontos-turisticos/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TouristPointRouteResolver />} />
                        </Route>
                        
                        {/* Listagem cidade (2 segmentos): /pontos-turisticos/:state/:city */}
                        <Route path="/pontos-turisticos/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<GuideTouristPointsPage />} />
                        </Route>

                        {/* Rotas territoriais genéricas — DEVEM VIR DEPOIS DAS ESPECÍFICAS */}
                        
                        {/* Landing territorial genérico */}
                        <Route path="/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialIndexPage />} />
                        </Route>
                        <Route path="/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialIndexPage />} />
                        </Route>

                        {/* Landing de estado — lista cidades ativas */}
                        <Route path="/:state" element={<StateLandingPage />} />

                        {/* Landing de país — lista estados ativos */}
                        <Route path="/brasil" element={<BrasilShowcasePage />} />
                        <Route path="/br" element={<CountryLandingPage />} />

                        {/* Módulo empresas — estrutura hierárquica clara */}
                        {/* 5 segmentos = empresa específica: /empresas/:uf/:cidade/:bairro/:slug */}
                        <Route path="/empresas/:state/:city/:district/:slug" element={<BusinessRouteResolver />} />
                        
                        {/* Categoria: /empresas/:uf/:cidade/categoria/:category */}
                        <Route path="/empresas/:state/:city/categoria/:category" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialCategoryBusinessPage />} />
                        </Route>
                        
                        {/* Categoria no bairro: /empresas/:uf/:cidade/:bairro/categoria/:category */}
                        <Route path="/empresas/:state/:city/:district/categoria/:category" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialCategoryBusinessPage />} />
                        </Route>
                        
                        {/* 4 segmentos = hub do bairro: /empresas/:uf/:cidade/:bairro */}
                        <Route path="/empresas/:state/:city/:district" element={<TerritorialLayout />}>
                          <Route index element={<EmpresasLandingPage />} />
                        </Route>
                        
                        {/* 3 segmentos = hub da cidade: /empresas/:uf/:cidade */}
                        <Route path="/empresas/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<EmpresasLandingPage />} />
                        </Route>

                        {/* Rotas de serviços */}
                        <Route path="/servicos/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialServicesPage />} />
                        </Route>
                        <Route path="/servicos/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialServicesPage />} />
                        </Route>

                        {/* Rotas de classificados */}
                        {/* 7 segmentos = classificado específico: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId */}
                        <Route path="/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId" element={<ClassifiedCanonicalRoute />} />
                        
                        {/* 5 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria/:subcategoria */}
                        <Route path="/classificados/:state/:city/:district/:category/:subcategory" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialClassificadosPage />} />
                        </Route>
                        
                        {/* 4 segmentos = hub categoria no bairro: /classificados/:uf/:cidade/:bairro/:categoria */}
                        <Route path="/classificados/:state/:city/:district/:category" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialClassificadosPage />} />
                        </Route>
                        
                        {/* 3 segmentos = hub do bairro: /classificados/:uf/:cidade/:bairro */}
                        <Route path="/classificados/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialClassificadosPage />} />
                        </Route>
                        
                        {/* 2 segmentos = hub da cidade: /classificados/:uf/:cidade */}
                        <Route path="/classificados/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialClassificadosPage />} />
                        </Route>

                        {/* Rotas de eventos */}
                        <Route path="/eventos/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialEventosPage />} />
                        </Route>
                        <Route path="/eventos/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialEventosPage />} />
                        </Route>

                        {/* Rotas do mapa — mesmo padrão territorial */}
                        <Route path="/mapa/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialMapPage />} />
                        </Route>
                        <Route path="/mapa/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialMapPage />} />
                        </Route>

                        {/* Rotas de gastronomia */}
                        {/* Detalhe: /gastronomia/:uf/:cidade/:bairro/:slug */}
                        <Route path="/gastronomia/:state/:city/:district/:slug" element={<TerritorialLayout />}>
                          <Route index element={<GastronomyDetailPage />} />
                        </Route>
                        
                        {/* Listagem bairro: /gastronomia/:uf/:cidade/:bairro */}
                        <Route path="/gastronomia/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<GastronomyLandingPage />} />
                        </Route>
                        
                        {/* Listagem cidade: /gastronomia/:uf/:cidade */}
                        <Route path="/gastronomia/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<GastronomyLandingPage />} />
                        </Route>

                        {/* Favoritos de gastronomia */}
                        <Route path="/gastronomia/favoritos" element={<MyFavoritesPage />} />

                        {/* Rotas de comunidade */}
                        <Route path="/comunidade/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialCommunityPage />} />
                        </Route>
                        <Route path="/comunidade/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialCommunityPage />} />
                        </Route>

                        {/* Rotas de vagas */}
                        <Route path="/vagas/:state/:city/:groupSlugOrDistrict" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialVagasPage />} />
                        </Route>
                        <Route path="/vagas/:state/:city" element={<TerritorialLayout />}>
                          <Route index element={<TerritorialVagasPage />} />
                        </Route>

                        {/* Rotas de perfil */}
                        <Route path="/perfil" element={<PerfilPage />} />
                        <Route path="/perfil/gerenciar" element={<Navigate to="/perfil/identidades" replace />} />
                        <Route path="/perfil/editar/:profileId" element={<PerfilEditarPage />} />
                        <Route path="/perfil/identidades" element={<PerfilIdentidadesPage />} />
                        <Route path="/perfil/conta" element={<PerfilContaPage />} />
                        <Route path="/perfil/familia" element={<FamiliaPage />} />
                      </Route>

                      {/* Rotas fora do layout */}
                      <Route path="/profile" element={<Navigate to="/perfil" replace />} />
                      <Route path="/profile/gerenciar" element={<Navigate to="/perfil" replace />} />
                      <Route path="/profile/familia" element={<Navigate to="/perfil/familia" replace />} />

                      {/* Rotas de admin */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="banners" element={<AdminBanners />} />
                        <Route path="empresas" element={<AdminEmpresas />} />
                        {/* Redirect do typo histórico */}
                        <Route path="businesss" element={<Navigate to="/admin/empresas" replace />} />
                        <Route path="gastronomia" element={<AdminGastronomia />} />
                        <Route path="services" element={<AdminServicos />} />
                        <Route path="classificados" element={<AdminClassificados />} />
                        <Route path="classificados/denuncias" element={<AdminClassificadosDenuncias />} />
                        <Route path="vagas" element={<AdminVagas />} />
                        <Route path="eventos" element={<AdminEventos />} />
                        <Route path="usuarios" element={<AdminUsuarios />} />
                        <Route path="users" element={<Navigate to="/admin/usuarios" replace />} />
                        <Route path="motoristas" element={<AdminMotoristas />} />
                        <Route path="reports-passageiros" element={<AdminReportsPassageiros />} />
                        <Route path="pontos-embarque" element={<AdminPontosEmbarque />} />
                        <Route path="verificacoes" element={<AdminVerificacoes />} />
                        <Route path="zeladoria" element={<AdminZeladoria />} />
                        <Route path="analytics-mobilidade" element={<AdminAnalyticsMobilidade />} />
                        <Route path="realtime-dashboard" element={<AdminRealtimeDashboard />} />
                        <Route path="moderacao-completa" element={<AdminModeracaoCompleta />} />
                        <Route path="moderacao" element={<AdminModeracao />} />
                        <Route path="alertas" element={<AdminAlertas />} />
                        <Route path="community-alerts" element={<AdminCommunityAlerts />} />
                        <Route path="community-issues" element={<AdminCommunityIssues />} />
                          <Route path="notifications" element={<AdminNotifications />} />
                          <Route path="mensagens" element={<AdminMensagens />} />
                          <Route path="gamificacao" element={<AdminGamificacao />} />
                          <Route path="cupons" element={<AdminCupons />} />
                          <Route path="promocoes" element={<AdminPromocoes />} />
                          <Route path="assinaturas" element={<AdminAssinaturas />} />
                          <Route path="roles" element={<AdminRoles />} />
                          <Route path="identidade" element={<AdminIdentidade />} />
                          <Route path="mapa" element={<AdminMapa />} />
                          <Route path="pricing" element={<AdminPricing />} />
                        <Route path="configuracoes" element={<AdminConfiguracoes />} />
                        <Route path="operacoes" element={<AdminOperacoes />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="reivindicacoes" element={<AdminReivindicacoes />} />
                        <Route path="ssot" element={<AdminSSOT />} />
                        <Route path="highlights" element={<AdminHighlights />} />
                        <Route path="territory-content" element={<AdminTerritoryContent />} />
                        <Route path="territorial-groups" element={<AdminTerritorialGroups />} />
                        <Route path="city-metadata" element={<AdminCityMetadata />} />
                        <Route path="territory-management" element={<AdminTerritoryManagement />} />
                        {/* Compatibilidade com links legados de pontos turísticos */}
                        <Route path="pontos-turisticos" element={<AdminGuideTouristPointsPage />} />
                        <Route path="pontos-turisticos/novo" element={<AdminGuideTouristPointFormPage />} />
                        <Route path="pontos-turisticos/:id/editar" element={<AdminGuideTouristPointFormPage />} />

                        {/* Módulo Guide - Pontos Turísticos */}
                        <Route path="guia/pontos-turisticos" element={<AdminGuideTouristPointsPage />} />
                        <Route path="guia/pontos-turisticos/novo" element={<AdminGuideTouristPointFormPage />} />
                        <Route path="guia/pontos-turisticos/:id/editar" element={<AdminGuideTouristPointFormPage />} />
                        
                        {/* Gerenciamento de Locations */}
                        <Route path="locations" element={<LocationsAdminPage />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </MultiProfileProvider>
            </SessionProvider>
          </TooltipProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
