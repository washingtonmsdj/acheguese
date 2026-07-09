/**
 * AppRoutes - Configuracao Centralizada de Rotas
 *
 * Este componente contem todas as rotas da aplicacao,
 * separado do App.tsx para melhor organizacao e manutencao.
 *
 * @version 1.0.0
 */

import type { ReactNode } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/config/launchScope";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityTerritoryRoutePath,
  buildTerritorialBareRoutePath,
  buildTerritorialModuleRoutePath,
  buildTerritorialRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import {
  GASTRONOMY_PUBLIC_ROUTE_PARAMS,
  gastronomyPublicRoutes,
} from "@/core/verticals/gastronomy/routes/gastronomyPublicRoutes";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { touristPointPublicRoutes } from "@/core/verticals/guide/routes/touristPointPublicRoutes";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { CommunityTerritoryRoutes } from "./CommunityTerritoryRoutes";
import {
  APP_LAYOUT_EVENT_TERRITORIAL_ROUTES,
  APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES,
  renderAppLayoutRouteDescriptors,
} from "./AppLayoutRouteRegistry";

// Lazy imports organizados por dominio
import * as P from "../lazyImports";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;
const LEGACY_DRIVER_CREATE_ROUTE = "/create-driver";
const EVENT_ROUTES = {
  home: buildAppModulePath(APP_MODULE_SLUGS.events),
  favorites: buildAppModulePath(APP_MODULE_SLUGS.events, TERRITORIAL_STATIC.favorites),
  calendar: buildAppModulePath(APP_MODULE_SLUGS.events, TERRITORIAL_STATIC.calendar),
  map: buildAppModulePath(APP_MODULE_SLUGS.events, TERRITORIAL_STATIC.map),
  detail: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    `${TERRITORIAL_STATIC.eventDetail}/${TERRITORIAL_PARAMS.eventId}`,
  ),
  legacyDetail: buildAppModulePath(APP_MODULE_SLUGS.events, TERRITORIAL_PARAMS.eventId),
} as const;
const JOB_ROUTES = {
  home: buildAppModulePath(APP_MODULE_SLUGS.jobs),
  publish: buildAppModulePath(APP_MODULE_SLUGS.jobs, TERRITORIAL_STATIC.publish),
} as const;

type DirectPausedRoute = {
  path: string;
  surface: LaunchSurfaceKey;
  moduleName: string;
};

function buildCommunityPausedRoutes(
  segments: readonly string[],
  surface: LaunchSurfaceKey,
  moduleName: string,
): DirectPausedRoute[] {
  return [
    {
      path: buildCommunityTerritoryRoutePath(segments),
      surface,
      moduleName,
    },
    {
      path: buildCommunityTerritoryRoutePath([
        TERRITORIAL_PARAMS.groupSlugOrDistrict,
        ...segments,
      ]),
      surface,
      moduleName,
    },
  ];
}

