import { lazy, Suspense } from "react";

import { ConsentBanner } from "@/app/components/privacy/ConsentBanner";

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
 * O consentimento mantém estado próprio e Analytics continua lazy. QueryClient,
 * toaster, Sonner e UI offline pertencem apenas ao runtime completo.
 */
export default function PublicRootOverlays() {
  return (
    <>
      <ConsentBanner />
      {VercelAnalytics ? (
        <Suspense fallback={null}>
          <VercelAnalytics />
        </Suspense>
      ) : null}
    </>
  );
}
