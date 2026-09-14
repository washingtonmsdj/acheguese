import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { SEO } from "@/app/components/SEO";
import { queryClient } from "@/shared/utils/queryClient";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
import { AccessibilityProvider } from "@/shared/components/accessibility/AccessibilityProvider";
import { SkipToContent } from "@/shared/components/accessibility/SkipToContent";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";
import "@/styles/accessibility.css";

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

interface FullAppRuntimeShellProps {
  shouldCheckAuthRedirect: boolean;
}

/**
 * Runtime completo das rotas contextuais/autenticadas.
 *
 * Mantem React Query, Helmet, acessibilidade, overlays, sessao e perfis fora
 * do bundle critico da raiz publica `/`.
 */
export default function FullAppRuntimeShell({
  shouldCheckAuthRedirect,
}: FullAppRuntimeShellProps) {
  useEffect(() =>
    scheduleBrowserIdleWork(
      () => {
        void import("@/core/authorization/services/CapabilityPreviewService").then(
          ({ CapabilityPreviewService }) => CapabilityPreviewService.initialize(),
        );

        void import("@/integrations/maps").then(({ setupDefaultProviders }) => {
          setupDefaultProviders();
        });

        void import("@/core/maps/config/maplibreWorkerRuntime").then(
          ({ ensureMapLibreWorkerConfigured }) => {
            ensureMapLibreWorkerConfigured();
          },
        );
      },
      { timeoutMs: 2200, fallbackDelayMs: 900 },
    ),
  []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <SEO />
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider>
            <SkipToContent />

            <Suspense fallback={null}>
              {shouldCheckAuthRedirect ? <AuthHashRedirect /> : null}
              <GlobalOverlays />
            </Suspense>

            <Suspense fallback={<FullScreenLoader />}>
              <SessionProfileRuntimeShell />
            </Suspense>
          </AccessibilityProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
