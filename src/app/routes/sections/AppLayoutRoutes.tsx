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
import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { AppLayoutSidebar } from "@/app/components/AppLayoutSidebar";
import TerritoryHomePage from "@/app/pages/TerritoryHomePage";
import { TerritorialIndexPage } from "@/core/routing/components/TerritorialIndexPage";
import { TerritorialLayout } from "@/core/routing/components/TerritorialLayout";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import { LAUNCH_CITY_PATH } from "@/config/territory";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
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
import { ProtectedRoute } from "@/core/routing/components/ProtectedRoute";
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
  favorites: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_STATIC.favorites,
  ),
  calendar: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_STATIC.calendar,
  ),
  map: buildAppModulePath(APP_MODULE_SLUGS.events, TERRITORIAL_STATIC.map),
  detail: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    `${TERRITORIAL_STATIC.eventDetail}/${TERRITORIAL_PARAMS.eventId}`,
  ),
  legacyDetail: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_PARAMS.eventId,
  ),
} as const;
const JOB_ROUTES = {
  home: buildAppModulePath(APP_MODULE_SLUGS.jobs),
  publish: buildAppModulePath(
    APP_MODULE_SLUGS.jobs,
    TERRITORIAL_STATIC.publish,
  ),
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
  {
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs),
    surface: "jobs",
    moduleName: "Vagas",
  },
  {
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.jobs, [
      TERRITORIAL_PARAMS.slug,
    ]),
    surface: "jobs",
    moduleName: "Vagas",
  },
  { path: "/oportunidades", surface: "jobs", moduleName: "Oportunidades" },
  { path: "/oportunidades/:id", surface: "jobs", moduleName: "Oportunidades" },
  { path: "/educacao", surface: "education", moduleName: "Educacao" },
  {
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education),
    surface: "education",
    moduleName: "Educacao",
  },
  {
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [
      TERRITORIAL_PARAMS.district,
    ]),
    surface: "education",
    moduleName: "Educacao",
  },
  {
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.education, [
      TERRITORIAL_PARAMS.district,
      TERRITORIAL_PARAMS.slug,
    ]),
    surface: "education",
    moduleName: "Educacao",
  },
  { path: "/comunicacao", surface: "communication", moduleName: "Comunicacao" },
  {
    path: "/comunicacao/solicitar",
    surface: "communication",
    moduleName: "Comunicacao",
  },
  {
    path: "/comunicacao/empresa/:channelSlug",
    surface: "communication",
    moduleName: "Comunicacao",
  },
  {
    path: "/comunicacao/agente/:channelSlug",
    surface: "communication",
    moduleName: "Comunicacao",
  },
  {
    path: buildTerritorialRoutePath(TERRITORIAL_STATIC.communication),
    surface: "communication",
    moduleName: "Comunicacao",
  },
  {
    path: buildTerritorialRoutePath(TERRITORIAL_STATIC.communication, [
      TERRITORIAL_PARAMS.channelSlug,
    ]),
    surface: "communication",
    moduleName: "Comunicacao",
  },
  { path: "/cupons", surface: "coupons", moduleName: "Cupons" },
  { path: "/cupons/:id", surface: "coupons", moduleName: "Cupons" },
  { path: "/analytics", surface: "publicAnalytics", moduleName: "Analytics" },
  { path: "/mobilidade", surface: "mobility", moduleName: "Mobilidade" },
  {
    path: "/mobilidade/passageiro",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/buscando/:rideId",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/motorista",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/motoboy",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/motorista/perfil",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/historico",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  {
    path: "/mobilidade/contatos-emergencia",
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  { path: "/track/:token", surface: "mobility", moduleName: "Mobilidade" },
  {
    path: LEGACY_DRIVER_CREATE_ROUTE,
    surface: "mobility",
    moduleName: "Mobilidade",
  },
  { path: "/ranking", surface: "gamification", moduleName: "Ranking" },
  { path: "/gamificacao", surface: "gamification", moduleName: "Gamificacao" },
  { path: "/alertas", surface: "communityAlerts", moduleName: "Alertas" },
  { path: "/problemas", surface: "communityIssues", moduleName: "Problemas" },
  {
    path: "/achados-perdidos",
    surface: "communityLostFound",
    moduleName: "Achados e perdidos",
  },
  {
    path: "/achados-perdidos/novo",
    surface: "communityLostFound",
    moduleName: "Achados e perdidos",
  },
  {
    path: "/achados-perdidos/:id",
    surface: "communityLostFound",
    moduleName: "Achados e perdidos",
  },
  {
    path: "/mensagens",
    surface: "communityCommunication",
    moduleName: "Mensagens",
  },
  {
    path: "/chat/:conversationId",
    surface: "communityCommunication",
    moduleName: "Mensagens",
  },
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.events], "events", "Eventos"),
  ...buildCommunityPausedRoutes([APP_MODULE_SLUGS.jobs], "jobs", "Vagas"),
  ...buildCommunityPausedRoutes(
    [APP_MODULE_SLUGS.education],
    "education",
    "Educacao",
  ),
  ...buildCommunityPausedRoutes(
    [APP_MODULE_SLUGS.mobility],
    "mobility",
    "Mobilidade",
  ),
  ...buildCommunityPausedRoutes(
    [TERRITORIAL_STATIC.issues],
    "communityIssues",
    "Problemas",
  ),
  ...buildCommunityPausedRoutes(
    [TERRITORIAL_STATIC.lostAndFound],
    "communityLostFound",
    "Achados e perdidos",
  ),
  ...buildCommunityPausedRoutes(
    [TERRITORIAL_STATIC.communication],
    "communityCommunication",
    "Comunicacao",
  ),
];

