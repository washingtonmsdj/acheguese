/**
 * Lazy Imports Organizados por Domínio
 * 
 * Centraliza todos os lazy imports das páginas da aplicação
 * para manter o App.tsx limpo e focado na configuração.
 * 
 * @version 1.0.0
 */

import { lazy } from "react";

// ============================================================
// ⏱️ LAYOUT E PROVIDERS
// ============================================================
export const AppLayoutSidebar = lazy(() => 
  import("@/app/components/AppLayoutSidebar").then(m => ({ default: m.AppLayoutSidebar }))
);

// ============================================================
// 🏠 PÁGINAS PÚBLICAS (Landing Pages)
// ============================================================
export const HomePage = lazy(() => import("@/app/pages/HomePage"));
export const HomePageV2 = lazy(() => import("@/app/pages/HomePageV2"));
export const MainLandingPage = lazy(() => import("@/app/pages/MainLandingPage"));
export const EmpresasLandingPage = lazy(() => import("@/app/pages/EmpresasLandingPage"));
export const CidadeLandingPage = lazy(() => import("@/app/pages/CidadeLandingPage"));
export const ComplexoNordesteLandingPage = lazy(() => import("@/app/pages/ComplexoNordesteLandingPage"));
export const AboutPage = lazy(() => import("@/app/pages/AboutPage"));
export const ContactPage = lazy(() => import("@/app/pages/ContactPage"));
export const SplashPage = lazy(() => import("@/app/pages/SplashPage"));
export const OnboardingPage = lazy(() => import("@/app/pages/OnboardingPage"));
export const BuscaPage = lazy(() => import("@/app/pages/BuscaPage"));
export const BuscarPage = lazy(() => import("@/app/pages/BuscarPage"));
export const NearbyPage = lazy(() => import("@/app/pages/NearbyPage"));
export const NotFound = lazy(() => import("@/app/pages/NotFound"));
export const StatusPage = lazy(() => import("@/app/pages/StatusPage"));
export const VirtualTryOnPage = lazy(() => import("@/app/pages/VirtualTryOnPage"));

// ============================================================
// 🔐 AUTENTICAÇÃO E ONBOARDING
// ============================================================
export const LoginPage = lazy(() => import("@/app/pages/LoginPage"));
export const SimpleLoginPage = lazy(() => import("@/app/pages/SimpleLoginPage"));
export const CadastroPage = lazy(() => import("@/app/features/onboarding/pages/CadastroPage"));
export const CadastroConfirmacaoPage = lazy(() => import("@/app/features/onboarding/pages/CadastroConfirmacaoPage"));
export const ResetPasswordPage = lazy(() => import("@/app/pages/ResetPasswordPage"));

// ============================================================
// 👤 PERFIL E CONFIGURAÇÕES
// ============================================================
export const ContaPage = lazy(() => import("@/modules/profile/pages/ContaHubPage"));
export const ContaEditarPerfilPage = lazy(() => import("@/modules/profile/pages/ContaEditarPerfilPage"));
export const ContaSegurancaPage = lazy(() => import("@/modules/profile/pages/ContaSegurancaPage"));
export const ContaPreferenciasPage = lazy(() => import("@/modules/profile/pages/ContaPreferenciasPage"));
export const ContaEnderecosPage = lazy(() => import("@/modules/profile/pages/ContaEnderecosPage"));
export const ContaProfissionalPage = lazy(() => import("@/modules/profile/pages/ContaProfissionalPage"));
export const ContaEditarPage = lazy(() => import("@/modules/profile/pages/ContaEditarPage"));

// ============================================================
// 💳 BILLING E ASSINATURAS
// ============================================================
export const PricingPage = lazy(() => import("@/app/pages/PricingPage"));
export const CheckoutSuccessPage = lazy(() => import("@/app/pages/CheckoutSuccessPage"));
export const CheckoutCancelPage = lazy(() => import("@/app/pages/CheckoutCancelPage"));
export const SubscriptionManagementPage = lazy(() => import("@/app/pages/SubscriptionManagementPage"));

