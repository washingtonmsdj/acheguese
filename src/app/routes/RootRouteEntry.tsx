/**
 * RootRouteEntry
 *
 * Sprint JOURNEY.1 — Correção C2 (Friction Map).
 *
 * Se o usuário já tem um território ativo/anterior, redireciona `/` para a
 * Territory Home desse bairro, evitando cair sempre no Selector.
 * Caso contrário, renderiza o Selector (AchegueSeHomePage) normalmente.
 */
import { useSyncExternalStore } from "react";
import { Navigate } from "react-router-dom";
import AchegueSeHomePage from "@/app/pages/AchegueSeHomePage";
import { lastTerritoryStore, type LastTerritory } from "@/core/routing/stores/LastTerritoryStore";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";

export default function RootRouteEntry() {
  const lastTerritory = useSyncExternalStore<LastTerritory | null>(
    (listener) => lastTerritoryStore.subscribe(listener),
    () => lastTerritoryStore.get(),
    () => null,
  );
  const { homeDistrict, homeCity } = useUserTerritory();

  const target =
    lastTerritory?.baseUrl ??
    homeDistrict?.path ??
    homeCity?.path ??
    null;

  if (target && target !== "/") {
    return <Navigate to={target} replace />;
  }

  return <AchegueSeHomePage />;
}
