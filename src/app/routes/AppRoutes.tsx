/**
 * AppRoutes - arvore raiz de roteamento.
 *
 * Mantem apenas rotas sem layout e delega subarvores grandes por dominio.
 */

import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";

const RootRouteEntry = lazy(() => import("@/app/routes/RootRouteEntry"));
const AppLayoutRoutes = lazy(() =>
  import("@/app/routes/sections/AppLayoutRoutes").then((module) => ({
    default: module.AppLayoutRoutes,
  })),
);
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
const CadastroPrimeiroAcessoPage = lazy(
  () => import("@/app/features/onboarding/pages/CadastroPrimeiroAcessoPage"),
);
const CommunityIndicationPage = lazy(
  () => import("@/app/pages/CommunityIndicationPage"),
);
const CadastroConfirmacaoPage = lazy(
  () => import("@/app/features/onboarding/pages/CadastroConfirmacaoPage"),
);
const AceiteTermosPage = lazy(
  () => import("@/app/features/onboarding/pages/AceiteTermosPage"),
);
const AboutPage = lazy(() => import("@/app/pages/AboutPage"));
const ComoFuncionaPage = lazy(() => import("@/app/pages/ComoFuncionaPage"));
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

export function AppRoutes() {
  if (PRELAUNCH_LOCKDOWN_ENABLED) {
    return (
      <Routes>
        <Route path="/" element={<RootRouteEntry />} />
        <Route path={AUTH_PATHS.login} element={<LoginPage />} />
        <Route path={AUTH_PATHS.passwordReset} element={<ResetPasswordPage />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RootRouteEntry />} />
      <Route path="/q/:token" element={<QrResolverPage />} />
      <Route path="/status" element={<StatusPage />} />

      <Route path="/splash" element={<SplashPage />} />
      <Route path={AUTH_PATHS.login} element={<LoginPage />} />
      <Route path={AUTH_PATHS.signup} element={<CadastroPage />} />
      <Route path={AUTH_PATHS.firstAccess} element={<CadastroPrimeiroAcessoPage />} />
      <Route
        path="/indicar-comunidade"
        element={<CommunityIndicationPage />}
      />
      <Route
        path={AUTH_PATHS.signupConfirmation}
        element={<CadastroConfirmacaoPage />}
      />
      <Route path={AUTH_PATHS.termsAcceptance} element={<AceiteTermosPage />} />
      <Route path="/como-funciona" element={<ComoFuncionaPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/contato" element={<ContactPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path={AUTH_PATHS.passwordReset} element={<ResetPasswordPage />} />
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