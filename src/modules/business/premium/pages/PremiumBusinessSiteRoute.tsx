import { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { PageLoader } from "@/shared/components/loading/PageLoader";
import { PremiumBusinessSiteResolver } from "@/core/business/services/PremiumBusinessSiteResolver";
import { usePublicBusinessSnapshot, usePublicGastronomySnapshot } from "@/modules/business/public/hooks";
import { PremiumBusinessShell } from "@/modules/business/premium/components/PremiumBusinessShell";
import type { PremiumBusinessSiteContextValue } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { logger } from "@/shared/utils/logger";
import type { PublicSlugRouteParams } from "@/modules/business/public/types";

interface ResolutionState {
  readonly status: "loading" | "resolved" | "not-found";
  readonly snapshotParams?: PublicSlugRouteParams;
  readonly premiumSlug?: string;
}

export default function PremiumBusinessSiteRoute() {
  const { slug } = useParams<{ slug: string }>();
  const [resolution, setResolution] = useState<ResolutionState>({
    status: "loading",
  });

  useEffect(() => {
    let isMounted = true;

    async function resolvePremiumSlug() {
      if (!slug) {
        if (isMounted) {
          setResolution({ status: "not-found" });
        }
        return;
      }

      const resolved = await PremiumBusinessSiteResolver.resolve(slug);
      if (!isMounted) return;

      if (!resolved) {
        setResolution({ status: "not-found" });
        return;
      }

      setResolution({
        status: "resolved",
        premiumSlug: resolved.premiumSlug,
        snapshotParams: {
          state: resolved.territoryRoute.state,
          city: resolved.territoryRoute.city,
          district: resolved.territoryRoute.district,
          slug: resolved.territoryRoute.businessSlug,
        },
      });
    }

    void resolvePremiumSlug();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const snapshotParams = resolution.snapshotParams;

  const businessSnapshotQuery = usePublicBusinessSnapshot(snapshotParams ?? {});
  const gastronomySnapshotQuery = usePublicGastronomySnapshot(snapshotParams ?? {});

  if (resolution.status === "loading") {
    return <PageLoader fullScreen message="Abrindo link premium..." />;
  }

  if (resolution.status === "not-found" || !snapshotParams || !resolution.premiumSlug) {
    return <Navigate to="/404" replace />;
  }

  const businessSnapshot = businessSnapshotQuery.data;
  const gastronomySnapshot = gastronomySnapshotQuery.data ?? null;
  const isLoadingSnapshots = businessSnapshotQuery.isLoading || gastronomySnapshotQuery.isLoading;

  if (isLoadingSnapshots) {
    return <PageLoader fullScreen message="Carregando dados da empresa..." />;
  }

  if (!businessSnapshot) {
    return <Navigate to="/404" replace />;
  }

  if (businessSnapshot.routing.redirectToCanonical && import.meta.env.DEV) {
    logger.warn(
      `[PremiumBusinessSiteRoute] Snapshot retornou redirect canônico inesperado: ${businessSnapshot.routing.redirectToCanonical}`,
    );
  }

  const routes = PremiumBusinessSiteResolver.buildRoutes(resolution.premiumSlug);
  const hasGastronomy = businessSnapshot.verticals.activeVerticals.includes("gastronomy");

  const contextValue: PremiumBusinessSiteContextValue = {
    premiumSlug: resolution.premiumSlug,
    routes,
    businessSnapshot,
    gastronomySnapshot,
    hasGastronomy,
  };

  return (
    <PremiumBusinessShell
      snapshot={businessSnapshot}
      routes={routes}
      hasGastronomy={hasGastronomy}
    >
      <Outlet context={contextValue} />
    </PremiumBusinessShell>
  );
}
