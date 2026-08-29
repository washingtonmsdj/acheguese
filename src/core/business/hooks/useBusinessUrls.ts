/**
 * useBusinessUrls
 *
 * SSOT contextual para URLs publicas do modulo de empresas.
 * Em comunidade, gera /comunidade/:communityAlias/empresas/:slug apenas quando
 * a empresa pertence ao territorio atual. Fora da comunidade, sempre usa URL
 * publica em /empresas.
 */

import { LAUNCH_URLS } from '@/core/routing/config/territory';
import { useLocation } from 'react-router-dom';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import type { BusinessUrlContext } from '@/core/business/services/BusinessUrlService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { useTerritorialContextOptional, type TerritorialLayoutContext } from '@/core/routing/components/TerritorialLayout';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { buildCommunityPortalUrl } from '@/core/routing/policies';
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';

export interface BusinessUrls {
  /** Lista de empresas publica ou comunitaria conforme contexto explicito. */
  list: string;
  /**
   * URL publica da empresa.
   * Usa /comunidade/:communityAlias/empresas/:slug quando a empresa pertence
   * ao contexto comunitario atual. Usa /empresas quando nao ha contexto.
   */
  canonical: (ctx: BusinessUrlContext) => string;
  /** URL de compartilhamento: /p/:slug para premium, canonica para demais. */
  share: (ctx: BusinessUrlContext) => string;
  /** Criar empresa: /central/empresas/nova */
  create: string;
  /** Editar empresa: /edit-business/{businessId} (global) */
  edit: (businessId: string) => string;
  /** Gestao da empresa: /central/empresas/{businessId} (global) */
  dashboard: (businessId: string) => string;
}

function isPathInsideBase(pathname: string, baseUrl: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/g, '') || '/';
  const normalizedBase = baseUrl.replace(/\/+$/g, '') || '/';
  return normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`);
}

function getCommunityAlias(context: TerritorialLayoutContext | null, pathname: string): string | null {
  if (!context || !isPathInsideBase(pathname, context.communityBaseUrl)) return null;

  const parts = context.communityBaseUrl.split('/').filter(Boolean);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2 && parts[0] === MODULE_SLUGS.community) return parts[1];
  return null;
}

function businessBelongsToResolvedTerritory(
  ctx: BusinessUrlContext,
  resolved: ResolvedTerritory | null | undefined,
): boolean {
  if (!ctx.geographic_path || !resolved) return false;

  if (resolved.kind === 'group') {
    return resolved.group.members.some(
      (member) => member.geographic_path === ctx.geographic_path,
    );
  }

  const territoryPath = resolved.location.geographic_path;
  const territoryParts = territoryPath.split('/').filter(Boolean);

  if (territoryParts.length >= 4) {
    return ctx.geographic_path === territoryPath;
  }

  return ctx.geographic_path.startsWith(`${territoryPath}/`);
}

function buildListUrlFromResolved(resolved: ResolvedTerritory | null | undefined): string | null {
  if (!resolved) return null;

  if (resolved.kind === 'group') {
    const firstMember = resolved.group.members[0];
    if (!firstMember?.geographic_path) return LAUNCH_URLS.business;

    const parts = firstMember.geographic_path.split('/').filter(Boolean);
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

export function useBusinessUrls(routeResolved?: ResolvedTerritory | null): BusinessUrls {
  const { pathname } = useLocation();
  const { activeLocation } = useActiveTerritory();
  const territorialContext = useTerritorialContextOptional();
  const communityAlias = getCommunityAlias(territorialContext, pathname);
  const resolved = routeResolved ?? territorialContext?.resolved ?? null;

  let listUrl: string;

  if (territorialContext) {
    listUrl = communityAlias
      ? buildCommunityPortalUrl(communityAlias, MODULE_SLUGS.business)
      : buildModuleTerritoryUrl(MODULE_SLUGS.business, territorialContext.baseUrl);
  } else {
    listUrl =
      buildListUrlFromResolved(resolved) ??
      (activeLocation?.geographic_path
        ? buildModuleTerritoryUrl(
            MODULE_SLUGS.business,
            geoPathToPublicUrl(activeLocation.geographic_path),
          )
        : LAUNCH_URLS.business);
  }

  return {
    list: listUrl,
    canonical: (ctx: BusinessUrlContext) => {
      if (communityAlias && businessBelongsToResolvedTerritory(ctx, resolved)) {
        return BusinessUrlService.getCommunityScopedUrl(ctx, communityAlias);
      }

      return BusinessUrlService.getCanonicalUrl(ctx);
    },
    share: (ctx: BusinessUrlContext) => BusinessUrlService.getShareUrl(ctx),
    create: businessManagementRoutes.create(),
    edit: (businessId: string) => `/edit-business/${businessId}`,
    dashboard: (businessId: string) => businessManagementRoutes.overview(businessId),
  };
}
