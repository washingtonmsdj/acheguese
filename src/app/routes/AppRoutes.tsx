/**
 * AppRoutes - arvore raiz de roteamento.
 *
 * Mantem apenas rotas sem layout e delega subarvores grandes por dominio.
 */

import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
} from "@/core/routing/config/territorialRoutePatterns";
import LaunchPausedPage from "@/app/pages/LaunchPausedPage";
import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { AppLayoutRoutes } from "@/app/routes/sections/AppLayoutRoutes";

const QrResolverPage = lazy(() =>
  import("@/core/qr/pages/QrResolverPage").then((module) => ({
    default: module.QrResolverPage,
  })),
);
const StatusPage = lazy(() => import("@/app/pages/StatusPage"));
const SplashPage = lazy(() => import("@/app/pages/SplashPage"));
const LoginPage = lazy(() => import("@/app/pages/LoginPage"));
const CadastroPage = lazy(
  () => import("@/app/features/onboarding/pages/CadastroPage"),
);
const CadastroConfirmacaoPage = lazy(
  () => import("@/app/features/onboarding/pages/CadastroConfirmacaoPage"),
);
const AceiteTermosPage = lazy(
  () => import("@/app/features/onboarding/pages/AceiteTermosPage"),
);
const AboutPage = lazy(() => import("@/app/pages/AboutPage"));
const ContactPage = lazy(() => import("@/app/pages/ContactPage"));
const OnboardingPage = lazy(() => import("@/app/pages/OnboardingPage"));
const ResetPasswordPage = lazy(() => import("@/app/pages/ResetPasswordPage"));
const EmpresaCatalogoPublicoPage = lazy(
  () => import("@/modules/business/pages/EmpresaCatalogoPublicoPage"),
);
const PremiumBusinessSiteRoute = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessSiteRoute"),
);
const PremiumBusinessHomePage = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessHomePage"),
);
const PremiumBusinessMenuPage = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessMenuPage"),
);
const PremiumBusinessProductPage = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessProductPage"),
);
const PremiumBusinessCartPage = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessCartPage"),
);
const PremiumBusinessCheckoutPage = lazy(
  () => import("@/modules/business/premium/pages/PremiumBusinessCheckoutPage"),
);
const CentralRoutes = lazy(() =>
  import("./sections/CentralRoutes").then((module) => ({
    default: module.CentralRoutes,
  })),
);
const AdminRoutes = lazy(() =>
  import("./sections/AdminRoutes").then((module) => ({
    default: module.AdminRoutes,
  })),
);
const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

const EVENT_ROUTES = {
  home: buildAppModulePath(APP_MODULE_SLUGS.events),
  favorites: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.favorites,
  ),
  calendar: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.calendar,
  ),
  map: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_ROUTE_STATIC_SEGMENTS.map,
  ),
  detail: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    `${TERRITORIAL_ROUTE_STATIC_SEGMENTS.eventDetail}/${TERRITORIAL_ROUTE_PARAMS.eventId}`,
  ),
  legacyDetail: buildAppModulePath(
    APP_MODULE_SLUGS.events,
    TERRITORIAL_ROUTE_PARAMS.eventId,
  ),
} as const;

export function AppRoutes() {
  const eventsElement = <LaunchPausedPage moduleName="Eventos" />;

  if (PRELAUNCH_LOCKDOWN_ENABLED) {
    return (
      <Routes>
        <Route path="/" element={<RootRouteEntry />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/q/:token" element={<QrResolverPage />} />
      <Route path="/status" element={<StatusPage />} />

      <Route path={EVENT_ROUTES.home} element={eventsElement} />
      <Route path={EVENT_ROUTES.favorites} element={eventsElement} />
      <Route path={EVENT_ROUTES.calendar} element={eventsElement} />
      <Route path={EVENT_ROUTES.map} element={eventsElement} />
      <Route path={EVENT_ROUTES.detail} element={eventsElement} />
      <Route path={EVENT_ROUTES.legacyDetail} element={eventsElement} />

      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route
        path="/cadastro/confirmacao"
        element={<CadastroConfirmacaoPage />}
      />
      <Route path="/aceitar-termos" element={<AceiteTermosPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/empresas/:id/catalogo"
        element={<EmpresaCatalogoPublicoPage />}
      />
      <Route path="/p/:slug/*" element={<PremiumBusinessSiteRoute />}>
        <Route index element={<PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<PremiumBusinessMenuPage />} />
        <Route
          path="produto/:productSlug"
          element={<PremiumBusinessProductPage />}
        />
        <Route path="carrinho" element={<PremiumBusinessCartPage />} />
        <Route path="checkout" element={<PremiumBusinessCheckoutPage />} />
      </Route>

      <Route path="/central/*" element={<CentralRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/*" element={<AppLayoutRoutes />} />
    </Routes>
  );
}
