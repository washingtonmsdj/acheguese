import { lazy, Suspense } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { SEO } from "@/app/components/SEO";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { queryClient } from "@/shared/utils/queryClient";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
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

const SessionProfileRuntimeShell = lazy(() =>
  import("@/app/components/SessionProfileRuntimeShell"),
);

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

function RuntimeRouteTree() {
  const location = useLocation();
  const isLeanPublicRoot =
    !PRELAUNCH_LOCKDOWN_ENABLED && location.pathname === "/";

  return (
    <>
      <Suspense fallback={null}>
        <AuthHashRedirect />
        <GlobalOverlays />
      </Suspense>

      {isLeanPublicRoot ? (
        <Suspense fallback={<FullScreenLoader />}>
          <AppRoutes />
        </Suspense>
      ) : (
        <Suspense fallback={<FullScreenLoader />}>
          <SessionProfileRuntimeShell />
        </Suspense>
      )}
    </>
  );
}

export function AppRuntime() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEO />
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider>
            <SkipToContent />
            <BrowserRouter>
              <RuntimeRouteTree />
            </BrowserRouter>
          </AccessibilityProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
