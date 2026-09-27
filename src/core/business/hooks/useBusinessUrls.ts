/**
 * useBusinessUrls
 *
 * SSOT contextual para URLs públicas do módulo Empresas.
 * O território é sempre o contêiner canônico; Comunidade é um módulo irmão,
 * nunca um contêiner alternativo para Empresas.
 */

import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { useActiveTerritory } from "@/core/location/hooks/useActiveTerritory";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { BusinessUrlContext } from "@/core/business/services/BusinessUrlService";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from "@/core/routing/utils/territoryUrls";

export interface BusinessUrls {
  /** Lista pública de empresas no território atual. */
  list: string;
  /** URL pública canônica da empresa. */
  canonical: (ctx: BusinessUrlContext) => string;
  /** URL de compartilhamento: /p/:slug para premium, canônica para demais. */
  share: (ctx: BusinessUrlContext) => string;
  /** Criar empresa: /central/empresas/nova */
  create: string;
  /** Editar empresa: /central/empresas/{businessId}/editar */
  edit: (businessId: string) => string;
  /** Gestão da empresa: /central/empresas/{businessId} */
  dashboard: (businessId: string) => string;
}

function buildListUrlFromResolved(
  resolved: ResolvedTerritory | null | undefined,
): string | null {
  if (!resolved) return null;

  if (resolved.kind === "group") {
    const firstMember = resolved.group.members[0];
    if (!firstMember?.geographic_path) return LAUNCH_URLS.business;

    const parts = firstMember.geographic_path.split("/").filter(Boolean);
    const groupBase = buildGroupBaseUrl(
      resolved.group,
      `/${parts[0]}/${parts[1]}/${parts[2]}`,
    );

    return buildModuleTerritoryUrl(MODULE_SLUGS.business, groupBase);
  }

  return buildModuleTerritoryUrl(
    MODULE_SLUGS.business,
    geoPathToPublicUrl(resolved.location.geographic_path),
  );
}

export function useBusinessUrls(
  routeResolved?: ResolvedTerritory | null,
): BusinessUrls {
  const { activeLocation } = useActiveTerritory();
  const territorialContext = useTerritorialContextOptional();
  const resolved = routeResolved ?? territorialContext?.resolved ?? null;

  const listUrl = territorialContext
    ? buildModuleTerritoryUrl(
        MODULE_SLUGS.business,
        territorialContext.baseUrl,
      )
    : buildListUrlFromResolved(resolved) ??
      (activeLocation?.geographic_path
        ? buildModuleTerritoryUrl(
            MODULE_SLUGS.business,
            geoPathToPublicUrl(activeLocation.geographic_path),
          )
        : LAUNCH_URLS.business);

  return {
    list: listUrl,
    canonical: (ctx: BusinessUrlContext) =>
      BusinessUrlService.getCanonicalUrl(ctx),
    share: (ctx: BusinessUrlContext) => BusinessUrlService.getShareUrl(ctx),
    create: businessManagementRoutes.create(),
    edit: (businessId: string) => businessManagementRoutes.edit(businessId),
    dashboard: (businessId: string) =>
      businessManagementRoutes.overview(businessId),
  };
}
