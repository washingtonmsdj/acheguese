import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";

import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { scheduleBrowserIdleWork } from "@/shared/utils/browserIdle";

const FullAppRuntimeShell = lazy(() =>
  import("@/app/components/FullAppRuntimeShell"),
);

const PublicRootOverlays = lazy(() =>
  import("@/app/components/PublicRootOverlays"),
);

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

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
    let cancelIdleWork: (() => void) | null = null;

    const scheduleOverlays = () => {
      cancelIdleWork = scheduleBrowserIdleWork(
        () => setShouldMountOverlays(true),
        { timeoutMs: 2500, fallbackDelayMs: 1200 },
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

function RuntimeLoadingFallback() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-label="Carregando aplicação"
    />
  );
}

function RuntimeRouteTree() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shouldCheckAuthRedirect =
    location.hash.length > 1 ||
    searchParams.has("code") ||
    searchParams.get("mode") === "recovery";
  const isLeanPublicRoot =
    !PRELAUNCH_LOCKDOWN_ENABLED &&
    location.pathname === "/" &&
    !shouldCheckAuthRedirect;

  if (isLeanPublicRoot) {
    return <LeanPublicRootRuntime />;
  }

  return (
    <Suspense fallback={<RuntimeLoadingFallback />}>
      <FullAppRuntimeShell shouldCheckAuthRedirect={shouldCheckAuthRedirect} />
    </Suspense>
  );
}

export function AppRuntime() {
  return (
    <BrowserRouter>
      <RuntimeRouteTree />
    </BrowserRouter>
  );
}
