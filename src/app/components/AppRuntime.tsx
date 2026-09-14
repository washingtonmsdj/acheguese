import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import RootRouteEntry from "@/app/routes/RootRouteEntry";
import { FullScreenLoader } from "@/shared/components/loading/PageLoader";
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

  useEffect(() =>
    scheduleBrowserIdleWork(
      () => setShouldMountOverlays(true),
      { timeoutMs: 1800, fallbackDelayMs: 900 },
    ),
  []);

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
    <Suspense fallback={<FullScreenLoader />}>
      <FullAppRuntimeShell shouldCheckAuthRedirect={shouldCheckAuthRedirect} />
    </Suspense>
  );
}

export function AppRuntime() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RuntimeRouteTree />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
