import { useSyncExternalStore } from "react";

import { ConsentService } from "@/core/privacy/services/ConsentService";

function subscribe(listener: () => void): () => void {
  return ConsentService.subscribeToLocalConsent(listener);
}

function getAnalyticsSnapshot(): boolean {
  return ConsentService.hasGrantedLocalConsent("analytics");
}

export function useAnalyticsConsent(): boolean {
  return useSyncExternalStore(subscribe, getAnalyticsSnapshot, () => false);
}
