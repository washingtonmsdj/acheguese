/**
 * generateSitemap - Gerador de sitemap dinâmico
 * 
 * Gera sitemap.xml com todas as rotas territoriais e páginas públicas.
 * Deve ser executado em build time ou via API route.
 */

import type { Location, TerritorialGroupWithMembers } from '@/core/location/types';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Gera URLs do sitemap para um território (location ou group)
 */
function generateTerritoryUrls(
  baseUrl: string,
  geographicPath: string,
  isGroup: boolean
): SitemapUrl[] {
  const urls: SitemapUrl[] = [];
  const path = geographicPath.replace('/br', ''); // Remove /br do início

  // Landing page do território
  urls.push({
    loc: `${baseUrl}${path}`,
    changefreq: 'daily',
    priority: isGroup ? 0.9 : 0.8,
  });

  // Módulos do território
  const modules = ['empresas', 'servicos', 'classificados', 'comunidade', 'mobilidade'];
  modules.forEach(module => {
    urls.push({
      loc: `${baseUrl}${path}/${module}`,
      changefreq: 'daily',
      priority: 0.7,
    });
  });

  return urls;
}

/**
 * Gera sitemap completo
 */
export function generateSitemap(
  locations: Location[],
  groups: TerritorialGroupWithMembers[],
  baseUrl = 'https://achegue-se.com'
): string {
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl,
    changefreq: 'daily',
    priority: 1.0,
  });

  // Páginas estáticas
  const staticPages = [
    { path: '/sobre', priority: 0.6 },
    { path: '/contato', priority: 0.6 },
    { path: '/termos', priority: 0.3 },
    { path: '/privacidade', priority: 0.3 },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      changefreq: 'monthly',
      priority: page.priority,
    });
  });

  // Territórios - Locations
  locations
    .filter(loc => loc.status === 'active')
    .forEach(location => {
      const territoryUrls = generateTerritoryUrls(
        baseUrl,
        location.geographic_path,
        false
      );
      urls.push(...territoryUrls);
    });

  // Territórios - Groups
  groups
    .filter(group => group.status === 'active')
    .forEach(group => {
      // Usar geographic_path do primeiro membro + slug do grupo
      const firstMember = group.members?.[0];
      if (firstMember?.geographic_path) {
        const parts = firstMember.geographic_path.split('/').filter(Boolean);
        const groupPath = `/${parts[1]}/${parts[2]}/${group.slug}`;
        const territoryUrls = generateTerritoryUrls(baseUrl, groupPath, true);
        urls.push(...territoryUrls);
      }
    });

  // Gerar XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Exemplo de uso em API route ou build script
 */
export async function generateAndSaveSitemap() {
  // TODO: Buscar locations e groups do banco
  // const locations = await fetchLocations();
  // const groups = await fetchGroups();
  // const xml = generateSitemap(locations, groups);
  // await fs.writeFile('public/sitemap.xml', xml);
  
  console.log('Sitemap generation not implemented yet');
  console.log('TODO: Integrate with database to fetch locations and groups');
}
