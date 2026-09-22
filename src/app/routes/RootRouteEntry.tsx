/**
 * RootRouteEntry
 *
 * Entrada pública do MVP.
 *
 * A raiz apresenta o território inicial e o núcleo público do MVP:
 * Business/Empresas como domínio ativo, com Mapa, Perto de mim e Busca como
 * capabilities horizontais. Não encaminha para domínios pausados.
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
