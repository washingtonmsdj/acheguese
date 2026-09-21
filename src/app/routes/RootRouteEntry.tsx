/**
 * RootRouteEntry
 *
 * Entrada pública do MVP.
 *
 * A raiz apresenta o território inicial e os três módulos ativos do produto:
 * Empresas, Mapa e Perto de mim. Não encaminha para módulos pausados.
 */
import { lazy, Suspense } from "react";
import { PRELAUNCH_LOCKDOWN_ENABLED } from "@/app/config/launchScope";
import TerritoryEntryPage from "@/app/pages/TerritoryEntryPage";

const LazyPreLaunchLandingPage = lazy(() =>
  import("@/app/pages/PreLaunchLandingPage"),
);

export default function RootRouteEntry() {
  if (PRELAUNCH_LOCKDOWN_ENABLED) {
    return (
      <Suspense
        fallback={
          <div
            className="min-h-screen bg-background"
            role="status"
            aria-label="Carregando entrada"
          />
        }
      >
        <LazyPreLaunchLandingPage />
      </Suspense>
    );
  }

  return <TerritoryEntryPage />;
}