export function AppLayoutRoutes() {
  const aiVirtualTryOnEnabled = isFeatureEnabled("AI_VIRTUAL_TRYON");
  const launchElement = (
    surface: LaunchSurfaceKey,
    moduleName: string,
    element: ReactNode,
  ) =>
    isLaunchSurfaceEnabled(surface) ? (
      element
    ) : (
      <P.LaunchPausedPage moduleName={moduleName} />
    );
  const launchTerritorialLayout = (
    surface: LaunchSurfaceKey,
    moduleName: string,
  ) => launchElement(surface, moduleName, <TerritorialLayout />);
  const protectedElement = (element: ReactNode) => (
    <ProtectedRoute>{element}</ProtectedRoute>
  );

  return (
    <Routes>
      {DIRECT_PAUSED_ROUTES.filter(
        (route) => !isLaunchSurfaceEnabled(route.surface),
      ).map((route) => (
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
      <Route
        path={EVENT_ROUTES.home}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventsListPage />
          </P.EventsErrorBoundary>,
        )}
      />
      <Route
        path={EVENT_ROUTES.favorites}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventsFavoritesPage />
          </P.EventsErrorBoundary>,
        )}
      />
      <Route
        path={EVENT_ROUTES.calendar}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventsCalendarPage />
          </P.EventsErrorBoundary>,
        )}
      />
      <Route
        path={EVENT_ROUTES.map}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventsMapPage />
          </P.EventsErrorBoundary>,
        )}
      />
      <Route
        path={EVENT_ROUTES.detail}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventDetailPage />
          </P.EventsErrorBoundary>,
        )}
      />

      {/* Event Detail - Deve vir depois das rotas especificas */}
      <Route
        path={EVENT_ROUTES.legacyDetail}
        element={launchElement(
          "events",
          "Eventos",
          <P.EventsErrorBoundary>
            <P.EventDetailPage />
          </P.EventsErrorBoundary>,
        )}
      />

      <Route path="/splash" element={<P.SplashPage />} />
      <Route path="/login" element={<P.LoginPage />} />
      <Route path="/cadastro" element={<P.CadastroPage />} />
      <Route
        path="/cadastro/confirmacao"
        element={<P.CadastroConfirmacaoPage />}
      />
      <Route
        path={LEGACY_DRIVER_CREATE_ROUTE}
        element={launchElement(
          "mobility",
          "Mobilidade",
          <Navigate to="/central/motorista/cadastro" replace />,
        )}
      />
      <Route path="/sobre" element={<P.AboutPage />} />
      <Route path="/contato" element={<P.ContactPage />} />
      <Route path="/onboarding" element={<P.OnboardingPage />} />
      <Route path="/reset-password" element={<P.ResetPasswordPage />} />
      <Route
        path="/empresas/:id/catalogo"
        element={<P.EmpresaCatalogoPublicoPage />}
      />
      <Route path="/p/:slug/*" element={<P.PremiumBusinessSiteRoute />}>
        <Route index element={<P.PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<P.PremiumBusinessMenuPage />} />
        <Route
          path="produto/:productSlug"
          element={<P.PremiumBusinessProductPage />}
        />
        <Route path="carrinho" element={<P.PremiumBusinessCartPage />} />
        <Route path="checkout" element={<P.PremiumBusinessCheckoutPage />} />
      </Route>

      <Route element={<AppLayoutSidebar />}>
        {/* Pagina inicial */}
        {/*
         * Opcao B: Home canonica em /:uf/:cidade da cidade de lancamento.
         * "/" redireciona para a landing da cidade ativa (hoje: /ba/salvador),
         * evitando conteudo duplicado e retrabalho quando novas cidades entrarem.
         */}
        <Route path="/" element={<RootRouteEntry />} />
        <Route path="/inicio" element={<P.NationalHubPage />} />

        {/* Rotas de Billing e Assinaturas */}
        <Route path="/planos" element={protectedElement(<P.PricingPage />)} />
        <Route
          path="/checkout/success"
          element={protectedElement(<P.CheckoutSuccessPage />)}
        />
        <Route path="/checkout/cancel" element={<P.CheckoutCancelPage />} />
        <Route
          path="/settings/subscription"
          element={protectedElement(<P.SubscriptionManagementPage />)}
        />

        {/* Rotas de Notificacoes */}
        <Route
          path="/notifications"
          element={protectedElement(<P.NotificationsPage />)}
        />
        <Route
          path="/notificacoes"
          element={protectedElement(<P.NotificationsPage />)}
        />
        <Route
          path="/settings/notifications"
          element={protectedElement(<P.NotificationPreferencesPage />)}
        />
        <Route
          path="/settings/email-logs"
          element={protectedElement(<P.EmailLogsPage />)}
        />

        {/* Rotas publicas de landing pages */}
        <Route path="/empresas-landing" element={<P.EmpresasLandingPage />} />
        <Route path="/servicos-landing" element={<P.ServicosLandingPage />} />
        {/* Rotas globais */}
        <Route path="/u/:username" element={<P.ProfilePublicRoute />} />
        <Route path="/c/:publicId" element={<P.ClassifiedShortRoute />} />
        <Route
          path={JOB_ROUTES.publish}
          element={launchElement("jobs", "Vagas", <P.PublicarVagaPage />)}
        />
        <Route
          path="/oportunidades"
          element={launchElement(
            "jobs",
            "Oportunidades",
            <P.WorkOpportunitiesPage />,
          )}
        />
        <Route
          path="/oportunidades/:id"
          element={launchEleme×]ú¶‰žËkºwµçUµ•¹Ðõìñ9…Ù¥…Ñ”Ñ¼ôˆ½½¹Ñ„½Á•É™¥°½½¹™¥ÕÉ…½•ÌˆÉ•Á±…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½Á•É™¥°¼¨ˆ•±•µ•¹Ðõìñ9…Ù¥…Ñ”Ñ¼ôˆ½½¹Ñ„ˆÉ•Á±…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…µ¥™¥……¼ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰…µ¥™¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰…µ¥™¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹…µ¥™¥……½A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½•µÁÉ•Í…Ìˆ•±•µ•¹Ðõìñ@¹µÁÉ•Í…Í1…¹‘¥¹A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½•µÁÉ•Í…Ì½…‘…ÍÑÉ…Èˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð ñ@¹µÁÉ•Í…Í…‘…ÍÑÉ½1…¹‘¥¹A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½•‘¥Ðµ‰ÕÍ¥¹•ÍÌ¼éÁÉ½™¥±•%ˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð ñ@¹‘¥Ñ…ÉµÁÉ•Í…A…”€¼ø¥ô(€€€€€€€€¼ø((€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ•¹Í…•¹Ìˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð (€€€€€€€€€€€±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€€€‰½µµÕ¹¥Ñå½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€€€‰5•¹Í…•¹Ìˆ°(€€€€€€€€€€€€€€ñ@¹5•¹Í…•¹ÍA…”€¼ø°(€€€€€€€€€€€€¤°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½¡…Ð¼é½¹Ù•ÉÍ…Ñ¥½¹%ˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð (€€€€€€€€€€€±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€€€‰½µµÕ¹¥Ñå½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€€€‰5•¹Í…•¹Ìˆ°(€€€€€€€€€€€€€€ñ@¹¡…ÑA…”€¼ø°(€€€€€€€€€€€€¤°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½µ…Á„ˆ•±•µ•¹Ðõìñ@¹5…Á…A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½Á•ÉÑ¼µ‘”µµ¥´ˆ•±•µ•¹Ðõìñ@¹9•…É‰åA…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…¹…±åÑ¥Ìˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰ÁÕ‰±¥¹…±åÑ¥Ìˆ°(€€€€€€€€€€€€‰¹…±åÑ¥Ìˆ°(€€€€€€€€€€€€ñ@¹•¹•É…±¹…±åÑ¥ÍA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…±•ÉÑ…Ìˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥Ñå±•ÉÑÌˆ°(€€€€€€€€€€€€‰±•ÉÑ…Ìˆ°(€€€€€€€€€€€€ñ@¹Q•ÉÉ¥Ñ½É¥…±½µµÕ¹¥ÑåA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½ÁÉ½‰±•µ…Ìˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥Ñå%ÍÍÕ•Ìˆ°(€€€€€€€€€€€€‰AÉ½‰±•µ…Ìˆ°(€€€€€€€€€€€€ñ@¹Q•ÉÉ¥Ñ½É¥…±½µµÕ¹¥Ñå%ÍÍÕ•ÍA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½É•½µ•¹‘…½•Ìˆ•±•µ•¹Ðõìñ@¹I•½µ•¹‘…½•ÍA…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½É•½µ•¹‘…½•Ì½¹½Ù„ˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð ñ@¹9½Ù…I•½µ•¹‘……½A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½É•½µ•¹‘…½•Ì¼é¥ˆ(€€€€€€€€€•±•µ•¹Ðõìñ@¹I•½µ•¹‘……½•Ñ…¥±A…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…¡…‘½ÌµÁ•É‘¥‘½Ìˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥Ñå1½ÍÑ½Õ¹ˆ°(€€€€€€€€€€€€‰¡…‘½Ì”Á•É‘¥‘½Ìˆ°(€€€€€€€€€€€€ñ@¹¡…‘½ÍA•É‘¥‘½ÍA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…¡…‘½ÌµÁ•É‘¥‘½Ì½¹½Ù¼ˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð (€€€€€€€€€€€±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€€€‰½µµÕ¹¥Ñå1½ÍÑ½Õ¹ˆ°(€€€€€€€€€€€€€€‰¡…‘½Ì”Á•É‘¥‘½Ìˆ°(€€€€€€€€€€€€€€ñ@¹9½Ù½¡…‘½A•É‘¥‘½A…”€¼ø°(€€€€€€€€€€€€¤°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½…¡…‘½ÌµÁ•É‘¥‘½Ì¼é¥ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥Ñå1½ÍÑ½Õ¹ˆ°(€€€€€€€€€€€€‰¡…‘½Ì”Á•É‘¥‘½Ìˆ°(€€€€€€€€€€€€ñ@¹¡…‘½A•É‘¥‘½•Ñ…¥±A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½É…¹­¥¹œˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰…µ¥™¥…Ñ¥½¸ˆ°€‰I…¹­¥¹œˆ°€ñ@¹I…¹­¥¹A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½ÑÉ…¬¼éÑ½­•¸ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰µ½‰¥±¥Ñäˆ°€‰5½‰¥±¥‘…‘”ˆ°€ñ@¹QÉ…­I¥‘•A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½¹½Ù¼µÁ½ÍÐˆ(€€€€€€€€€•±•µ•¹ÐõíÁÉ½Ñ•Ñ•‘±•µ•¹Ð ñ@¹9½Ù½A½ÍÑA…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½‰ÕÍ„ˆ•±•µ•¹Ðõìñ@¹	ÕÍ…A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½‰ÕÍ…Èˆ•±•µ•¹Ðõìñ@¹	ÕÍ…ÉA…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹Í•…É ¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹	ÕÍ…A…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹Í•…É °l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹	ÕÍ…A…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±I½ÕÑ•A…Ñ ¡QII%Q=I%1}MQQ%¹Í•…É¡±¥…Ì¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹	ÕÍ…ÉA…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±I½ÕÑ•A…Ñ ¡QII%Q=I%1}MQQ%¹Í•…É¡±¥…Ì°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹	ÕÍ…ÉA…”€¼ùô(€€€€€€€€¼ø(€€€€€€€í…¥Y¥ÉÑÕ…±QÉå=¹¹…‰±•€˜˜€ (€€€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½…¤½Ù¥ÉÑÕ…°µÑÉäµ½¸ˆ•±•µ•¹Ðõìñ@¹Y¥ÉÑÕ…±QÉå=¹A…”€¼ùô€¼ø(€€€€€€€€¥ô(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½Ñ•Éµ½Ìˆ•±•µ•¹Ðõìñ@¹Q•Éµ½ÍA…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½ÁÉ¥Ù…¥‘…‘”ˆ•±•µ•¹Ðõìñ@¹AÉ¥Ù…¥‘…‘•A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½½™™±¥¹”µÍ•ÑÑ¥¹Ìˆ•±•µ•¹Ðõìñ@¹=™™±¥¹•M•ÑÑ¥¹ÍA…”€¼ùô€¼ø((€€€€€€€ì¼¨1A€¼AÉ¥Ù…¥‘…‘”€¨½ô(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½‘Á¼ˆ•±•µ•¹Ðõìñ@¹A=½¹Ñ…ÑA…”€¼ùô€¼ø(€€€€€€€ì¼¨I½Ñ…Ì±½‰…¥ÌÍ•´Ñ•ÉÉ¥Ñ½É¥¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½•‘Õ……¼ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰•‘Õ…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰‘Õ‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹‘Õ…Ñ¥½¹áÁ±½É•ÉA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½½µÕ¹¥……¼ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹1…¹‘¥¹A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½½µÕ¹¥……¼½Í½±¥¥Ñ…Èˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹I•ÅÕ•ÍÑA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½Í•ÉÙ¥½Ìˆ•±•µ•¹Ðõìñ@¹M•ÉÙ¥½Í1…¹‘¥¹A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½±…ÍÍ¥™¥…‘½Ìˆ•±•µ•¹Ðõìñ@¹±…ÍÍ¥™¥…‘½ÍA…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½Á…ÍÍ…•¥É¼ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰µ½‰¥±¥Ñäˆ°(€€€€€€€€€€€€‰5½‰¥±¥‘…‘”ˆ°(€€€€€€€€€€€€ñ@¹A…ÍÍ…•¥É½A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½‰ÕÍ…¹‘¼¼éÉ¥‘•%ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰µ½‰¥±¥Ñäˆ°(€€€€€€€€€€€€‰5½‰¥±¥‘…‘”ˆ°(€€€€€€€€€€€€ñ@¹	ÕÍ…¹‘½5½Ñ½É¥ÍÑ…A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½µ½Ñ½É¥ÍÑ„ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰µ½‰¥±¥Ñäˆ°€‰5½‰¥±¥‘…‘”ˆ°€ñ@¹5½Ñ½É¥ÍÑ…A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½µ½Ñ½‰½äˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰µ½‰¥±¥Ñäˆ°€‰5½‰¥±¥‘…‘”ˆ°€ñ@¹5½Ñ½‰½åA…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½µ½Ñ½É¥ÍÑ„½Á•É™¥°ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰µ½‰¥±¥Ñäˆ°(€€€€€€€€€€€€‰5½‰¥±¥‘…‘”ˆ°(€€€€€€€€€€€€ñ@¹É¥Ù•ÉAÉ½™¥±•A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½¡¥ÍÑ½É¥¼ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰µ½‰¥±¥Ñäˆ°€‰5½‰¥±¥‘…‘”ˆ°€ñ@¹!¥ÍÑ½É¥½A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”½½¹Ñ…Ñ½Ìµ•µ•É•¹¥„ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰µ½‰¥±¥Ñäˆ°(€€€€€€€€€€€€‰5½‰¥±¥‘…‘”ˆ°(€€€€€€€€€€€€ñ@¹µ•É•¹å½¹Ñ…ÑÍA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½µ½‰¥±¥‘…‘”ˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰µ½‰¥±¥Ñäˆ°(€€€€€€€€€€€€‰5½‰¥±¥‘…‘”ˆ°(€€€€€€€€€€€€ñ@¹5½‰¥±¥‘…‘•A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø((€€€€€€€ì¼¨I½Ñ…Ì…¹½¹¥…Ì•ÍÁ•¥™¥…Ì€´Y4Y%H9QLLQII%Q=I%%L9I%L€¨½ô((€€€€€€€ì¼¨I½Ñ„ÁÕ‰±¥„‘”ÁÉ½™¥ÍÍ¥½¹…°è€½Í•ÉÙ¥½Ì¼éÍÑ…Ñ”¼é¥Ñä½ÁÉ½™¥ÍÍ¥½¹…°¼éÍ±Õœ€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õíÁÉ½™•ÍÍ¥½¹…±AÕ‰±¥I½ÕÑ•Ì¹‘•Ñ…¥±I½ÕÑ•A…Ñ  ¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹AÉ½™¥ÍÍ¥½¹…±AÕ‰±¥A…”€¼ùô(€€€€€€€€¼ø((€€€€€€€ì¼¨½µÕ¹¥……¼Q•ÉÉ¥Ñ½É¥…°€´É½Ñ…Ì•ÍÁ•¥™¥…Ì…¹Ñ•Ì‘…ÌÑ•ÉÉ¥Ñ½É¥…¥Ì•¹•É¥…Ì€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±I½ÕÑ•A…Ñ ¡QII%Q=I%1}MQQ%¹½µµÕ¹¥…Ñ¥½¸°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹¡…¹¹•±M±Õœ°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹¡…¹¹•±A…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½½µÕ¹¥……¼½•µÁÉ•Í„¼é¡…¹¹•±M±Õœˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹½µÁ…¹å•Ñ…¥±ÍA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ ôˆ½½µÕ¹¥……¼½…•¹Ñ”¼é¡…¹¹•±M±Õœˆ(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹•¹ÑA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±I½ÕÑ•A…Ñ ¡QII%Q=I%1}MQQ%¹½µµÕ¹¥…Ñ¥½¸¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð (€€€€€€€€€€€€‰½µµÕ¹¥…Ñ¥½¸ˆ°(€€€€€€€€€€€€‰½µÕ¹¥‡Ÿ¼ˆ°(€€€€€€€€€€€€ñ@¹½µµÕ¹¥…Ñ¥½¹¥ÑåA…”€¼ø°(€€€€€€€€€€¥ô(€€€€€€€€¼ø((€€€€€€€ì¼¨5½‘Õ±¼A½¹Ñ½ÌQÕÉ¥ÍÑ¥½Ì€´Ù•ÉÑ¥…°Ñ½ÕÉ¥Í´€¨½ô((€€€€€€€ì¼¨•Ñ…±¡”½´Ñ•ÉÉ¥Ñ½É¥¼€ ÐÍ•µ•¹Ñ½Ì¤è€½Á½¹Ñ½ÌµÑÕÉ¥ÍÑ¥½Ì¼éÍÑ…Ñ”¼é¥Ñä¼é‘¥ÍÑÉ¥Ð¼éÍ±Õœ€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õíÑ½ÕÉ¥ÍÑA½¥¹ÑAÕ‰±¥I½ÕÑ•Ì¹‘•Ñ…¥±]¥Ñ¡Q•ÉÉ¥Ñ½ÉåI½ÕÑ•A…Ñ  ¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹Õ¥‘•Q½ÕÉ¥ÍÑA½¥¹Ñ•Ñ…¥±A…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨I½Ñ„Ñ•ÉÉ¥Ñ½É¥…°‘”€ÌÍ•µ•¹Ñ½Ìè±¥ÍÑ…•´‘”‘¥ÍÑÉ¥Ñ¼½ÉÕÁ¼½Ô‘•Ñ…±¡”Í•´‘¥ÍÑÉ¥Ñ¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õíÑ½ÕÉ¥ÍÑA½¥¹ÑAÕ‰±¥I½ÕÑ•Ì¹‘¥ÍÑÉ¥Ñ=É•Ñ…¥±I½ÕÑ•A…Ñ  ¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹Q½ÕÉ¥ÍÑA½¥¹ÑI½ÕÑ•I•Í½±Ù•È€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´¥‘…‘”€ ÈÍ•µ•¹Ñ½Ì¤è€½Á½¹Ñ½ÌµÑÕÉ¥ÍÑ¥½Ì¼éÍÑ…Ñ”¼é¥Ñä€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õíÑ½ÕÉ¥ÍÑA½¥¹ÑAÕ‰±¥I½ÕÑ•Ì¹¥ÑåI½ÕÑ•A…Ñ  ¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹Õ¥‘•Q½ÕÉ¥ÍÑA½¥¹ÑÍA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨I½Ñ…Ì‘”½µÕ¹¥‘…‘””…±¥…Í•ÌÕÉÑ½Ì€´…¹Ñ•Ì‘…ÌÑ•ÉÉ¥Ñ½É¥…¥Ì•¹•É¥…Ì€¨½ô(€€€€€€€í½µµÕ¹¥ÑåQ•ÉÉ¥Ñ½ÉåI½ÕÑ•Ì ¥ô((€€€€€€€ì¼¨I½Ñ…ÌÑ•ÉÉ¥Ñ½É¥…¥Ì•¹•É¥…Ì€´Y4Y%HA=%LLMA%%L€¨½ô((€€€€€€€ì¼¨1…¹‘¥¹œÑ•ÉÉ¥Ñ½É¥…°•¹•É¥¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±	…É•I½ÕÑ•A…Ñ ¡mQII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ñt¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”(€€€€€€€€€€€¥¹‘•à(€€€€€€€€€€€•±•µ•¹Ðõì(€€€€€€€€€€€€€€ñQ•ÉÉ¥Ñ½É¥…±%¹‘•áA…”¥Ñå1…¹‘¥¹½µÁ½¹•¹ÐõíQ•ÉÉ¥Ñ½Éå!½µ•A…•ô€¼ø(€€€€€€€€€€€ô(€€€€€€€€€€¼ø(€€€€€€€€ð½I½ÕÑ”ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±	…É•I½ÕÑ•A…Ñ  ¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”(€€€€€€€€€€€¥¹‘•à(€€€€€€€€€€€•±•µ•¹Ðõì(€€€€€€€€€€€€€€ñQ•ÉÉ¥Ñ½É¥…±%¹‘•áA…”¥Ñå1…¹‘¥¹½µÁ½¹•¹ÐõíQ•ÉÉ¥Ñ½Éå!½µ•A…•ô€¼ø(€€€€€€€€€€€ô(€€€€€€€€€€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1…¹‘¥¹œ‘”•ÍÑ…‘¼€´±¥ÍÑ„¥‘…‘•Ì…Ñ¥Ù…Ì€¨½ô(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ¼éÍÑ…Ñ”ˆ•±•µ•¹Ðõìñ@¹MÑ…Ñ•1…¹‘¥¹A…”€¼ùô€¼ø((€€€€€€€ì¼¨1…¹‘¥¹œ‘”Á…¥Ì€´±¥ÍÑ„•ÍÑ…‘½Ì…Ñ¥Ù½Ì€¨½ô(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½‰É…Í¥°ˆ•±•µ•¹Ðõìñ@¹	É…Í¥±M¡½Ý…Í•A…”€¼ùô€¼ø(€€€€€€€€ñI½ÕÑ”Á…Ñ ôˆ½‰Èˆ•±•µ•¹Ðõìñ@¹½Õ¹ÑÉå1…¹‘¥¹A…”€¼ùô€¼ø((€€€€€€€íÉ•¹‘•ÉÁÁ1…å½ÕÑI½ÕÑ••ÍÉ¥ÁÑ½ÉÌ¡AA}1e=UQ}QII%Q=I%1}=5%9}I=UQL¥ô((€€€€€€€ì¼¨I½Ñ…Ì‘”…ÍÑÉ½¹½µ¥„€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí…ÍÑÉ½¹½µåAÕ‰±¥I½ÕÑ•Ì¹¡½µ” ¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå1…¹‘¥¹A…”€¼ùô(€€€€€€€€¼ø(€€€€€€€ì¼¨I½Ñ…ÌÁÕ‰±¥…Ì•ÍÑ…Ñ¥…ÌÁÉ•¥Í…´Ù¥È…¹Ñ•Ì‘…ÌÑ•ÉÉ¥Ñ½É¥…¥Ì‘¥¹…µ¥…Ì¸€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí…ÍÑÉ½¹½µåAÕ‰±¥I½ÕÑ•Ì¹™…Ù½É¥Ñ•Ì ¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹5å…Ù½É¥Ñ•ÍA…”€¼ùô(€€€€€€€€¼ø(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí…ÍÑÉ½¹½µåAÕ‰±¥I½ÕÑ•Ì¹½É‘•É•Ñ…¥±Ì (€€€€€€€€€€€MQI=9=5e}AU	1%}I=UQ}AI5L¹½É‘•É%°(€€€€€€€€€€¥ô(€€€€€€€€€•±•µ•¹Ðõìñ@¹=É‘•É•Ñ…¥±ÍA…”€¼ùô(€€€€€€€€¼ø((€€€€€€€ì¼¨•Ñ…±¡”ÁÉ•µ¥Õ´è€½…ÍÑÉ½¹½µ¥„µÁÉ•µ¥Õ´¼éÕ˜¼é¥‘…‘”¼é‰…¥ÉÉ¼¼éÍ±Õœ€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±I½ÕÑ•A…Ñ  (€€€€€€€€€€€QII%Q=I%1}MQQ%¹…ÍÑÉ½¹½µåAÉ•µ¥Õ´°(€€€€€€€€€€€mQII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°QII%Q=I%1}AI5L¹Í±Õt°(€€€€€€€€€€¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µåAÉ•µ¥Õµ•Ñ…¥±A…”€¼ùô€¼ø(€€€€€€€€€€ñI½ÕÑ”Á…Ñ ô‰¡•­½ÕÐˆ•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå¡•­½ÕÑA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨±¥…Ì±•…‘¼‘”‘•Ñ…±¡”ìÉ•‘¥É•¥½¹„Á…É„UI0ÁÕ‰±¥„‘„•µÁÉ•Í„€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹…ÍÑÉ½¹½µä°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€€€QII%Q=I%1}AI5L¹Í±Õœ°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå•Ñ…¥±A…”€¼ùô€¼ø(€€€€€€€€€€ñI½ÕÑ”Á…Ñ ô‰¡•­½ÕÐˆ•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå¡•­½ÕÑA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´‰…¥ÉÉ¼è€½…ÍÑÉ½¹½µ¥„¼éÕ˜¼é¥‘…‘”¼é‰…¥ÉÉ¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹…ÍÑÉ½¹½µä°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå1…¹‘¥¹A…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´¥‘…‘”è€½…ÍÑÉ½¹½µ¥„¼éÕ˜¼é¥‘…‘”€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹…ÍÑÉ½¹½µä¥ô(€€€€€€€€€•±•µ•¹ÐõìñQ•ÉÉ¥Ñ½É¥…±1…å½ÕÐ€¼ùô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹…ÍÑÉ½¹½µå1…¹‘¥¹A…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨I½Ñ…Ì‘”‘Õ…Ñ¥½¸€´ÁÕ‰±¥…ÌÑ•ÉÉ¥Ñ½É¥…¥Ì€¡Ù¥ÑÉ¥¹”ÁÉ•µ¥Õ´½¹Í½±¥‘…‘„¤€¨½ô(€€€€€€€ì¼¨•Ñ…±¡”è€½•‘Õ……¼¼éÕ˜¼é¥‘…‘”¼é‰…¥ÉÉ¼¼éÍ±Õœ€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹•‘Õ…Ñ¥½¸°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€€€QII%Q=I%1}AI5L¹Í±Õœ°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡Q•ÉÉ¥Ñ½É¥…±1…å½ÕÐ ‰•‘Õ…Ñ¥½¸ˆ°€‰‘Õ‡Ÿ¼ˆ¥ô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹‘Õ…Ñ¥½¹•Ñ…¥±A…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´‰…¥ÉÉ¼è€½•‘Õ……¼¼éÕ˜¼é¥‘…‘”¼é‰…¥ÉÉ¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹•‘Õ…Ñ¥½¸°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡Q•ÉÉ¥Ñ½É¥…±1…å½ÕÐ ‰•‘Õ…Ñ¥½¸ˆ°€‰‘Õ‡Ÿ¼ˆ¥ô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹‘Õ…Ñ¥½¹áÁ±½É•ÉA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´¥‘…‘”è€½•‘Õ……¼¼éÕ˜¼é¥‘…‘”€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹•‘Õ…Ñ¥½¸¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡Q•ÉÉ¥Ñ½É¥…±1…å½ÕÐ ‰•‘Õ…Ñ¥½¸ˆ°€‰‘Õ‡Ÿ¼ˆ¥ô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹‘Õ…Ñ¥½¹áÁ±½É•ÉA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨I½Ñ…Ì‘”Ù……Ì€¨½ô((€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí)=	}I=UQL¹¡½µ•ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰©½‰Ìˆ°€‰Y……Ìˆ°€ñ@¹Y……ÍAÕ‰±¥A…”€¼ø¥ô(€€€€€€€€¼ø(€€€€€€€ì¼¨•Ñ…±¡”…¹½¹¥¼è€½Ù……Ì¼éÕ˜¼é¥‘…‘”¼éÍ±Õœ€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹©½‰Ì°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹Í±Õœ°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡±•µ•¹Ð ‰©½‰Ìˆ°€‰Y……Ìˆ°€ñ@¹Y……•Ñ…¥±AÕ‰±¥A…”€¼ø¥ô(€€€€€€€€¼ø((€€€€€€€ì¼¨1¥ÍÑ…•´Ñ•ÉÉ¥Ñ½É¥…°è€½Ù……Ì¼éÕ˜¼é¥‘…‘”¼é‰…¥ÉÉ¼€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹©½‰Ì°l(€€€€€€€€€€€QII%Q=I%1}AI5L¹‘¥ÍÑÉ¥Ð°(€€€€€€€€€t¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡Q•ÉÉ¥Ñ½É¥…±1…å½ÕÐ ‰©½‰Ìˆ°€‰Y……Ìˆ¥ô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹Q•ÉÉ¥Ñ½É¥…±Y……ÍA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø((€€€€€€€ì¼¨1¥ÍÑ…•´Ñ•ÉÉ¥Ñ½É¥…°¥‘…‘”è€½Ù……Ì¼éÕ˜¼é¥‘…‘”€¨½ô(€€€€€€€€ñI½ÕÑ”(€€€€€€€€€Á…Ñ õí‰Õ¥±‘Q•ÉÉ¥Ñ½É¥…±5½‘Õ±•I½ÕÑ•A…Ñ ¡AA}5=U1}M1UL¹©½‰Ì¥ô(€€€€€€€€€•±•µ•¹Ðõí±…Õ¹¡Q•ÉÉ¥Ñ½É¥…±1…å½ÕÐ ‰©½‰Ìˆ°€‰Y……Ìˆ¥ô(€€€€€€€€ø(€€€€€€€€€€ñI½ÕÑ”¥¹‘•à•±•µ•¹Ðõìñ@¹Q•ÉÉ¥Ñ½É¥…±Y……ÍA…”€¼ùô€¼ø(€€€€€€€€ð½I½ÕÑ”ø(€€€€€€ð½I½ÕÑ”ø((€€€€€€ñI½ÕÑ”Á…Ñ ôˆ¨ˆ•±•µ•¹Ðõìñ@¹9½Ñ½Õ¹€¼ùô€¼ø(€€€€ð½I½ÕÑ•Ìø(€€¤ì)ô(