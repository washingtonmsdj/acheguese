/**
 * generateSitemap - Gerador de sitemap dinamico
 *
 * Gera sitemap.xml com rotas territoriais canonicas e paginas publicas.
 */

import { logger } from '@/shared/utils/logger';
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from '@/config/launchScope';
import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import {
  MODULE_SLUGS,
  buildCommunityAliasUrl,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';
import { touristPointPublicRoutes } from '@/core/verticals/guide/routes/touristPointPublicRoutes';
import { LocationsReadService } from '@/core/location/services/LocationsReadService';
import { TerritorialGroupsReadService } from '@/core/location/services/TerritorialGroupsReadService';
import {
  isTerritoryVisibleInLanding,
  type TerritoryVisibilityMetadata,
} from '@/core/routing/utils/territoryVisibility';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface TerritorySitemapModule {
  surface: LaunchSurfaceKey;
  buildUrl: (territoryPath: string) => string;
}

const TERRITORY_SITEMAP_MODULES: readonly TerritorySitemapModule[] = [
  {
    surface: 'business',
    buildUrl: (territoryPath) => buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryPath),
  },
  {
    surface: 'gastronomy',
    buildUrl: (territoryPath) => buildModuleTerritoryUrl(MODULE_SLUGS.gastronomy, territoryPath),
  },
  {
    surface: 'services',
    buildUrl: (territoryPath) => buildModuleTerritoryUrl(MODULE_SLUGS.services, territoryPath),
  },
  {
    surface: 'classifieds',
    buildUrl: (territoryPath) => buildModuleTerritoryUrl(MODULE_SLUGS.classifieds, territoryPath),
  },
  {
    surface: 'touristPoints',
    buildUrl: (territoryPath) => touristPointPublicRoutes.listFromTerritoryPath(territoryPath),
  },
  {
    surface: 'map',
    buildUrl: (territoryPath) => buildModuleTerritoryUrl(MODULE_SLUGS.map, territoryPath),
  },
];

const COMMUNITY_ALIAS_SITEMAP_SUFFIXES: readonly {
  suffix: string;
  surface: LaunchSurfaceKey;
  changefreq: SitemapUrl['changefreq'];
  priority: number;
}[] = [
  { suffix: 'empresas', surface: 'business', changefreq: 'daily', priority: 0.7 },
  { suffix: 'gastronomia', surface: 'gastronomy', changefreq: 'daily', priority: 0.7 },
  { suffix: 'servicos', surface: 'services', changefreq: 'daily', priority: 0.7 },
  { suffix: 'classificados', surface: 'classifieds', changefreq: 'daily', priority: 0.7 },
  { suffix: 'mapa', surface: 'map', changefreq: 'weekly', priority: 0.6 },
  { suffix: 'feed', surface: 'community', changefreq: 'hourly', priority: 0.8 },
  { suffix: 'grupos', surface: 'community', changefreq: 'daily', priority: 0.7 },
];

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveSitemapBaseUrl(explicitBaseUrl?: string): string {
  const envBaseUrl =
    typeof process !== "undefined"
      ? process.env.VITE_PUBLIC_SITE_URL || ""
      : "";

  const resolvedBaseUrl = (explicitBaseUrl || envBaseUrl).trim();
  if (!resolvedBaseUrl) {
    throw new Error(
      "Sitemap base URL not configured. Define VITE_PUBLIC_SITE_URL.",
    );
  }

  return normalizeBaseUrl(resolvedBaseUrl);
}

function asTerritoryVisibilityMetadata(
  value: unknown,
): TerritoryVisibilityMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as TerritoryVisibilityMetadata;
}

