/**
 * RootRouteEntry
 *
 * Sprint JOURNEY.1 — Correção C2 (Friction Map).
 *
 * Se o usuário já tem um território ativo/anterior, redireciona `/` para a
 * Territory Home desse bairro, evitando cair sempre no Selector.
 * Caso contrário, renderiza a entrada territorial canônica.
 */
import { useSyncExternalStore } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import TerritoryEntryPage from "@/app/pages/TerritoryEntryPage";
import PreLaunchLandingPage from "@/app/pages/PreLaunchLandingPage";
import {
  lastTerritoryStore,
  type LastTerritory,
} from "@/core/routing/stores/LastTerritoryStore";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";

const PRELAUNCH_LOCKDOWN_ENABLED =
  (import.meta.env.VITE_PRELAUNCH_LOCKDOWN ?? "false") === "true";

export default function RootRouteEntry() {
  if (PRELAUNCH_LOCKDOWN_ENABLED) {
    return <PreLaunchLandingPage />;
  }

  return <ResolvedTerritoryRoot />;
}

function ResolvedTerritoryRoot() {
  const [searchParams] = useSearchParams();
  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    (listener) => lastTerritoryStore.subscribe(listener),
    () => lastTerritoryStore.get(),
    () => null,
  );
  const { homeDistrict, homeCity } = useUserTerritory();
  const isExplicitTerritoryChange = searchParams.get("trocar") === "territorio";

  if (isExplicitTerritoryChange) {
    return <TerritoryEntryPage />;
  }

  const target =
    lastTerritory?.baseUrl ?? homeDistrict?.path ?? homeCity?.path ?? null;

  if (target && target !== "/") {
    return <Navigate to={target} replace />;
  }

  return <TerritoryEntryPage />;
}
