import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";

import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { AUTH_QUERY_KEYS } from "@/core/auth/constants/authFlow";
import { scheduleAfterPublicRootMap } from "@/shared/utils/publicRootReadiness";

const RoutedAppRuntime = lazy(() =>
  import("@/app/components/RoutedAppRuntime"),
);

const PublicRootOverlays = lazy(() =>
  import("@/app/components/PublicRootOverlays"),
);

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

function hasRootAuthReturnMarkers(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.has(AUTH_QUERY_KEYS.code) ||
    searchParams.get(AUTH_QUERY_KEYS.mode) === "recovery" ||
    searchParams.get(AUTH_QUERY_KEYS.type) === "recovery" ||
    hashParams.has(AUTH_QUERY_KEYS.accessToken) ||
    hashParams.has(AUTH_QUERY_KEYS.refreshToken) ||
    hashParams.has(AUTH_QUERY_KEYS.error) ||
    hashParams.has(AUTH_QUERY_KEYS.errorCode) ||
    hashParams.get(AUTH_QUERY_KEYS.type) === "recovery"
  );
}

function shouldUseLeanPublicRoot(): boolean {
  if (PRELAUNCH_LOCKDOWN_ENABLED || window.location.pathname !== "/") {
    return false;
  }

  return !hasRootAuthReturnMarkers();
}

function LeanPublicRootRuntime() {
  const [shouldMountOverlays, setShouldMountOverlays] = useState(false);

  useLayoutEffect(() => {
    try {
      const body = document.body;
      const highContrast =
        localStorage.getItem("accessibility-high-contrast") === "true";
      const fontSize = localStorage.getItem("accessibility-font-size");

      body.classList.toggle("accessibility-high-contrast", highContrast);
      body.classList.remove(
        "accessibility-font-large",
        "accessibility-font-extra-large",
      );

      if (fontSize === "large") {
        body.classList.add("accessibility-font-large");
      } else if (fontSize === "extra-large") {
        body.classList.add("accessibility-font-extra-large");
      }
    } catch {
      // Storage pode estar indisponivel; a raiz continua funcional sem preferencia.
    }
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
