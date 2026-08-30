/**
 * generateSitemap - Gerador de sitemap dinamico
 *
 * Gera sitemap.xml com rotas territoriais canonicas e paginas publicas.
 * Em producao, particiona automaticamente inventarios acima do limite do protocolo.
 */

import { logger } from '@/shared/utils/logger';
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from '@/app/config/launchScope';
import type { Location } from '@/core/location/types';
import { territorialGroupService, type TerritorialGroupWithMembers } from '@/core/territorial';
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';
import { touristPointPublicRoutes } from '@/core/guide/tourist-points/routes/touristPointPublicRoutes';
import { LocationsReadService } from '@/core/location/services/LocationsReadService';
import {
  isTerritoryVisibleInLanding,
  type TerritoryVisibilityMetadata,
} from '@/core/routing/utils/territoryVisibility';
import { readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SitemapArtifact {
  filename: string;
  content: string;
  urlCount: number;
}

interface TerritorySitemapModule {
  surface: LaunchSurfaceKey;
  buildUrl: (territoryPath: string) => string;
}

const SITEMAP_PROTOCOL_MAX_URLS = 50_000;
export const SITEMAP_URL_CHUNK_SIZE = 45_000;

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
  return value.trim().replace(/\/+$/, '');
}

function resolveSitemapBaseUrl(explicitBaseUrl?: string): string {
  const envBaseUrl =
    typeof process !== 'undefined'
      ? process.env.VITE_PUBLIC_SITE_URL || ''
      : '';

  const resolvedBaseUrl = (explicitBaseUrl || envBaseUrl).trim();
  if (!resolvedBaseUrl) {
    throw new Error(
      'Sitemap base URL not configured. Define VITE_PUBLIC_SITE_URL.',
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

function deduplicateSitemapUrls(urls: SitemapUrl[]): SitemapUrl[] {
  const seenLocations = new Set<string>();

  return urls.filter((url) => {
    if (seenLocations.has(url.loc)) return false;
    seenLocations.add(url.loc);
    return true;
  });
}

function collectSitemapUrls(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl: string,
): SitemapUrl[] {
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

  return deduplicateSitemapUrls(urls);
}

function renderSitemapUrlset(urls: SitemapUrl[]): string {
  return [
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
}

function renderSitemapIndex(baseUrl: string, filenames: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...filenames.map((filename) =>
      [
        '  <sitemap>',
        `    <loc>${baseUrl}/${filename}</loc>`,
        '  </sitemap>',
      ].join('\n'),
    ),
    '</sitemapindex>',
  ].join('\n');
}

export function generateSitemap(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl: string,
): string {
  return renderSitemapUrlset(collectSitemapUrls(locations, groups, baseUrl));
}

export function generateSitemapArtifacts(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl: string,
  maxUrlsPerFile = SITEMAP_URL_CHUNK_SIZE,
): SitemapArtifact[] {
  if (
    !Number.isInteger(maxUrlsPerFile) ||
    maxUrlsPerFile <= 0 ||
    maxUrlsPerFile > SITEMAP_PROTOCOL_MAX_URLS
  ) {
    throw new Error(
      `maxUrlsPerFile must be an integer between 1 and ${SITEMAP_PROTOCOL_MAX_URLS}.`,
    );
  }

  const normalizedBaseUrl = resolveSitemapBaseUrl(baseUrl);
  const urls = collectSitemapUrls(locations, groups, normalizedBaseUrl);

  if (urls.length <= maxUrlsPerFile) {
    return [
      {
        filename: 'sitemap.xml',
        content: renderSitemapUrlset(urls),
        urlCount: urls.length,
      },
    ];
  }

  const chunks: SitemapArtifact[] = [];
  for (let offset = 0; offset < urls.length; offset += maxUrlsPerFile) {
    const chunkUrls = urls.slice(offset, offset + maxUrlsPerFile);
    const filename = `sitemap-${chunks.length + 1}.xml`;
    chunks.push({
      filename,
      content: renderSitemapUrlset(chunkUrls),
      urlCount: chunkUrls.length,
    });
  }

  return [
    {
      filename: 'sitemap.xml',
      content: renderSitemapIndex(
        normalizedBaseUrl,
        chunks.map((chunk) => chunk.filename),
      ),
      urlCount: 0,
    },
    ...chunks,
  ];
}

async function removeStaleSitemapChunks(outputDirectory: string): Promise<void> {
  const entries = await readdir(outputDirectory);
  await Promise.all(
    entries
      .filter((entry) => /^sitemap-\d+\.xml$/.test(entry))
      .map((entry) => unlink(resolve(outputDirectory, entry))),
  );
}

export async function generateAndSaveSitemap() {
  const locationsRows = (await LocationsReadService.getAllComplete()) as unknown as Location[];
  const locations = locationsRows
    .filter((location) => location.type === 'city' || location.type === 'district')
    .filter((location) => location.status === 'active')
    .filter((location) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(location.metadata)),
    );

  const groups = (await territorialGroupService.listAllGroups())
    .filter((group) =>
      isTerritoryVisibleInLanding(asTerritoryVisibilityMetadata(group.metadata)),
    );

  const outputDirectory = resolve(process.cwd(), 'public');
  const artifacts = generateSitemapArtifacts(
    locations,
    groups,
    resolveSitemapBaseUrl(),
  );

  await removeStaleSitemapChunks(outputDirectory);

  const rootArtifact = artifacts.find((artifact) => artifact.filename === 'sitemap.xml');
  if (!rootArtifact) {
    throw new Error('Sitemap root artifact was not generated.');
  }

  for (const artifact of artifacts) {
    if (artifact.filename === 'sitemap.xml') continue;
    await writeFile(resolve(outputDirectory, artifact.filename), artifact.content, 'utf8');
  }
  await writeFile(
    resolve(outputDirectory, rootArtifact.filename),
    rootArtifact.content,
    'utf8',
  );

  logger.info('generateAndSaveSitemap.success', {
    outputDirectory,
    files: artifacts.length,
    urls: artifacts.reduce((total, artifact) => total + artifact.urlCount, 0),
    locations: locations.length,
    groups: groups.length,
  });
}
