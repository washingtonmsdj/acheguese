import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { ConsentBanner } from "@/app/components/privacy/ConsentBanner";
import { Toaster } from "@/shared/components/ui/toaster";
import { queryClient } from "@/shared/utils/queryClient";

const shouldLoadVercelAnalytics =
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

const VercelAnalytics = shouldLoadVercelAnalytics
  ? lazy(() =>
      import("@vercel/analytics/react").then((module) => ({
        default: module.Analytics,
      })),
    )
  : null;

/**
 * Overlays mínimos da raiz pública.
 *
 * Mantém consentimento e feedback de toast, sem carregar Sonner nem UI offline
 * da aplicação completa. Analytics continua lazy e só entra após este chunk.
 */
export default function PublicRootOverlays() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ConsentBanner />
      {VercelAnalytics ? (
        <Suspense fallback={null}>
          <VercelAnalytics />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
