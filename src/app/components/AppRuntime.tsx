import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";

import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/launchScope";
import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { hasAuthCallbackMarker } from "@/core/auth/utils/authCallback";
import {
  applyAccessibilityPreferences,
  readAccessibilityPreferences,
} from "@/shared/accessibility/preferences";
import { scheduleAfterPublicRootMap } from "@/shared/utils/publicRootReadiness";

const RoutedAppRuntime = lazy(() =>
  import("@/app/components/RoutedAppRuntime"),
);

const PublicRootOverlays = lazy(() =>
  import("@/app/components/PublicRootOverlays"),
);

function shouldUseLeanPublicRoot(): boolean {
  if (PRELAUNCH_LOCKDOWN_ENABLED || window.location.pathname !== "/") {
    return false;
  }

  return !hasAuthCallbackMarker(
    window.location.search,
    window.location.hash,
  );
}

function LeanPublicRootRuntime() {
  const [shouldMountOverlays, setShouldMountOverlays] = useState(false);

  useLayoutEffect(() => {
    applyAccessibilityPreferences(
      document.body,
      readAccessibilityPreferences(),
    );
  }, []);

  useEffect(() => {
    let cancelReadinessWork: (() => void) | null = null;

    const scheduleOverlays = () => {
      cancelReadinessWork = scheduleAfterPublicRootMap(
        () => setShouldMountOverlays(true),
        {
          maxWaitMs: 2600,
          idleTimeoutMs: 2500,
          idleFallbackDelayMs: 1200,
        },
      );
    };

    if (document.readyState === "complete") {
      scheduleOverlays();
    } else {
      window.addEventListener("load", scheduleOverlays, { once: true });
    }

    return () => {
      window.removeEventListener("load", scheduleOverlays);
      cancelReadinessWork?.();
    };
  }, []);

  return (
    <>
      <RootRouteEntry />
      {shouldMountOverlays ? (
        <Suspense fallback={null}>
          <PublicRootOverlays />
        </Suspense>
      ) : null}
    </>
  );
}

function RuntimeLoadingFallback() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Carregando aplicação"
    />
  );
}

export function AppRuntime() {
  if (shouldUseLeanPublicRoot()) {
    return <LeanPublicRootRuntime />;
  }

  return (
    <Suspense fallback={<RuntimeLoadingFallback />}>
      <RoutedAppRuntime />
    </Suspense>
  );
}
