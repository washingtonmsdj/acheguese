import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { SEO } from "@/app/components/SEO";
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
  return (
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
  );
}
