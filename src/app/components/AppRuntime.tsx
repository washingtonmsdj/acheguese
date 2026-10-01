import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";

import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/releaseMode";
import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { hasAuthCallbackMarker } from "@/core/auth/utils/authCallback";
import {
  applyAccessibilityPreferences,
  readAccessibilityPreferences,
} from "@/shared/accessibility/preferences";
import { PassivePageFallback } from "@/shared/components/loading/PassivePageFallback";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";

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
      document.documentElement,
      readAccessibilityPreferences(),
    );
  }, []);

  useEffect(() => {
    let cancelIdleWork: (() => void) | null = null;

    const scheduleOverlays = () => {
      cancelIdleWork = scheduleBrowserIdleWork(
        () => setShouldMountOverlays(true),
        {
          timeoutMs: 1800,
          fallbackDelayMs: 300,
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
      cancelIdleWork?.();
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

export function AppRuntime() {
  if (shouldUseLeanPublicRoot()) {
    return <LeanPublicRootRuntime />;
  }

  return (
    <Suspense fallback={<PassivePageFallback />}>
      <RoutedAppRuntime />
    </Suspense>
  );
}
