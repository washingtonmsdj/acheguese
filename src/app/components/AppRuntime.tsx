import { lazy, Suspense } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { SEO } from "@/app/components/SEO";
import PreLaunchLandingPage from "@/app/pages/PreLaunchLandingPage";
import { AdminRoutes } from "@/app/routes/sections/AdminRoutes";
import { queryClient } from "@/shared/utils/queryClient";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
import { SessionProvider } from "@/core/session/providers/SessionProvider";
import {
  MultiProfileProvider,
  ModuleContextSync,
} from "@/core/profiles/contexts/multi-profile-runtime-context";
import { AccessibilityProvider } from "@/shared/components/accessibility/AccessibilityProvider";
import { SkipToContent } from "@/shared/components/accessibility/SkipToContent";

const GlobalOverlays = lazy(() =>
  import("@/app/components/GlobalOverlays").then((module) => ({
    default: module.GlobalOverlays,
  })),
);

const AuthHashRedirect = lazy(() =>
  import("@/core/auth/components/AuthHashRedirect").then((module) => ({
    default: module.AuthHashRedirect,
  })),
);

const TerritoryModeInitializer = lazy(() =>
  import("@/core/location/components/TerritoryModeInitializer").then((module) => ({
    default: module.TerritoryModeInitializer,
  })),
);

const AppRoutes = lazy(() =>
  import("@/app/routes/AppRoutes").then((module) => ({
    default: module.AppRoutes,
  })),
);

const LoginPage = lazy(() => import("@/app/pages/LoginPage"));
const ResetPasswordPage = lazy(() => import("@/app/pages/ResetPasswordPage"));

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "true") !== "false";

function PreLaunchRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PreLaunchLandingPage />} />
      <Route path="/login" element={<PreLaunchLoginRoute />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PreLaunchLoginRoute() {
  const { search } = useLocation();
  const redirect = new URLSearchParams(search).get("redirect") ?? "";
  return redirect.startsWith("/admin") ? <LoginPage /> : <Navigate to="/" replace />;
}

export function AppRuntime() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEO />
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider>
            <SessionProvider>
              <MultiProfileProvider>
                <SkipToContent />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <Suspense fallback={null}>
                    <AuthHashRedirect />
                    {!PRELAUNCH_LOCKDOWN_ENABLED ? (
                      <TerritoryModeInitializer />
                    ) : null}
                    <GlobalOverlays />
                  </Suspense>
                  <ModuleContextSync />
                  <Suspense fallback={<FullScreenLoader />}>
                    {PRELAUNCH_LOCKDOWN_ENABLED ? (
                      <PreLaunchRoutes />
                    ) : (
                      <AppRoutes />
                    )}
                  </Suspense>
                </BrowserRouter>
              </MultiProfileProvider>
            </SessionProvider>
          </AccessibilityProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