function generateTerritoryUrls(
  baseUrl: string,
  publicPath: string,
  isGroup: boolean,
  communityAlias?: string | null,
): SitemapUrl[] {
  if (communityAlias) {
    return [
      {
        loc: `${baseUrl}${buildCommunityAliasUrl(communityAlias)}`,
        changefreq: 'daily',
        priority: isGroup ? 0.9 : 0.8,
      },
      ...COMMUNITY_ALIAS_SITEMAP_SUFFIXES
        .filter((item) => isLaunchSurfaceEnabled(item.surface))
        .map((item) => ({
          loc: `${baseUrl}${buildCommunityAliasUrl(communityAlias, item.suffix)}`,
          changefreq: item.changefreq,
          priority: item.priority,
        })),
    ];
  }

  const urls: SitemapUrl[] = [
    {
      loc: `${baseUrl}${publicPath}`,
      changefreq: 'daily',
      priority: isGroup ? 0.9 : 0.8,
    },
  ];

  TERRITORY_SITEMAP_MODULES.filter((module) => isLaunchSurfaceEnabled(module.surface)).forEach((module) => {
    urls.push({
      loc: `${baseUrl}${module.buildUrl(publicPath)}`,
      changefreq: 'daily',
      priority: 0.7,
    });
  });

  return urls;
}

function getDistrictAliasFromPublicPath(publicPath: string): string | null {
  const parts = publicPath.split('/').filter(Boolean);
  return parts.length === 3 ? parts[2] : null;
}

function incrementAliasCount(counts: Map<string, number>, alias: string | null | undefined) {
  if (!alias) return;
  counts.set(alias, (counts.get(alias) ?? 0) + 1);
}

export function generateSitemap(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl: string,
): string {
  const normalizedBaseUrl = resolveSitemapBaseUrl(baseUrl);
  const urls: SitemapUrl[] = [
    {
      loc: normalizedBaseUrl,
      changefreq: 'daily',
      priority: 1.0,
    },
  ];

  const staticPages = [
    { path: '/sobre', priority: 0.6 },
    { path: '/contato', priority: 0.6 },
    { path: '/termos', priority: 0.3 },
    { path: '/privacidade', priority: 0.3 },
  ];

  staticPages.forEach((page) => {
    urls.push({
      loc: `${normalizedBaseUrl}${page.path}`,
      changefreq: 'monthly',
      priority: page.priority,
    });
  });

  const aliasCounts = new Map<string, number>();
  locations
    .filter((location) => location.status === 'active' && location.type === 'district')
    .forEach((location) => {
      incrementAliasCount(
        aliasCounts,
        getDistrictAliasFromPublicPath(geoPathToPublicUrl(location.geographic_path)),
      );
    });
  groups
    .filter((group) => group.status === 'active')
    .forEach((group) => incrementAliasCount(aliasCounts, group.slug));

  const getUniqueAlias = (alias: string | null | undefined) =>
    alias && aliasCounts.get(alias) === 1 ? alias : null;

  locations
    .filter((location) => location.status === 'active')
    .forEach((location) => {
      const publicPath = geoPathToPublicUrl(location.geographic_path);
      urls.push(
        ...generateTerritoryUrls(
          normalizedBaseUrl,
          publicPath,
          false,
          location.type === 'district'
            ? getUniqueAlias(getDistrictAliasFromPublicPath(publicPath))
            : null,
        ),
      );
    });

  groups
    .filter((group) => group.status === 'active')
    .forEach((group) => {
      const firstMember = group.members?.[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupPath = buildGroupBaseUrl(group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        urls.push(
          ...generateTerritoryUrls(
            normalizedBaseUrl,
            groupPath,
            true,
            getUniqueAlias(group.slug),
          ),
        );
      }
    });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) =>
      [
        '  <url>',
        `    <loc>${url.loc}</loc>`,
        url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : null,
        url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : null,
        url.priority !== undefined ? `    <priority>${url.priority}</priority>` : null,
        '  </url>',
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
    ),
    '</urlset>',
  ].join('\n');

  return xml;
}

export async function generateAndSaveSitemap() {
  const locationsRows = (await LocationsReadService.getAll()) as unknown as Location[];
  const locations = locationsRows
    .filter((location) => location.type === "city" || location.type === "district")
    .filter((location) => location.status === "active")
    .filter((location) =>
    isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(location.metadata)),
  );

  const groups = (await TerritorialGroupsReadService.listActiveGroups())
    .filter((group) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(group.metadata)),
    ) as TerritorialGroupWithMembers[];

  const sitemap = generateSitemap(locations, groups, resolveSitemapBaseUrl());
  const outputPath = resolve(process.cwd(), 'public', 'sitemap.xml');
  await writeFile(outputPath, sitemap, 'utf8');

  logger.info('generateAndSaveSitemap.success', {
    outputPath,
    locations: locations.length,
    groups: groups.length,
  });
}