// ============================================================
// 🔔 NOTIFICAÇÕES
// ============================================================
export const NotificationsPage = lazy(() => import("@/app/pages/NotificationsPage"));
export const NotificationPreferencesPage = lazy(() => import("@/app/pages/NotificationPreferencesPage"));
export const EmailLogsPage = lazy(() => import("@/app/pages/EmailLogsPage"));
export const ProfileSettingsPage = lazy(() => import("@/app/pages/ProfileSettingsPage"));
export const ProfilePublicRoute = lazy(() => import("@/core/routing/components/ProfilePublicRoute"));

// ============================================================
// 🏢 EMPRESAS E NEGÓCIOS
// ============================================================
export const CriarEmpresaPage = lazy(() => import("@/modules/business/pages/CriarEmpresaPageV2"));
export const EmpresasCadastroLandingPage = lazy(() => import("@/modules/business/pages/EmpresasCadastroLandingPage"));
export const EditarEmpresaPage = lazy(() => import("@/modules/business/pages/EditarEmpresaPage"));
export const DashboardEmpresaPage = lazy(() => import("@/app/features/dashboard/pages/DashboardEmpresaPageV2"));
export const BusinessDashboardShellPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessDashboardShellPage"));
export const BusinessOverviewPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessOverviewPage"));
export const BusinessDetailsPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessDetailsPage"));
export const BusinessPlansPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessPlansPage"));
export const BusinessPremiumSitePage = lazy(() => import("@/modules/business/dashboard/pages/BusinessPremiumSitePage"));
export const BusinessAnalyticsPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessAnalyticsPage"));
export const BusinessSettingsPage = lazy(() => import("@/modules/business/dashboard/pages/BusinessSettingsPage"));
export const EmpresaDetailLandingPage = lazy(() => import("@/app/pages/EmpresaDetailLandingPage"));
export const EmpresaCatalogoPublicoPage = lazy(() => import("@/modules/business/pages/EmpresaCatalogoPublicoPage"));
export const BusinessCanonicalRoute = lazy(() => import("@/core/routing/components/BusinessCanonicalRoute"));
export const BusinessRouteResolver = lazy(() => import("@/core/routing/components/BusinessRouteResolver"));
export const BusinessLegacyRoute = lazy(() => import("@/core/routing/components/BusinessLegacyRoute"));
export const PremiumBusinessSiteRoute = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessSiteRoute"));
export const PremiumBusinessHomePage = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessHomePage"));
export const PremiumBusinessMenuPage = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessMenuPage"));
export const PremiumBusinessProductPage = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessProductPage"));
export const PremiumBusinessCartPage = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessCartPage"));
export const PremiumBusinessCheckoutPage = lazy(() => import("@/modules/business/premium/pages/PremiumBusinessCheckoutPage"));

// ============================================================
// 🍽️ GASTRONOMIA
// ============================================================
export const GastronomyLandingPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyLandingPage"));
export const GastronomyDetailPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyDetailPageV2"));
export const GastronomyPremiumDetailPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyPremiumDetailPage"));
export const GastronomyCheckoutPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyCheckoutPage"));
export const MyFavoritesPage = lazy(() => import("@/modules/business/gastronomy/pages/MyFavoritesPage"));
export const GastronomySetupPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomySetupPage"));
export const GastronomyDashboardPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyDashboardPage"));
export const MenuManagementPage = lazy(() => import("@/modules/business/gastronomy/pages/MenuManagementPage"));
export const BusinessHoursPage = lazy(() => import("@/modules/business/gastronomy/pages/BusinessHoursPage"));
export const DeliveryAreaPage = lazy(() => import("@/modules/business/gastronomy/pages/DeliveryAreaPage"));
export const OrdersPage = lazy(() => import("@/modules/business/gastronomy/pages/OrdersPage"));
export const OrderDetailsPage = lazy(() => import("@/modules/business/gastronomy/pages/OrderDetailsPage"));
export const DeliveryManagementPage = lazy(() => import("@/modules/business/gastronomy/pages/DeliveryManagementPage"));
export const AnalyticsPage = lazy(() => import("@/modules/business/gastronomy/pages/AnalyticsPage"));
export const GastronomyPromotionsPage = lazy(() => import("@/modules/business/gastronomy/pages/GastronomyPromotionsPage"));