const DIRECT_PAUSED_ROUTES: DirectPausedRoute[] = [
  { path: EVENT_ROUTES.home, surface: "events", moduleName: "Eventos" },
  { path: EVENT_ROUTES.favorites, surface: "events", moduleName: "Eventos" },
  { path: EVENT_ROUTES.calendar, surface: "events", moduleName: "Eventos" },
  { path: EVENT_ROUTES.map, surface: "events", moduleName: "Eventos" },
  { path: EVENT_ROUTES.detail, surface: "events", moduleName: "Eventos" },
  { path: EVENT_ROUTES.legacyDetail, surface: "events", moduleName: "Eventos" },
  { path: JOB_ROUTES.home, surface: "jobs", moduleName: "Vagas" },
  { path: JOB_ROUTES.publish, surface: "jobs", moduleName: "Vagas" },
  { path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs), surface: "jobs", moduleName: "Vagas" },
  { path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs, [TERRITORIAL_PARAMS.slug]), surface: "jobs", moduleName: "Vagas" },
  { path: "/oportunidades", surface: "jobs", moduleName: "Oportunidades" },
  { path: "/oportunidades/:id", surface: "jobs", moduleName: "Oportunidades" },
  { path: "/educacao", surface: "education", moduleName: "Educacao" },
  { path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education), surface: "education", moduleName: "Educacao" },
  { path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [TERRITORIAL_PARAMS.district]), surface: "education", moduleName: "Educacao" },
  { path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [TERRITORIAL_PARAMS.district, TERRITORIAL_PARAMS.slug]), surface: "education", moduleName: "Educacao" },
  { path: "/comunicacao", surface: "communication", moduleName: "Comunicacao" },
  { path: "/comunicacao/solicitar", surface: "communication", moduleName: "Comunicacao" },
  { path: "/comunicacao/empresa/:channelSlug", surface: "communication", moduleName: "Comunicacao" },
  { path: "/comunicacao/agente/:channelSlug", surface: "communication", moduleName: "Comunicacao" },
  { path: buildTerritorialRoutePath(TERRITORIAL_STATIC.communication), surface: "communication", moduleName: "Comunicacao" },
  { path: buildTerritorialRoutePath(TERRITORIAL_STATIC.communication, [TERRITORIAL_PARAMS.channelSlug]), surface: "communication", moduleName: "Comunicacao" },
  { path: "/cupons", surface: "coupons", moduleName: "Cupons" },
  { path: "/cupons/:id", surface: "coupons", moduleName: "Cupons" },
  { path: "/analytics", surface: "publicAnalytics", moduleName: "Analytics" },
  { path: "/mobilidade", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/passageiro", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/buscando/:rideId", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/motorista", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/motoboy", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/motorista/perfil", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/historico", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/mobilidade/contatos-emergencia", surface: "mobility", moduleName: "Mobilidade" },
  { path: "/track/:token", surface: "mobility", moduleName: "Mobilidade" },
  { path: LEGACY_DRIVER_CREATE_ROUTE, surface: "mobility", moduleName: "Mobilidade" },
  { path: "/ranking", surface: "gamification", moduleName: "Ranking" },
  { path: "/gamificacao", surface: "gamification", moduleName: "Gamificacao" },
  { path: "/alertas", surface: "communityAlerts", moduleName: "Alertas" },
  { path: "/problemas", surface: "communityIssues", moduleName: "Problemas" },
  { path: "/achados-perdidos", surface: "communityLostFound", moduleName: "Achados e perdidos" },
  { path: "/achados-perdidos/novo", surface: "communityLostFound", moduleName: "Achados e perdidos" },
  { path: "/achados-perdidos/:id", surface: "communityLostFound", moduleName: "Achados e perdidos" },
  { path: "/mensagens", surface: "communityCommunication", moduleName: "Mensagens" },
  { path: "/chat/:conversationId", surface: "communityCommunication", moduleName: "Mensagens" },
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.events], "events", "Eventos"),
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.jobs], "jobs", "Vagas"),
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.education], "education", "Educacao"),
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.mobility], "mobility", "Mobilidade"),
  ...buildCommunityPausedRoutes([TERRITORIAL_STATIC.issues], "communityIssues", "Problemas"),
  ...buildCommunityPausedRoutes([TERRITORIAL_STATIC.lostAndFound], "communityLostFound", "Achados e perdidos"),
  ...buildCommunityPausedRoutes([TERRITORIAL_STATIC.communication], "communityCommunication", "Comunicacao"),
];

