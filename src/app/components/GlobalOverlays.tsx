import { ConsentAwareVercelAnalytics } from "@/app/components/privacy/ConsentAwareVercelAnalytics";
import { ConsentBanner } from "@/app/components/privacy/ConsentBanner";
import {
  OfflineBanner,
  OfflineIndicator,
} from "@/shared/components/offline/OfflineIndicator";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";

export function GlobalOverlays() {
  return (
    <>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <OfflineBanner />
      <ConsentBanner />
      <ConsentAwareVercelAnalytics />
    </>
  );
}