// ============================================================
// � EDUCATION
// ============================================================
export const EducationExplorerPage = lazy(() => import("@/modules/business/education/pages/EducationExplorerPage"));
export const EducationDetailPage = lazy(() => import("@/modules/business/education/pages/EducationDetailPage"));
export const EducationDashboardPage = lazy(() => import("@/modules/business/education/pages/EducationDashboardPage"));
export const EducationSetupPage = lazy(() => import("@/modules/business/education/pages/EducationSetupPage"));
export const EducationLeadsPage = lazy(() => import("@/modules/business/education/pages/EducationLeadsPage"));
export const EducationEventsPage = lazy(() => import("@/modules/business/education/pages/EducationEventsPage"));
export const EducationProgramsPage = lazy(() => import("@/modules/business/education/pages/EducationProgramsPage"));
export const EducationAnalyticsPage = lazy(() => import("@/modules/business/education/pages/EducationAnalyticsPage"));
export const EducationPlansPage = lazy(() => import("@/modules/business/education/pages/EducationPlansPage"));

// ============================================================
// �� SERVIÇOS E PROFISSIONAIS
// ============================================================
export const ServicosLandingPage = lazy(() => import("@/modules/professionals/services/pages/ServicosLandingPage"));
export const ProfissionalDetailPage = lazy(() => import("@/modules/professionals/services/pages/ProfissionalDetailPage"));
export const ProfissionalPublicPage = lazy(() => import("@/modules/professionals/pages/ProfissionalPublicPage"));
export const ProfessionalLeadTrackingPage = lazy(() => import("@/modules/professionals/pages/ProfessionalLeadTrackingPage"));
export const CadastrarServicoPage = lazy(() => import("@/modules/professionals/services/pages/CadastrarServicoPage"));
export const EditarServicoPage = lazy(() => import("@/modules/professionals/services/pages/EditarServicoPage"));

// ============================================================
// 📢 CLASSIFICADOS
// ============================================================
export const ClassificadoDetailPage = lazy(() => import("@/modules/classifieds/pages/ClassificadoDetailPage"));
export const ClassificadosPage = lazy(() => import("@/modules/classifieds/pages/ClassificadosPage"));
export const ClassificadoDetailLandingPage = lazy(() => import("@/app/pages/ClassificadoDetailLandingPage"));
export const ClassificadoChatLandingPage = lazy(() => import("@/app/pages/ClassificadoChatLandingPage"));
export const NovoClassificadoPage = lazy(() => import("@/modules/classifieds/pages/NovoClassificadoPage"));
export const EditarClassificadoPage = lazy(() => import("@/modules/classifieds/pages/EditarClassificadoPage"));
export const VendedorPerfilPage = lazy(() => import("@/modules/classifieds/pages/VendedorPerfilPage"));
export const ClassifiedCanonicalRoute = lazy(() => import("@/core/routing/components/ClassifiedCanonicalRoute"));
export const ClassifiedShortRoute = lazy(() => import("@/core/routing/components/ClassifiedShortRoute"));

