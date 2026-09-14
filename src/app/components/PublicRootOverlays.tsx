import { lazy, Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

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
 * Este chunk só monta após load + idle. O BrowserRouter existe aqui apenas
 * para o banner de consentimento ler pathname sem colocar react-router-dom no
 * bootstrap crítico da `/`.
 */
export default function PublicRootOverlays() {
  return (
    <BrowserRouter>
      <ConsentBanner />
      {VercelAnalytics ? (
        <Suspense fallback={null}>
          <VercelAnalytics />
        </Suspense>
      ) : null}
    </BrowserRouter>
  );
}
