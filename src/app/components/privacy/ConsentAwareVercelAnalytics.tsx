import { lazy, Suspense } from "react";

import { useAnalyticsConsent } from "@/core/privacy/hooks/useConsentPermission";

const shouldOfferVercelAnalytics =
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  !["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

const VercelAnalytics = lazy(() =>
  import("@vercel/analytics/react").then((module) => ({
    default: module.Analytics,
  })),
);

/**
 * Analytics não é importado nem montado antes de consentimento explícito.
 * Mudanças posteriores de consentimento controlam a integração React; código
 * de terceiro já baixado pelo navegador não pode ser "descarregado" retroativamente.
 */
export function ConsentAwareVercelAnalytics() {
  const analyticsConsent = useAnalyticsConsent();

  if (!shouldOfferVercelAnalytics || !analyticsConsent) return null;

  return (
    <Suspense fallback={null}>
      <VercelAnalytics />
    </Suspense>
  );
}
