/**
 * RootRouteEntry
 *
 * Entrada pública do MVP. Enquanto o lançamento possui uma única comunidade
 * principal, `/` sempre apresenta a entrada community-first do Complexo em vez
 * de pular silenciosamente para um território salvo ou do perfil.
 */
import { lazy, Suspense } from "react";
import TerritoryEntryPage from "@/app/pages/TerritoryEntryPage";

const LazyPreLaunchLandingPage = lazy(() =>
  import("@/app/pages/PreLaunchLandingPage"),
);

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

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
