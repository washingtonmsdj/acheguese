/**
 * ServiceAreaSettings - boundary de UI para gerenciamento de áreas de serviço
 *
 * Fluxo SSOT:
 * ServiceAreasManager -> useServiceAreas hooks -> ServiceAreasService
 */

import { ServiceAreasManager } from "@/core/service-areas/components/ServiceAreasManager";

interface ServiceAreaSettingsProps {
  driverProfileId: string;
  mainNeighborhood?: string;
  mainCity?: string;
}

export function ServiceAreaSettings({
  driverProfileId,
}: ServiceAreaSettingsProps) {
  return <ServiceAreasManager profileId={driverProfileId} />;
}