// ============================================================
// 💼 VAGAS/EMPREGOS
// ============================================================
export const PublicarVagaPage = lazy(() => import("@/modules/classifieds/jobs/pages/PublicarVagaPage"));
export const VagasPublicPage = lazy(() => import("@/modules/classifieds/jobs/pages/VagasPublicPage"));
export const VagaDetailPage = lazy(() => import("@/modules/classifieds/jobs/pages/VagaDetailPage"));
export const VagaDetailPublicPage = lazy(() => import("@/modules/classifieds/jobs/pages/VagaDetailPublicPage"));

// ============================================================
// 👥 COMUNIDADE (GRUPOS, EVENTOS, POSTS)
// ============================================================
export const GruposPage = lazy(() => import("@/modules/community-groups/pages/GruposPage"));
export const ComunidadePage = lazy(() => import("@/modules/community-feed/pages/ComunidadePage"));
export const GrupoDetailPage = lazy(() => import("@/modules/community-groups/pages/GrupoDetailPage"));
export const EventosPage = lazy(() => import("@/modules/community-events/pages/EventosPage"));
export const EventoDetailPage = lazy(() => import("@/modules/community-events/pages/EventoDetailPage"));
export const RecomendacoesPage = lazy(() => import("@/modules/community-recommendations/pages/RecomendacoesPage"));
export const NovaRecomendacaoPage = lazy(() => import("@/modules/community-recommendations/pages/NovaRecomendacaoPage"));
export const RecomendacaoDetailPage = lazy(() => import("@/modules/community-recommendations/pages/RecomendacaoDetailPage"));
export const AchadosPerdidosPage = lazy(() => import("@/modules/community-lost-found/pages/AchadosPerdidosPage"));
export const NovoAchadoPerdidoPage = lazy(() => import("@/modules/community-lost-found/pages/NovoAchadoPerdidoPage"));
export const AchadoPerdidoDetailPage = lazy(() => import("@/modules/community-lost-found/pages/AchadoPerdidoDetailPage"));
export const AlertasPage = lazy(() => import("@/modules/community-alerts/pages/AlertasPage"));
export const ProblemasPage = lazy(() => import("@/modules/community-issues/pages/ProblemasPage"));
export const NovoPostPage = lazy(() => import("@/modules/community-feed/pages/NovoPostPage"));
export const ExamplePostPage = lazy(() => import("@/modules/community-feed/pages/ExamplePostPage"));

// ============================================================
// 🚗 MOBILIDADE (CORRIDAS, MOTORISTAS, MOTOBOY)
// ============================================================
export const MobilidadePage = lazy(() => import("@/modules/mobility/pages/MobilidadeLandingPage"));
export const PassageiroPage = lazy(() => import("@/modules/mobility/pages/PassageiroPage"));
export const BuscandoMotoristaPage = lazy(() => import("@/modules/mobility/pages/BuscandoMotoristaPage"));
export const MotoristaPage = lazy(() => import("@/modules/mobility/pages/MotoristaPage"));
export const MotoristaPageV2 = lazy(() => import("@/modules/mobility/pages/MotoristaPageV2"));
export const MotoboyPage = lazy(() => import("@/modules/mobility/pages/MotoboyPage"));
export const CriarMotoristaPage = lazy(() => import("@/modules/mobility/pages/CriarMotoristaPage"));
export const DriverProfilePage = lazy(() => import("@/modules/mobility/pages/DriverProfilePage"));
export const HistoricoPage = lazy(() => import("@/modules/mobility/pages/HistoricoPage"));
export const TrackRidePage = lazy(() => import("@/modules/mobility/pages/TrackRidePage"));
export const EmergencyContactsPage = lazy(() => import("@/modules/mobility/pages/EmergencyContactsPage"));

