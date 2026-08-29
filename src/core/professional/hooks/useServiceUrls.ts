import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { ProfessionalUrlService } from "@/core/professional/services/ProfessionalUrlService";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";
import { buildGroupBaseUrl, buildModuleTerritoryUrl, geoPathToPublicUrl, MODULE_SLUGS } from "@/core/routing/utils/territoryUrls";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export interface ServiceDetailUrlInput {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  geographic_path?: string | null;
  geographicPath?: string | null;
  state?: string | null;
  city?: string | null;
}

export interface ServiceUrls {
  list: string;
  detail: (target: ServiceDetailUrlInput | string) => string;
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
        listUrl = LAUNCH_URLS.services;
      }
    } else {
      listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.services, geoPathToPublicUrl(routeResolved.location.geographic_path));
    }
  } else if (activeLocation?.geographic_path) {
    listUrl = buildModuleTerritoryUrl(MODULE_SLUGS.services, geoPathToPublicUrl(activeLocation.geographic_path));
  } else {
    listUrl = LAUNCH_URLS.services;
  }

  return {
    list: listUrl,
    detail: (target: ServiceDetailUrlInput | string) => {
      if (typeof target === "string") return listUrl;
      return ProfessionalUrlService.getCanonicalUrlFromTarget(target) ?? listUrl;
    },
    register: professionalPublicRoutes.register(),
    edit: (id: string) => `/servicos/${id}/editar`,
  };
}
