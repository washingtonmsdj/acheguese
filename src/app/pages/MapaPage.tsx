import { useQuery } from "@tanstack/react-query";
import {
  getActiveMapLayerProviderIds,
} from "@/app/config/mapLayerProviderScope";
import { isPlatformCapabilityEnabled } from "@/app/config/lifecycleRegistry";
import MapaPageV4, {
  type MapaPageV4Props,
} from "@/core/maps/pages/MapaPageV4";
import {
  loadMapLayerProvider,
} from "@/core/maps/providers/registry";
import type {
  MapLayerProviderRuntime,
} from "@/core/maps/providers/types";
import { ModulePageLoader } from "@/shared/components/loading/PageLoader";

async function loadActiveProviders(
  providerIds: ReturnType<typeof getActiveMapLayerProviderIds>,
): Promise<MapLayerProviderRuntime[]> {
  const settled = await Promise.allSettled(
    providerIds.map((providerId) => loadMapLayerProvider(providerId)),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

export default function MapaPage(props: MapaPageV4Props) {
  const providerIds = getActiveMapLayerProviderIds();
  const providerKey = providerIds.join(",");

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["map", "active-layer-providers", providerKey],
    queryFn: () => loadActiveProviders(providerIds),
    enabled: providerIds.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (providerIds.length > 0 && isLoading) {
    return <ModulePageLoader />;
  }

  return (
    <MapaPageV4
      {...props}
      providers={providers}
      nearbyEnabled={isPlatformCapabilityEnabled("nearby")}
    />
  );
}
