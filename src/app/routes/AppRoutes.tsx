/**
 * AppRoutes - arvore raiz de roteamento.
 *
 * Mantem apenas rotas sem layout e delega subarvores grandes por dominio.
 */

import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import {
  EVENT_PUBLIC_ROUTE_PARAMS,
  eventPublicRoutes,
} from "@/core/verticals/events/routes/eventPublicRoutes";

const QrResolverPage = lazy(() =>
  import("@/core/qr/pages/QrResolverPage").then((module) => ({
    default: module.QrResolverPage,
  })),
);
const StatusPage = lazy(() => import("@/app/pages/StatusPage"));
const SplashPage = lazy(() => import("@/app/pages/SplashPage"));
const LoginPage = lazy(() => import("@/app/pages/LoginPage"));
const CadastroPage = lazy(() => import("@/app/features/onboarding/pages/CadastroPage"));
const CadastroConfirmacaoPage = lazy(() =>
  import("@/app/features/onboarding/pages/CadastroConfirmacaoPage"),
);
const AboutPage = lazy(() => import("@/app/pages/AboutPage"));
const ContactPage = lazy(() => import("@/app/pages/ContactPage"));
const OnboardingPage = lazy(() => import("@/app/pages/OnboardingPage"));
const ResetPasswordPage = lazy(() => import("@/app/pages/ResetPasswordPage"));
const EmpresaCatalogoPublicoPage = lazy(() =>
  import("@/modules/business/pages/EmpresaCatalogoPublicoPage"),
);
const PremiumBusinessSiteRoute = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessSiteRoute"),
);
const PremiumBusinessHomePage = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessHomePage"),
);
const PremiumBusinessMenuPage = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessMenuPage"),
);
const PremiumBusinessProductPage = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessProductPage"),
);
const PremiumBusinessCartPage = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessCartPage"),
);
const PremiumBusinessCheckoutPage = lazy(() =>
  import("@/modules/business/premium/pages/PremiumBusinessCheckoutPage"),
);
const EventsListPage = lazy(() => import("@/features/events/pages/EventsListPage"));
const EventsFavoritesPage = lazy(() =>
  import("@/features/events/pages/EventsFavoritesPage"),
);
const EventsCalendarPage = lazy(() =>
  import("@/features/events/pages/EventsCalendarPage"),
);
const EventsMapPage = lazy(() => import("@/features/events/pages/EventsMapPage"));
const EventDetailPage = lazy(() => import("@/features/events/pages/EventDetailPage"));
const EventsErrorBoundary = lazy(() =>
  import("@/features/events/components/EventsErrorBoundary").then((module) => ({
    default: module.EventsErrorBoundary,
  })),
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
const AppLayoutRoutes = lazy(() =>
  import("./sections/AppLayoutRoutes").then((module) => ({
    default: module.AppLayoutRoutes,
  })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/q/:token" element={<QrResolverPage />} />
      <Route path="/status" element={<StatusPage />} />

      <Route
        path={eventPublicRoutes.home()}
        element={
          <EventsErrorBoundary>
            <EventsListPage />
          </EventsErrorBoundary>
        }
      />
      <Route
        path={eventPublicRoutes.favorites()}
        element={
          <EventsErrorBoundary>
            <EventsFavoritesPage />
          </EventsErrorBoundary>
        }
      />
      <Route
        path={eventPublicRoutes.calendar()}
        element={
          <EventsErrorBoundary>
            <EventsCalendarPage />
          </EventsErrorBoundary>
        }
      />
      <Route
        path={eventPublicRoutes.map()}
        element={
          <EventsErrorBoundary>
            <EventsMapPage />
          </EventsErrorBoundary>
        }
      />
      <Route
        path={eventPublicRoutes.detail(EVENT_PUBLIC_ROUTE_PARAMS.eventId)}
        element={
          <EventsErrorBoundary>
            <EventDetailPage />
          </EventsErrorBoundary>
        }
      />
      <Route
        path={eventPublicRoutes.legacyDetail(EVENT_PUBLIC_ROUTE_PARAMS.eventId)}
        element={
          <EventsErrorBoundary>
            <EventDetailPage />
          </EventsErrorBoundary>
        }
      />

      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/cadastro/confirmacao" element={<CadastroConfirmacaoPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/empresas/:id/catalogo" element={<EmpresaCatalogoPublicoPage />} />
      <Route path="/p/:slug/*" element={<PremiumBusinessSiteRoute />}>
        <Route index element={<PremiumBusinessHomePage />} />
        <Route path="cardapio" element={<PremiumBusinessMenuPage />} />
        <Route path="produto/:productSlug" element={<PremiumBusinessProductPage />} />
        <Route path="carrinho" element={<PremiumBusinessCartPage />} />
        <Route path="checkout" element={<PremiumBusinessCheckoutPage />} />
      </Route>

      <Route path="/central/*" element={<CentralRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/*" element={<AppLayoutRoutes />} />
    </Routes>
  );
}
