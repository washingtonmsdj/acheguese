import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { buildGroupBaseUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { TERRITORY_CONFIG } from "@/config/territory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface ServiceUrls {
  list: string;
  detail: (id: string) => string;
  register: string;
  edit: (id: string) => string;
}

export function useServiceUrls(routeResolved?: ResolvedTerritory | null): ServiceUrls {
  const { activeLocation } = useActiveTerritory();

  let listUrl: string;

  if (routeResolved) {
    if (routeResolved.kind === "group") {
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split("/").filter(Boolean);
        const groupBase = buildGroupBaseUrl(routeResolved.group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.services, groupBase);
      } else {
        listUrl = `/servicos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      listUrl = `/servicos${geoPathToPublicUrl(routeResolved.location.geographic_path)}`;
    }
  } else if (activeLocation?.geographic_path) {
    listUrl = `/servicos${geoPathToPublicUrl(activeLocation.geographic_path)}`;
  } else {
    listUrl = `/servicos/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  return {
    list: listUrl,
    detail: (id: string) => `/services/${id}`,
    register: "/services/cadastrar",
    edit: (id: string) => `/services/${id}/editar`,
  };
}
