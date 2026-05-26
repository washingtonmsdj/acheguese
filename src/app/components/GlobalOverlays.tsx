import { lazy, Suspense } from "react";

import { ConsentBanner } from "@/app/components/privacy/ConsentBanner";
import {
  OfflineBanner,
  OfflineIndicator,
} from "@/shared/components/offline/OfflineIndicator";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";

const VercelAnalytics = import.meta.env.PROD
  ? lazy(() =>
      import("@vercel/analytics/react").then((module) => ({
        default: module.Analytics,
      })),
    )
  : null;

export function GlobalOverlays() {
  return (
    <>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <OfflineBanner />
      <ConsentBanner />
      {VercelAnalytics ? (
        <Suspense fallback={null}>
          <VercelAnalytics />
        </Suspense>
      ) : null}
    </>
  );
}
