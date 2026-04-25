import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { geoPathToPublicUrl } from "@/core/routing/utils/territoryUrls";
import { TERRITORY_CONFIG } from "@/config/territory";
import { classifiedUrlService } from "@/core/classifieds/services";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { ClassifiedUrlContext } from "@/core/classifieds/services/ClassifiedUrlService";

export interface ClassifiedUrls {
  list: string;
  detail: (id: string) => string;
  new: string;
  edit: (id: string) => string;
  seller: (sellerId: string) => string;
  canonical: (ctx: ClassifiedUrlContext) => string;
  short: (publicId?: string) => string;
}

export function useClassifiedUrls(routeResolved?: ResolvedTerritory | null): ClassifiedUrls {
  const { activeLocation } = useActiveTerritory();

  let listUrl: string;

  if (routeResolved) {
    if (routeResolved.kind === "group") {
      const firstMember = routeResolved.group.members[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split("/").filter(Boolean);
        listUrl = `/classificados/${parts[1]}/${parts[2]}/${routeResolved.group.slug}`;
      } else {
        listUrl = `/classificados/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
      }
    } else {
      listUrl = `/classificados${geoPathToPublicUrl(routeResolved.location.geographic_path)}`;
    }
  } else if (activeLocation?.geographic_path) {
    listUrl = `/classificados${geoPathToPublicUrl(activeLocation.geographic_path)}`;
  } else {
    listUrl = `/classificados/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  }

  return {
    list: listUrl,
    detail: (id: string) => `/classificados/${id}`,
    new: "/classificados/novo",
    edit: (id: string) => `/classificados/editar/${id}`,
    seller: (sellerId: string) => `/classificados/vendedor/${sellerId}`,
    canonical: (ctx: ClassifiedUrlContext) => classifiedUrlService.buildUrls(ctx).canonical,
    short: (publicId?: string) => `/c/${publicId ?? ""}`,
  };
}