export function AppLayoutRoutes() {
  const aiVirtualTryOnEnabled = isFeatureEnabled('AI_VIRTUAL_TRYON');
  const launchElement = (
    surface: LaunchSurfaceKey,
    moduleName: string,
    element: ReactNode,
  ) => (isLaunchSurfaceEnabled(surface) ? element : <P.LaunchPausedPage moduleName={moduleName} />);
  const launchTerritorialLayout = (surface: LaunchSurfaceKey, moduleName: string) =>
    launchElement(surface, moduleName, <P.TerritorialLayout />);

  return (
    <Routes>
      {DIRECT_PAUSED_ROUTES.filter((route) => !isLaunchSurfaceEnabled(route.surface)).map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<P.LaunchPausedPage moduleName={route.moduleName} />}
        />
      ))}

      {/* QR Code Resolver - DEVE VIR ANTES DE OUTRAS ROTAS */}
      <Route path="/q/:token" element={<P.QrResolverPage />} />

      {/* Status Page - Pagina publica de status do sistema */}
      <Route path="/status" element={<P.StatusPage />} />

      {/* EVENTS - Sistema de Eventos */}
      <Route path={EVENT_ROUTES.home} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsListPage /></P.EventsErrorBoundary>)} />
      <Route path={EVENT_ROUTES.favorites} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsFavoritesPage /></P.EventsErrorBoundary>)} />
      <Route path={EVENT_ROUTES.calendar} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsCalendarPage /></P.EventsErrorBoundary>)} />
      <Route path={EVENT_ROUTES.map} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventsMapPage /></P.EventsErrorBoundary>)} />
      <Route path={EVENT_ROUTES.detail} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventDetailPage /></P.EventsErrorBoundary>)} />

      {/* Event Detail - Deve vir depois das rotas especificas */}
      <Route path={EVENT_ROUTES.legacyDetail} element={launchElement("events", "Eventos", <P.EventsErrorBoundary><P.EventDetailPage /></P.EventsErrorBoundary>)} />

      <Route path="/splash" element={<P.SplashPage />} />
      <Route path="/login" element={<P.LoginPage />} />
      <Route path="/cadastro" element={<P.CadastroPage />} />
      <Route path="/cadastro/confirmacao" element={<P.CadastroConfirmacaoPage />} />
      <Route
        path={LEGACY_DRIVER_CREATE_ROUTE}
        element={launchElement("mobility", "Mobilidade", <Navigate to="/central/motorista/cadastro" replace />)}
      />
      <Route path="/sobre" element={<P.AboutPage />} />
      <Route path="/contato" element={<P.ContactPage />} />
      <Route path="/onboarding" element={<P.OnboardingPage />} />
      <Route path="/reset-password" element={<P.ResetPasswordPage />} />
      <Route path="/empresas/:id/catalogo" element={<P.EmpresaCatalogoPublicoPage />} />
      <Route path="/p/:slug/*" element={<P.PremiumBusinessSiteRoute />}>
        <Route index element={<P.PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<P.PremiumBusinessMenuPage />} />
        <Route path="produto/:productSlug" element={<P.PremiumBusinessProductPage />} />
        <Route path="carrinho" element={<P.PremiumBusinessCartPage />} />
        <Route path="checkout" element={<P.PremiumBusinessCheckoutPage />} />
      </Route>

      <Route element={<P.AppLayoutSidebar />}>
        {/* Pagina inicial */}
        <Route path="/" element={<P.MainLandingPage />} />

        {/* Rotas de Billing e Assinaturas */}
        <Route path="/planos" element={<P.PricingPage />} />
        <Route path="/checkout/success" element={<P.CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<P.CheckoutCancelPage />} />
        <Route path="/settings/subscription" element={<P.SubscriptionManagementPage />} />

        {/* Rotas de Notificacoes */}
        <Route path="/notifications" element={<P.NotificationsPage />} />
        <Route path="/notificacoes" element={<P.NotificationsPage />} />
        <Route path="/settings/notifications" element={<P.NotificationPreferencesPage />} />
        <Route path="/settings/email-logs" element={<P.EmailLogsPage />} />

        {/* Rotas publicas de landing pages */}
        <Route path="/empresas-landing" element={<P.EmpresasLandingPage />} />
        <Route path="/servicos-landing" element={<P.ServicosLandingPage />} />
        {/* Rotas globais */}
        <Route path="/u/:username" element={<P.ProfilePublicRoute />} />
        <Route path="/c/:publicId" element={<P.ClassifiedShortRoute />} />
        <Route path={JOB_ROUTES.publish} element={launchElement("jobs", "Vagas", <P.PublicarVagaPage />)} />
        <Route path="/oportunidades" element={launchElement("jobs", "Oportunidades", <P.WorkOpportunitiesPage />)} />
        <Route path="/oportunidades/:id" element={launchElement("jobs", "Oportunidades", <P.WorkOpportunityDetailPage />)} />
        <Route path="/servicos/cadastrar" element={<P.CadastrarServicoPage />} />
        <Route path="/servicos/:id/editar" element={<P.EditarServicoPage />} />
        <Route path="/servicos/orcamentos/:leadId" element={<P.ProfessionalLeadTrackingPage />} />
        <Route path="/classificados/novo" element={<P.NovoClassificadoPage />} />
        <Route path="/classificados/editar/:id" element={<P.EditarClassificadoPage />} />
        <Route path="/classificados/vendedor/:sellerId" element={<P.VendedorPerfilPage />} />

        <Route path="/cupons" element={launchElement("coupons", "Cupons", <P.CuponsPage />)} />
        <Route path="/cupons/:id" element={launchElement("coupons", "Cupons", <P.CupomDetailPage />)} />
        <Route path="/conta/preferencias" element={<P.ContaPreferenciasPage />} />
        <Route path="/conta/notificacoes" element={<P.NotificationPreferencesPage />} />
        <Route path="/conta/privacidade" element={<P.PrivacySettingsPage />} />
        <Route path="/conta/perfil/configuracoes" element={<P.ProfileSettingsPage />} />
        <Route path="/conta/seguranca" element={<P.ContaSegurancaPage />} />
        <Route path="/conta/enderecos" element={<P.ContaEnderecosPage />} />
        <Route path="/conta/profissional" element={<Navigate to="/central" replace />} />
        <Route path="/conta/editar" element={<P.ContaEditarPage />} />
        <Route path="/conta/editar/:profileId" element={<P.ContaEditarPerfilPage />} />
        <Route path="/conta" element={<P.ContaPage />} />
        <Route path="/gamificacao" element={launchElement("gamification", "Gamificação", <P.GamificacaoPage />)} />
        <Route path="/empresas" element={<P.EmpresasLandingPage />} />
        <Route path="/empresas/cadastrar" element={<P.EmpresasCadastroLandingPage />} />
        <Route path="/edit-business/:profileId" element={<P.EditarEmpresaPage />} />

        <Route path="/mensagens" element={launchElement("communityCommunication", "Mensagens", <P.MensagensPage />)} />
        <Route path="/chat/:conversationId" element={launchElement("communityCommunication", "Mensagens", <P.ChatPage />)} />
        <Route path="/mapa" element={<P.MapaPage />} />
        <Route path="/perto-de-mim" element={<P.NearbyPage />} />
        <Route path="/analytics" element={launchElement("publicAnalytics", "Analytics", <P.GeneralAnalyticsPage />)} />
        <Route path="/alertas" element={launchElement("communityAlerts", "Alertas", <P.TerritorialCommunityPage />)} />
        <Route path="/problemas" element={launchElement("communityIssues", "Problemas", <P.TerritorialCommunityIssuesPage />)} />
        <Route path="/recomendacoes" element={<P.RecomendacoesPage />} />
        <Route path="/recomendacoes/nova" element={<P.NovaRecomendacaoPage />} />
        <Route path="/recomendacoes/:id" element={<P.RecomendacaoDetailPage />} />
        <Route path="/achados-perdidos" element={launchElement("communityLostFound", "Achados e perdidos", <P.AchadosPerdidosPage />)} />
        <Route path="/achados-perdidos/novo" element={launchElement("communityLostFound", "Achados e perdidos", <P.NovoAchadoPerdidoPage />)} />
        <Route path="/achados-perdidos/:id" element={launchElement("communityLostFound", "Achados e perdidos", <P.AchadoPerdidoDetailPage />)} />
        <Route path="/ranking" element={launchElement("gamification", "Ranking", <P.RankingPage />)} />
        <Route path="/track/:token" element={launchElement("mobility", "Mobilidade", <P.TrackRidePage />)} />
        <Route path="/novo-post" element={<P.NovoPostPage />} />
        <Route path="/busca" element={<P.BuscaPage />} />
        <Route path="/buscar" element={<P.BuscarPage />} />
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.search)} element={<P.BuscarPage />} />
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.search, [TERRITORIAL_PARAMS.district])} element={<P.BuscarPage />} />
        <Route path={buildTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias)} element={<P.BuscarPage />} />
        <Route path={buildTerritorialRoutePath(TERRITORIAL_STATIC.searchAlias, [TERRITORIAL_PARAMS.district])} element={<P.BuscarPage />} />
        {aiVirtualTryOnEnabled && (
          <Route path="/ai/virtual-try-on" element={<P.VirtualTryOnPage />} />
        )}
        <Route path="/regras" element={<P.RegrasPage />} />
        <Route path="/termos" element={<P.TermosPage />} />
        <Route path="/privacidade" element={<P.PrivacidadePage />} />
        <Route path="/offline-settings" element={<P.OfflineSettingsPage />} />

        {/* LGPD / Privacidade */}
        <Route path="/dpo" element={<P.DPOContactPage />} />
        {/* Rotas globais sem territorio */}
        <Route path="/educacao" element={launchElement("education", "Educação", <P.EducationExplorerPage />)} />
        <Route path="/comunicacao" element={launchElement("communication", "Comunicação", <P.CommunicationLandingPage />)} />
        <Route path="/comunicacao/solicitar" element={launchElement("communication", "Comunicação", <P.CommunicationRequestPage />)} />
        <Route path="/servicos" element={<P.ServicosLandingPage />} />
        <Route path="/classificados" element={<P.ClassificadosPage />} />
        <Route path="/mobilidade/passageiro" element={launchElement("mobility", "Mobilidade", <P.PassageiroPage />)} />
        <Route path="/mobilidade/buscando/:rideId" element={launchElement("mobility", "Mobilidade", <P.BuscandoMotoristaPage />)} />
        <Route path="/mobilidade/motorista" element={launchElement("mobility", "Mobilidade", <P.MotoristaPage />)} />
        <Route path="/mobilidade/motoboy" element={launchElement("mobility", "Mobilidade", <P.MotoboyPage />)} />
        <Route path="/mobilidade/motorista/perfil" element={launchElement("mobility", "Mobilidade", <P.DriverProfilePage />)} />
        <Route path="/mobilidade/historico" element={launchElement("mobility", "Mobilidade", <P.HistoricoPage />)} />
        <Route path="/mobilidade/contatos-emergencia" element={launchElement("mobility", "Mobilidade", <P.EmergencyContactsPage />)} />
        <Route path="/mobilidade" element={launchElement("mobility", "Mobilidade", <P.MobilidadePage />)} />

        {/* Rotas canonicas especificas - DEVEM VIR ANTES DAS TERRITORIAIS GENERICAS */}

        {/* Rota publica de profissional: /servicos/:state/:city/profissional/:slug */}
        <Route path={professionalPublicRoutes.detailRoutePath()} element={<P.ProfissionalPublicPage />} />

        {/* Comunicacao Territorial - rotas especificas antes das territoriais genericas */}
        <Route path={buildTerritorialRoutePath(TERRITORIAL_STATIC.communication, [TERRITORIAL_PARAMS.channelSlug])} element={launchElement("communication", "Comunicação", <P.CommunicationChannelPage />)} />
        <Route path="/comunicacao/empresa/:channelSlug" element={launchElement("communication", "Comunicação", <P.CommunicationCompanyDetailsPage />)} />
        <Route path="/comunicacao/agente/:channelSlug" element={launchElement("communication", "Comunicação", <P.CommunicationAgentPage />)} />
        <Route path={buildTerritorialRoutePath(TERRITORIAL_STATIC.communication)} element={launchElement("communication", "Comunicação", <P.CommunicationCityPage />)} />

        {/* Modulo Pontos Turisticos - vertical tourism */}

        {/* Detalhe com territorio (4 segmentos): /pontos-turisticos/:state/:city/:district/:slug */}
        <Route path={touristPointPublicRoutes.detailWithTerritoryRoutePath()} element={<P.TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointDetailPage />} />
        </Route>

        {/* Rota territorial de 3 segmentos: listagem de distrito/grupo ou detalhe sem distrito */}
        <Route path={touristPointPublicRoutes.districtOrDetailRoutePath()} element={<P.TerritorialLayout />}>
          <Route index element={<P.TouristPointRouteResolver />} />
        </Route>

        {/* Listagem cidade (2 segmentos): /pontos-turisticos/:state/:city */}
        <Route path={touristPointPublicRoutes.cityRoutePath()} element={<P.TerritorialLayout />}>
          <Route index element={<P.GuideTouristPointsPage />} />
        </Route>

        {/* Rotas de comunidade e aliases curtos - antes das territoriais genericas */}
        {CommunityTerritoryRoutes()}

        {/* Rotas territoriais genericas - DEVEM VIR DEPOIS DAS ESPECIFICAS */}

        {/* Landing territorial generico */}
        <Route path={buildTerritorialBareRoutePath([TERRITORIAL_PARAMS.district])} element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialIndexPage CityLandingComponent={P.CidadeLandingPage} />} />
        </Route>
        <Route path={buildTerritorialBareRoutePath()} element={<P.TerritorialLayout />}>
          <Route index element={<P.TerritorialIndexPage CityLandingComponent={P.CidadeLandingPage} />} />
        </Route>

        {/* Landing de estado - lista cidades ativas */}
        <Route path="/:state" element={<P.StateLandingPage />} />

        {/* Landing de pais - lista estados ativos */}
        <Route path="/brasil" element={<P.BrasilShowcasePage />} />
        <Route path="/br" element={<P.CountryLandingPage />} />

        {renderAppLayoutRouteDescriptors(APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES)}

        {/* Rotas de gastronomia */}
        <Route path={gastronomyPublicRoutes.home()} element={<P.GastronomyLandingPage />} />
        {/* Rotas publicas estaticas precisam vir antes das territoriais dinamicas. */}
        <Route path={gastronomyPublicRoutes.favorites()} element={<P.MyFavoritesPage />} />
        <Route path={gastronomyPublicRoutes.orderDetails(GASTRONOMY_PUBLIC_ROUTE_PARAMS.orderId)} element={<P.OrderDetailsPage />} />

        {/* Detalhe premium: /gastronomia-premium/:uf/:cidade/:bairro/:slug */}
        <Route path={buildTerritorialRoutePath(TERRITORIAL_STATIC.gastronomyPremium, [TERRITORIAL_PARAMS.district, TERRITORIAL_PARAMS.slug])} element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyPremiumDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>

        {/* Alias legado de detalhe; redireciona para URL publica da empresa */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.gastronomy, [TERRITORIAL_PARAMS.district, TERRITORIAL_PARAMS.slug])} element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyDetailPage />} />
          <Route path="checkout" element={<P.GastronomyCheckoutPage />} />
        </Route>

        {/* Listagem bairro: /gastronomia/:uf/:cidade/:bairro */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.gastronomy, [TERRITORIAL_PARAMS.district])} element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>

        {/* Listagem cidade: /gastronomia/:uf/:cidade */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.gastronomy)} element={<P.TerritorialLayout />}>
          <Route index element={<P.GastronomyLandingPage />} />
        </Route>

        {/* Rotas de Education - publicas territoriais (vitrine premium consolidada) */}
        {/* Detalhe: /educacao/:uf/:cidade/:bairro/:slug */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [TERRITORIAL_PARAMS.district, TERRITORIAL_PARAMS.slug])} element={launchTerritorialLayout("education", "Educação")}>
          <Route index element={<P.EducationDetailPage />} />
        </Route>

        {/* Listagem bairro: /educacao/:uf/:cidade/:bairro */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [TERRITORIAL_PARAMS.district])} element={launchTerritorialLayout("education", "Educação")}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Listagem cidade: /educacao/:uf/:cidade */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education)} element={launchTerritorialLayout("education", "Educação")}>
          <Route index element={<P.EducationExplorerPage />} />
        </Route>

        {/* Rotas de vagas */}

        <Route path={JOB_ROUTES.home} element={launchElement("jobs", "Vagas", <P.VagasPublicPage />)} />
        {/* Detalhe canonico: /vagas/:uf/:cidade/:slug */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs, [TERRITORIAL_PARAMS.slug])} element={launchElement("jobs", "Vagas", <P.VagaDetailPublicPage />)} />

        {/* Listagem territorial: /vagas/:uf/:cidade/:bairro */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs, [TERRITORIAL_PARAMS.district])} element={launchTerritorialLayout("jobs", "Vagas")}>
          <Route index element={<P.TerritorialVagasPage />} />
        </Route>

        {/* Listagem territorial cidade: /vagas/:uf/:cidade */}
        <Route path={buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs)} element={launchTerritorialLayout("jobs", "Vagas")}>
          <Route index element={<P.TerritorialVagasPage />} />
        </Route>
      </Route>

      <Route path="*" element={<P.NotFound />} />
    </Routes>
  );
}
