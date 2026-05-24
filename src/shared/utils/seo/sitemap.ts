/**
 * Dynamic Sitemap Generator
 * 
 * Generates sitemap.xml dynamically based on application routes and data.
 * 
 * Features:
 * - Static pages
 * - Dynamic pages (businesses, events, etc.)
 * - Priority and change frequency
 * - Last modified dates
 * 
 * @module SitemapGenerator
 * @version 1.0.0
 */

import { LAUNCH_CITY_PATH, LAUNCH_COMMUNITY_TERRITORY_PATH, LAUNCH_URLS } from '@/config/territory';
import { getPublicSiteOrigin } from '@/shared/config/brand';

export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Static pages configuration
 */
const STATIC_PAGES: SitemapURL[] = [
  {
    loc: '/',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    loc: '/gastronomia',
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: '/mobilidade',
    changefreq: 'hourly',
    priority: 0.9,
  },
  {
    loc: '/classificados',
    changefreq: 'hourly',
    priority: 0.8,
  },
  {
    loc: '/eventos',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: LAUNCH_URLS.community,
    changefreq: 'hourly',
    priority: 0.8,
  },
  {
    loc: LAUNCH_CITY_PATH,
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: LAUNCH_COMMUNITY_TERRITORY_PATH,
    changefreq: 'daily',
    priority: 0.9,
  },
  {
    loc: `/empresas${LAUNCH_COMMUNITY_TERRITORY_PATH}`,
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: `/servicos${LAUNCH_COMMUNITY_TERRITORY_PATH}`,
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: `${LAUNCH_URLS.community}/feed`,
    changefreq: 'hourly',
    priority: 0.8,
  },
  {
    loc: '/profissionais',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    loc: '/sobre',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    loc: '/contato',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    loc: '/privacidade',
    changefreq: 'monthly',
    priority: 0.3,
  },
  {
    loc: '/termos',
    changefreq: 'monthly',
    priority: 0.3,
  },
  {
    loc: '/cookies',
    changefreq: 'monthly',
    priority: 0.3,
  },
];

/**
 * Generate sitemap XML
 */
export function generateSitemapXML(urls: SitemapURL[], baseUrl: string = getPublicSiteOrigin()): string {
  const urlEntries = urls.map((url) => {
    const loc = `${baseUrl}${url.loc}`;
    const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : '';
    const changefreq = url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : '';
    const priority = url.priority !== undefined ? `<priority>${url.priority}</priority>` : '';
    
    return `  <url>
    <loc>${loc}</loc>${lastmod}${changefreq}${priority}
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Get static pages
 */
export function getStaticPages(): SitemapURL[] {
  return STATIC_PAGES;
}

/**
 * Generate dynamic business URLs
 * 
 * This should be called with actual business data from the database.
 */
export function generateBusinessURLs(businesses: Array<{ slug: string; updated_at: string }>): SitemapURL[] {
  return businesses.map((business) => ({
    loc: `/negocios/${business.slug}`,
    lastmod: business.updated_at,
    changefreq: 'weekly',
    priority: 0.7,
  }));
}

/**
 * Generate dynamic event URLs
 */
export function generateEventURLs(events: Array<{ id: string; updated_at: string }>): SitemapURL[] {
  return events.map((event) => ({
    loc: `/eventos/${event.id}`,
    lastmod: event.updated_at,
    changefreq: 'daily',
    priority: 0.6,
  }));
}

/**
 * Generate dynamic classified URLs
 */
export function generateClassifiedURLs(classifieds: Array<{ id: string; updated_at: string }>): SitemapURL[] {
  return classifieds.map((classified) => ({
    loc: `/classificados/${classified.id}`,
    lastmod: classified.updated_at,
    changefreq: 'daily',
    priority: 0.6,
  }));
}

/**
 * Generate complete sitemap
 * 
 * Combines static and dynamic URLs.
 */
export async function generateCompleteSitemap(
  baseUrl: string = getPublicSiteOrigin()
): Promise<string> {
  const urls: SitemapURL[] = [
    ...getStaticPages(),
    // TODO: Add dynamic URLs from database
    // ...await fetchBusinessURLs(),
    // ...await fetchEventURLs(),
    // ...await fetchClassifiedURLs(),
  ];
  
  return generateSitemapXML(urls, baseUrl);
}

/**
 * Generate sitemap index
 * 
 * For large sites with multiple sitemaps.
 */
export function generateSitemapIndex(
  sitemaps: Array<{ loc: string; lastmod?: string }>,
  baseUrl: string = getPublicSiteOrigin(),
): string {
  const sitemapEntries = sitemaps.map((sitemap) => {
    const loc = `${baseUrl}${sitemap.loc}`;
    const lastmod = sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : '';
    
    return `  <sitemap>
    <loc>${loc}</loc>${lastmod}
  </sitemap>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}
