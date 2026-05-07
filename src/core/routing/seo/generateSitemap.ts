/**
 * generateSitemap - Gerador de sitemap dinamico
 *
 * Gera sitemap.xml com rotas territoriais canonicas e paginas publicas.
 */

import { logger } from '@/shared/utils/logger';
import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
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

  const modules = [
    MODULE_SLUGS.business,
    MODULE_SLUGS.services,
    MODULE_SLUGS.classifieds,
    MODULE_SLUGS.community,
    MODULE_SLUGS.mobility,
  ];

  modules.forEach((module) => {
    urls.push({
      loc: `${baseUrl}${buildModuleTerritoryUrl(module, publicPath)}`,
      changefreq: 'daily',
      priority: 0.7,
    });
  });

  if (isGroup) {
    urls.push(
      {
        loc: `${baseUrl}${buildModuleTerritoryUrl(MODULE_SLUGS.community, publicPath)}/feed`,
        changefreq: 'hourly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}${buildModuleTerritoryUrl(MODULE_SLUGS.community, publicPath)}/grupos`,
        changefreq: 'daily',
        priority: 0.7,
      },
    );
  }

  return urls;
}

export function generateSitemap(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl = 'https://acheguese.com.br',
): string {
  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
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
      loc: `${baseUrl}${page.path}`,
      changefreq: 'monthly',
      priority: page.priority,
    });
  });

  locations
    .filter((location) => location.status === 'active')
    .forEach((location) => {
      urls.push(...generateTerritoryUrls(baseUrl, geoPathToPublicUrl(location.geographic_path), false));
    });

  groups
    .filter((group) => group.status === 'active')
    .forEach((group) => {
      const firstMember = group.members?.[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupPath = buildGroupBaseUrl(group, `/${parts[0]}/${parts[1]}/${parts[2]}`);
        urls.push(...generateTerritoryUrls(baseUrl, groupPath, true));
      }
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

export async function generateAndSaveSitemap() {
  logger.debug('Sitemap generation not implemented yet');
  logger.debug('TODO: Integrate with database to fetch locations and groups');
}