// ============================================================
// 🎯 PONTOS TURÍSTICOS (GUIDE)
// ============================================================
export const PontosTuristicosPage = lazy(() => import("@/app/pages/PontosTuristicosPage"));
export const PontoTuristicoDetailPage = lazy(() => import("@/app/pages/PontoTuristicoDetailPage"));
export const GuideTouristPointsPage = lazy(() => import("@/modules/guide/pages/TouristPointsPage"));
export const GuideTouristPointDetailPage = lazy(() => import("@/modules/guide/pages/TouristPointDetailPage"));
export const TouristPointRouteResolver = lazy(() => 
  import("@/modules/guide/components/TouristPointRouteResolver").then(m => ({ default: m.TouristPointRouteResolver }))
);
export const AdminGuideTouristPointsPage = lazy(() => import("@/modules/guide/pages/AdminTouristPointsPage"));
export const AdminGuideTouristPointFormPage = lazy(() => import("@/modules/guide/pages/AdminTouristPointFormPage"));

// ============================================================
// 🎫 CUPONS E PROMOÇÕES
// ============================================================
export const CuponsPage = lazy(() => import("@/modules/business/pages/CuponsPage"));
export const CupomDetailPage = lazy(() => import("@/modules/business/pages/CupomDetailPage"));

// ============================================================
// 🏆 GAMIFICAÇÃO E RANKING
// ============================================================
export const GamificacaoPage = lazy(() => import("@/core/gamification/pages/GamificacaoPage"));
export const RankingPage = lazy(() => import("@/core/gamification/pages/RankingPage"));

// ============================================================
// 💬 MENSAGENS E CHAT
// ============================================================
export const MensagensPage = lazy(() => import("@/core/messaging/pages/MensagensPage"));
export const ChatPage = lazy(() => import("@/core/messaging/pages/ChatPage"));

// ============================================================
// 🗺️ MAPAS E GEOLOCALIZAÇÃO
// ============================================================
export const MapaPage = lazy(() => import("@/core/maps/pages/MapaPageV4"));

// ============================================================
// 📊 ANALYTICS
// ============================================================
export const GeneralAnalyticsPage = lazy(() => import("@/core/analytics/pages/AnalyticsPage"));

// ============================================================
// 📱 QR CODE
// ============================================================
export const QrResolverPage = lazy(() => 
  import("@/core/qr/pages/QrResolverPage").then(m => ({ default: m.QrResolverPage }))
);

// ============================================================
// ⚙️ LEGAL E CONFIGURAÇÕES
// ============================================================
export const RegrasPage = lazy(() => import("@/app/pages/RegrasPage"));
export const TermosPage = lazy(() => import("@/app/pages/TermosPage"));
export const PrivacidadePage = lazy(() => import("@/app/pages/PrivacidadePage"));
export const OfflineSettingsPage = lazy(() => import("@/app/pages/OfflineSettingsPage"));

// ============================================================
// � LGPD / PRIVACIDADE
// ============================================================
export const PrivacySettingsPage = lazy(() => import("@/app/pages/PrivacySettingsPage"));
export const DPOContactPage = lazy(() => import("@/app/pages/DPOContactPage"));

// ============================================================
// �🔧 DEV/ADMIN PAGES
// ============================================================
export const MotoboyValidationPage = lazy(() => 
  import("@/app/pages/dev/MotoboyValidationPage").then(m => ({ default: m.MotoboyValidationPage }))
);
export const LocationsAdminPage = lazy(() => import("@/modules/admin/pages/LocationsAdminPage"));

// ============================================================
// 🛡️ ADMIN DASHBOARD E MÓDULOS
// ============================================================
export const AdminDashboardPage = lazy(() => import("@/modules/admin/pages/AdminDashboardPage"));
export const AdminBusinessesPage = lazy(() => import("@/modules/admin/pages/AdminBusinessesPage"));
export const AdminPlansPage = lazy(() => import("@/modules/admin/pages/AdminPlansPage"));

