import { lazy, Suspense } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { SEO } from "@/app/components/SEO";
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
                    <TerritoryModeInitializer />
                    <GlobalOverlays />
                  </Suspense>
                  <ModuleContextSync />
                  <Suspense fallback={<FullScreenLoader />}>
                    <AppRoutes />
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
