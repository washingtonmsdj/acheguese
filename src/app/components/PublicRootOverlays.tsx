import { lazy, Suspense } from "react";

import { ConsentBannerContent } from "@/app/components/privacy/ConsentBannerContent";

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
 * Este chunk só monta após load + idle e permanece independente do router.
 * A raiz navega por documentos/anchors, então o pathname atual do browser é o
 * contrato suficiente para posicionar/suprimir o banner de consentimento.
 */
export default function PublicRootOverlays() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <>
      <ConsentBannerContent pathname={pathname} />
      {VercelAnalytics ? (
        <Suspense fallback={null}>
          <VercelAnalytics />
        </Suspense>
      ) : null}
    </>
  );
}
