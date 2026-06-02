/**
 * useBusinessUrls
 *
 * SSOT contextual para URLs publicas do modulo de empresas.
 * Em comunidade curta, gera /:communityAlias/empresas e /:communityAlias/:slug
 * apenas quando a empresa pertence ao territorio atual.
 */

import { LAUNCH_URLS } from '@/config/territory';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import type { BusinessUrlContext } from '@/core/business/services/BusinessUrlService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { useTerritorialContextOptional, type TerritorialLayoutContext } from '@/core/routing/components/TerritorialLayout';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';

export interface BusinessUrls {
  /** Lista de empresas: /santa-cruz/empresas ou fallback /empresas/ba/salvador */
  list: string;
  /**
   * URL publica da empresa.
   * Usa /:communityAlias/:slug quando a empresa pertence ao alias atual.
   * Usa fallback territorial quando nao ha alias ou a empresa esta fora do territorio.
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

function getShortCommunityAlias(context: TerritorialLayoutContext | null): string | null {
  if (!context || context.baseUrl !== context.communityBaseUrl) return null;

  const parts = context.baseUrl.split('/').filter(Boolean);
  return parts.length === 1 ? parts[0] : null;
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

function withCommunityAlias(
  ctx: BusinessUrlContext,
  alias: string | null,
  resolved: ResolvedTerritory | null | undefined,
): BusinessUrlContext {
  if (!alias || !businessBelongsToResolvedTerritory(ctx, resolved)) {
    return ctx;
  }

  return { ...ctx, community_alias: alias };
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
  const { activeLocation } = useActiveTerritory();
  const territorialContext = useTerritorialContextOptional();
  const shortCommunityAlias = getShortCommunityAlias(territorialContext);
  const resolved = routeResolved ?? territorialContext?.resolved ?? null;

  let listUrl: string;

  if (territorialContext) {
    listUrl = shortCommunityAlias
      ? `${territorialContext.baseUrl}/${MODULE_SLUGS.business}`
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
    canonical: (ctx: BusinessUrlContext) =>
      BusinessUrlService.getCanonicalUrl(
        withCommunityAlias(ctx, shortCommunityAlias, resolved),
      ),
    share: (ctx: BusinessUrlContext) =>
      BusinessUrlService.getShareUrl(
        withCommunityAlias(ctx, shortCommunityAlias, resolved),
      ),
    create: businessManagementRoutes.create(),
    edit: (businessId: string) => `/edit-business/${businessId}`,
    dashboard: (businessId: string) => businessManagementRoutes.overview(businessId),
  };
}