// ============================================================
// 🛡️ ADMIN LAYOUT E PÁGINAS
// ============================================================
export const AdminLayout = lazy(() => import("@/modules/admin/pages/AdminLayout"));
export const AdminDashboard = lazy(() => import("@/modules/admin/pages/AdminDashboard"));
export const AdminBanners = lazy(() => import("@/modules/admin/pages/BannersPage"));
export const AdminEmpresas = lazy(() => import("@/modules/admin/pages/AdminEmpresas"));
export const AdminGastronomia = lazy(() => import("@/modules/admin/pages/AdminGastronomia"));
export const AdminServicos = lazy(() => import("@/modules/admin/pages/AdminServicos"));
export const AdminClassificados = lazy(() => import("@/modules/admin/pages/AdminClassificados"));
export const AdminClassificadosDenuncias = lazy(() => import("@/modules/admin/pages/AdminClassificadosDenuncias"));
export const AdminVagas = lazy(() => import("@/modules/admin/pages/AdminVagas"));
export const AdminEventos = lazy(() => import("@/modules/admin/pages/AdminEventos"));
export const AdminUsuarios = lazy(() => import("@/modules/admin/pages/AdminUsuarios"));
export const AdminMotoristas = lazy(() => import("@/modules/admin/pages/AdminMotoristas"));
export const AdminReportsPassageiros = lazy(() => import("@/modules/admin/pages/AdminReportsPassageirosV2"));
export const AdminReportsPassageirosV2 = AdminReportsPassageiros;
export const AdminPontosEmbarque = lazy(() => import("@/modules/admin/pages/AdminPontosEmbarque"));
export const AdminVerificacoes = lazy(() => import("@/core/verification/pages/AdminVerificationsPage"));
export const AdminZeladoria = lazy(() => import("@/modules/admin/pages/AdminZeladoria"));
export const AdminAnalyticsMobilidade = lazy(() => import("@/modules/admin/pages/AdminAnalyticsMobilidade"));
export const AdminRealtimeDashboard = lazy(() => import("@/modules/admin/pages/AdminRealtimeDashboard"));
export const AdminModeracaoCompleta = lazy(() => import("@/modules/admin/pages/AdminModeracaoCompleta"));
export const AdminModeracao = lazy(() => import("@/modules/admin/pages/AdminModeracao"));
export const AdminAlertas = lazy(() => import("@/modules/admin/pages/AdminAlertas"));
export const AdminAnalytics = lazy(() => import("@/modules/admin/pages/AdminAnalytics"));
export const AdminGamificacao = lazy(() => import("@/modules/admin/pages/AdminGamificacao"));
export const AdminCupons = lazy(() => import("@/modules/admin/pages/AdminCupons"));
export const AdminPromocoes = lazy(() => import("@/modules/admin/pages/AdminPromocoes"));
export const AdminAssinaturas = lazy(() => import("@/modules/admin/pages/AdminAssinaturas"));
export const AdminRoles = lazy(() => import("@/modules/admin/pages/AdminRoles"));
export const AdminPricing = lazy(() => import("@/modules/admin/pages/AdminPricing"));
export const AdminBranding = lazy(() => import("@/modules/admin/pages/AdminBranding"));
export const AdminMensagens = lazy(() => import("@/modules/admin/pages/AdminMensagens"));
export const AdminNotifications = lazy(() => import("@/modules/admin/pages/AdminNotifications"));
export const AdminCommunityAlerts = lazy(() => import("@/modules/admin/pages/AdminCommunityAlerts"));
export const AdminCommunityIssues = lazy(() => import("@/modules/admin/pages/AdminCommunityIssues"));
export const AdminIdentidade = lazy(() => import("@/modules/admin/pages/AdminIdentidade"));
export const AdminMapa = lazy(() => import("@/modules/admin/pages/AdminMapa"));
export const AdminConfiguracoes = lazy(() => import("@/modules/admin/pages/AdminConfiguracoes"));
export const AdminOperacoes = lazy(() => import("@/modules/admin/pages/AdminOperacoes"));
export const AdminMotoboyOperations = lazy(() => import("@/modules/admin/pages/AdminMotoboyOperations"));
export const AdminReivindicacoes = lazy(() => import("@/modules/admin/pages/AdminReivindicacoes"));
export const AdminSSOT = lazy(() => import("@/modules/admin/pages/AdminSSOT"));
export const AdminHighlights = lazy(() => import("@/modules/admin/pages/AdminHighlights"));
export const AdminTerritoryContent = lazy(() => import("@/modules/admin/pages/AdminTerritoryContent"));
export const AdminTerritorialGroups = lazy(() => import("@/modules/admin/pages/AdminTerritorialGroups"));
export const AdminCityMetadata = lazy(() => import("@/modules/admin/pages/AdminCityMetadata"));
export const AdminTerritoryManagement = lazy(() => import("@/modules/admin/pages/AdminTerritoryManagement"));
export const AdminGooglePlacesImport = lazy(() => import("@/modules/admin/pages/AdminGooglePlacesImport"));

