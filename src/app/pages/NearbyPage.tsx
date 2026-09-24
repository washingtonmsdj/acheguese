import { getActiveNearbyProviderIds } from "@/app/config/nearbyProviderScope";
import NearbyExperiencePage from "@/core/nearby/pages/NearbyPage";

export default function NearbyPage() {
  return <NearbyExperiencePage providerIds={getActiveNearbyProviderIds()} />;
}
