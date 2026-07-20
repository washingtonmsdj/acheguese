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
): SitemapUrl[] {
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
    { path: '/inicio', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/ba/salvador', priority: 0.95, changefreq: 'daily' as const },
    { path: '/sobre', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/contato', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/termos', priority: 0.3, changefreq: 'monthly' as const },
    { path: '/privacidade', priority: 0.3, changefreq: 'monthly' as const },
  ];


  staticPages.forEach((page) => {
    urls.push({
      loc: `${normalizedBaseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });


  locations
    .filter((location) => location.status === 'active')
    .forEach((location) => {
      const publicPath = geoPathToPublicUrl(location.geographic_path);
      urls.push(
        ...generateTerritoryUrls(
          normalizedBaseUrl,
          publicPath,
          false,
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