// ============================================================
// 🏢 CENTRAL - Gestão e Operação
// ============================================================
export const CentralHubPage = lazy(() => import("@/modules/central/pages/CentralHubPage"));
export const CentralEmpresasPage = lazy(() => import("@/modules/central/pages/CentralEmpresasPage"));
export const CentralProfissionalPage = lazy(() => import("@/modules/central/pages/CentralProfissionalPage"));
export const CentralMotoristaPage = lazy(() => import("@/modules/central/pages/CentralMotoristaPage"));
export const CentralMotoboyPage = lazy(() => import("@/modules/central/pages/CentralMotoboyPage"));
// Sub-rotas de motorista
export const CentralMotoristaCadastroPage = lazy(() => import("@/modules/central/pages/motorista/CentralMotoristaCadastroPage"));
export const CentralMotoristaDisponibilidadePage = lazy(() => import("@/modules/central/pages/motorista/CentralMotoristaDisponibilidadePage"));
export const CentralMotoristaCorridasPage = lazy(() => import("@/modules/central/pages/motorista/CentralMotoristaCorridasPage"));
export const CentralMotoristaGanhosPage = lazy(() => import("@/modules/central/pages/motorista/CentralMotoristaGanhosPage"));
export const CentralMotoristaConfiguracoesPage = lazy(() => import("@/modules/central/pages/motorista/CentralMotoristaConfiguracoesPage"));
// Sub-rotas de motoboy
export const CentralMotoboyCadastroPage = lazy(() => import("@/modules/central/pages/motoboy/CentralMotoboyCadastroPage"));
export const CentralMotoboyDisponibilidadePage = lazy(() => import("@/modules/central/pages/motoboy/CentralMotoboyDisponibilidadePage"));
export const CentralMotoboyEntregasPage = lazy(() => import("@/modules/central/pages/motoboy/CentralMotoboyEntregasPage"));
export const CentralMotoboyGanhosPage = lazy(() => import("@/modules/central/pages/motoboy/CentralMotoboyGanhosPage"));
export const CentralMotoboyConfiguracoesPage = lazy(() => import("@/modules/central/pages/motoboy/CentralMotoboyConfiguracoesPage"));
// Layout e guards
export const CentralLayout = lazy(() =>
  import("@/modules/central/components/CentralLayout").then((m) => ({ default: m.CentralLayout }))
);
export const CentralAccessGuard = lazy(() => import("@/modules/central/guards/CentralAccessGuard").then(m => ({ default: m.CentralAccessGuard })));
export const BusinessAdminGuard = lazy(() => import("@/modules/central/guards/BusinessAdminGuard").then(m => ({ default: m.BusinessAdminGuard })));
export const ProfessionalGuard = lazy(() => import("@/modules/central/guards/ProfessionalGuard").then(m => ({ default: m.ProfessionalGuard })));
export const DriverGuard = lazy(() => import("@/modules/central/guards/DriverGuard").then(m => ({ default: m.DriverGuard })));
