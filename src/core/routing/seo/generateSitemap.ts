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
  buildCommunityTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';
import { supabase } from '@/integrations/supabase';
import { isTerritoryVisibleInLanding } from '@/core/routing/utils/territoryVisibility';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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
    MODULE_SLUGS.mobility,
  ];

  modules.forEach((module) => {
    urls.push({
      loc: `${baseUrl}${buildModuleTerritoryUrl(module, publicPath)}`,
      changefreq: 'daily',
      priority: 0.7,
    });
  });

  // Comunidade usa padrão canônico sem /area/
  urls.push({
    loc: `${baseUrl}${buildCommunityTerritoryUrl(publicPath)}`,
    changefreq: 'daily',
    priority: 0.7,
  });

  if (isGroup) {
    urls.push(
      {
        loc: `${baseUrl}${buildCommunityTerritoryUrl(publicPath, 'feed')}`,
        changefreq: 'hourly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}${buildCommunityTerritoryUrl(publicPath, 'grupos')}`,
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
  const { data: locationsRows, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .in('type', ['city', 'district'])
    .eq('status', 'active');

  if (locationsError) {
    logger.error('generateAndSaveSitemap.locations', locationsError);
    throw locationsError;
  }

  const locations = ((locationsRows as Location[] | null) ?? []).filter((location) =>
    isTerritoryVisibleInLanding(location.metadata),
  );

  const { data: groupsRows, error: groupsError } = await supabase
    .from('territorial_groups')
    .select('*')
    .eq('status', 'active');

  if (groupsError) {
    logger.error('generateAndSaveSitemap.groups', groupsError);
    throw groupsError;
  }

  const activeGroups = (groupsRows ?? []).filter((group) =>
    isTerritoryVisibleInLanding(group.metadata),
  );

  const groupIds = activeGroups.map((group) => group.id);
  const membersByGroup = new Map<string, Location[]>();

  if (groupIds.length > 0) {
    const { data: membersRows, error: membersError } = await supabase
      .from('territorial_group_members')
      .select('group_id, location:locations!location_id(*)')
      .in('group_id', groupIds);

    if (membersError) {
      logger.error('generateAndSaveSitemap.groupMembers', membersError);
      throw membersError;
    }

    for (const member of membersRows ?? []) {
      const row = member as {
        group_id: string;
        location?: Location | null;
      };
      if (!row.group_id || !row.location) continue;
      const current = membersByGroup.get(row.group_id) ?? [];
      current.push(row.location);
      membersByGroup.set(row.group_id, current);
    }
  }

  const groups: TerritorialGroupWithMembers[] = activeGroups.map((group) => ({
    ...(group as TerritorialGroupWithMembers),
    members: membersByGroup.get(group.id) ?? [],
  }));

  const sitemap = generateSitemap(locations, groups);
  const outputPath = resolve(process.cwd(), 'public', 'sitemap.xml');
  await writeFile(outputPath, sitemap, 'utf8');

  logger.info('generateAndSaveSitemap.success', {
    outputPath,
    locations: locations.length,
    groups: groups.length,
  });
}
